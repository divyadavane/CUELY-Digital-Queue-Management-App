"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  CalendarDays,
  CalendarOff,
  CheckCircle2,
  Clock,
  Loader2,
  Plus,
  Save,
  Settings2,
  Trash2,
  X,
  AlertTriangle,
} from "lucide-react";

const DAYS = [
  { idx: 0, label: "Sun" },
  { idx: 1, label: "Mon" },
  { idx: 2, label: "Tue" },
  { idx: 3, label: "Wed" },
  { idx: 4, label: "Thu" },
  { idx: 5, label: "Fri" },
  { idx: 6, label: "Sat" },
];

const TYPES = ["routine", "urgent", "critical", "follow_up", "other"];

interface ShiftRow {
  key: string;
  start: string;
  end: string;
  duration: number;
  buffer: number;
}

interface Schedule {
  id: string;
  title: string;
  effective_from: string;
  effective_to: string | null;
  shifts: { day_of_week: number; start_time: string; end_time: string; slot_duration_mins: number; buffer_mins: number }[];
}

interface LeaveBlock {
  id: string;
  title: string;
  block_type: string;
  start_date: string;
  end_date: string;
  start_time: string | null;
  end_time: string | null;
  recurrence: string;
  status: string;
  notes: string | null;
}

interface SlotConfig {
  id: string;
  appointment_type: string;
  duration_mins: number;
  buffer_mins: number;
  overbooking: number;
}

interface Conflict {
  appointment_id: string;
  patient_name: string | null;
  patient_phone: string;
  appointment_date: string;
  appointment_time: string | null;
  doctor_name: string | null;
}

interface DayAvail {
  date: string;
  weekday: number;
  is_working: boolean;
  is_blocked: boolean;
  leave_blocks: LeaveBlock[];
  booked_count: number;
  available_slots: { available: boolean }[];
}

interface SchedulePanelProps {
  queueId: string;
  doctorName: string;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function in7Days(): string {
  const d = new Date();
  d.setDate(d.getDate() + 6);
  return d.toISOString().slice(0, 10);
}

const emptyShifts = (): Record<number, ShiftRow[]> =>
  DAYS.reduce((acc, d) => ({ ...acc, [d.idx]: [] }), {});

let shiftKey = 0;
const newShift = (): ShiftRow => {
  shiftKey += 1;
  return { key: `s${shiftKey}`, start: "09:00", end: "13:00", duration: 15, buffer: 0 };
};

export function SchedulePanel({ queueId, doctorName }: SchedulePanelProps) {
  const [tab, setTab] = useState<"hours" | "leave" | "slots" | "week">("week");
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [shifts, setShifts] = useState<Record<number, ShiftRow[]>>(emptyShifts);
  const [effectiveFrom, setEffectiveFrom] = useState(today());
  const [blocks, setBlocks] = useState<LeaveBlock[]>([]);
  const [configs, setConfigs] = useState<SlotConfig[]>([]);
  const [week, setWeek] = useState<DayAvail[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [conflicts, setConflicts] = useState<Conflict[] | null>(null);
  const [pendingBlock, setPendingBlock] = useState<any>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [schedRes, blockRes, configRes, weekRes] = await Promise.all([
        fetch(`/api/dashboard/schedules?queueId=${encodeURIComponent(queueId)}`),
        fetch(`/api/dashboard/leave-blocks?queueId=${encodeURIComponent(queueId)}`),
        fetch(`/api/dashboard/slot-configs?queueId=${encodeURIComponent(queueId)}`),
        fetch(
          `/api/dashboard/availability?queueId=${encodeURIComponent(queueId)}&startDate=${today()}&endDate=${in7Days()}`
        ),
      ]);
      const sched = await schedRes.json().catch(() => ({}));
      const blocksJson = await blockRes.json().catch(() => ({}));
      const configJson = await configRes.json().catch(() => ({}));
      const weekJson = await weekRes.json().catch(() => ({}));

      setSchedules(sched.schedules || []);
      setBlocks((blocksJson.blocks || []).filter((b: LeaveBlock) => b.status !== "cancelled"));
      setConfigs(configJson.configs || []);
      setWeek(weekJson.days || []);

      // initialise shift grid from the latest schedule
      const latest = (sched.schedules || [])[0];
      const grid = emptyShifts();
      if (latest?.shifts) {
        latest.shifts.forEach((s: any) => {
          const row = {
            key: `load${Math.random().toString(36).slice(2)}`,
            start: s.start_time?.slice(0, 5) || "09:00",
            end: s.end_time?.slice(0, 5) || "13:00",
            duration: s.slot_duration_mins,
            buffer: s.buffer_mins,
          };
          grid[s.day_of_week] = [...(grid[s.day_of_week] || []), row];
        });
      }
      setShifts(grid);
      if (latest?.effective_from) setEffectiveFrom(latest.effective_from);
    } catch {
      toast.error("Failed to load schedule data");
    } finally {
      setLoading(false);
    }
  }, [queueId]);

  useEffect(() => {
    load();
  }, [load]);

  const latestSchedule = useMemo(() => schedules[0], [schedules]);
  const availableCount = useMemo(
    () => week.reduce((sum, d) => sum + d.available_slots.filter((s) => s.available).length, 0),
    [week]
  );

  const updateShift = (day: number, key: string, patch: Partial<ShiftRow>) => {
    setShifts((prev) => ({
      ...prev,
      [day]: (prev[day] || []).map((r) => (r.key === key ? { ...r, ...patch } : r)),
    }));
  };

  const saveHours = async () => {
    const flat: any[] = [];
    DAYS.forEach((d) => {
      (shifts[d.idx] || []).forEach((r) => {
        if (r.start && r.end) {
          flat.push({
            day_of_week: d.idx,
            start_time: r.start,
            end_time: r.end,
            slot_duration_mins: Number(r.duration) || 15,
            buffer_mins: Number(r.buffer) || 0,
            max_patients: 20,
          });
        }
      });
    });
    if (flat.length === 0) {
      toast.error("Add at least one working-hour shift before saving.");
      return;
    }
    setSaving(true);
    try {
      const body = {
        queueId,
        title: "Working hours",
        effectiveFrom: effectiveFrom,
        effectiveTo: null,
        shifts: flat,
      };
      const target =
        latestSchedule && latestSchedule.effective_from === effectiveFrom
          ? `/api/dashboard/schedules/${latestSchedule.id}`
          : "/api/dashboard/schedules";
      const res = await fetch(target, {
        method: latestSchedule && latestSchedule.effective_from === effectiveFrom ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Failed to save");
      toast.success(latestSchedule && latestSchedule.effective_from === effectiveFrom ? "Hours updated" : "New schedule created");
      await load();
    } catch (e: any) {
      toast.error(e?.message || "Failed to save hours");
    } finally {
      setSaving(false);
    }
  };

  // ---- leave blocks ----
  const [leaveForm, setLeaveForm] = useState({
    title: "",
    scope: "doctor", // doctor | business
    blockType: "full_day",
    startDate: today(),
    endDate: today(),
    startTime: "09:00",
    endTime: "13:00",
    recurrence: "none",
    recurringDays: [1, 2, 3, 4, 5],
    notes: "",
  });

  const submitBlock = async (confirm: boolean) => {
    const f = leaveForm;
    if (!f.title) {
      toast.error("Give the block a name (e.g. Surgery day / Leave).");
      return;
    }
    setSaving(true);
    try {
      const body: any = {
        title: f.title,
        blockType: f.blockType,
        startDate: f.startDate,
        endDate: f.endDate,
        recurrence: f.recurrence,
        recurringDays: f.recurringDays,
        notes: f.notes || null,
        confirmConflicts: confirm,
      };
      if (f.scope === "doctor") {
        body.queueId = queueId;
        body.doctorName = doctorName;
      } else {
        body.queueId = null;
      }
      if (f.blockType === "partial") {
        body.startTime = f.startTime;
        body.endTime = f.endTime;
      }
      const res = await fetch("/api/dashboard/leave-blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      if (res.status === 409) {
        setConflicts(json.conflicts || []);
        setPendingBlock(body);
        return;
      }
      if (!res.ok) throw new Error(json?.error || "Failed to create block");
      toast.success("Leave block created");
      setConflicts(null);
      setPendingBlock(null);
      await load();
    } catch (e: any) {
      toast.error(e?.message || "Failed to create block");
    } finally {
      setSaving(false);
    }
  };

  const cancelBlock = async (id: string) => {
    const res = await fetch(
      `/api/dashboard/leave-blocks/${id}?queueId=${encodeURIComponent(queueId)}`,
      { method: "DELETE" }
    );
    if (res.ok) {
      toast.success("Block removed");
      load();
    } else {
      toast.error("Failed to remove block");
    }
  };

  // ---- slot configs ----
  const updateConfig = (type: string, patch: Partial<SlotConfig>) => {
    setConfigs((prev) =>
      prev.map((c) => (c.appointment_type === type ? { ...c, ...patch } : c))
    );
  };

  const saveConfigs = async () => {
    setSaving(true);
    try {
      for (const c of configs) {
        const res = await fetch("/api/dashboard/slot-configs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            queueId,
            appointmentType: c.appointment_type,
            durationMins: c.duration_mins,
            bufferMins: c.buffer_mins,
            overbooking: c.overbooking,
          }),
        });
        if (!res.ok) throw new Error("Failed to save slot config");
      }
      toast.success("Slot settings saved");
      await load();
    } catch (e: any) {
      toast.error(e?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-slate-900/80 border border-white/10 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-10 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/80 border border-white/10 rounded-3xl overflow-hidden shadow-xl">
      <div className="p-6 border-b border-white/10 flex items-center justify-between flex-wrap gap-4 bg-white/5">
        <div>
          <h2 className="font-bold text-lg text-white font-sans flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-blue-400" />
            Schedule & Availability
          </h2>
          <p className="text-xs text-slate-400">Working hours, leave blocks and slot capacity for {doctorName}</p>
        </div>
        <div className="flex items-center gap-1 bg-slate-950/60 border border-white/10 rounded-xl p-1">
          {(
            [
              ["week", "Calendar"],
              ["hours", "Hours"],
              ["leave", "Leave"],
              ["slots", "Slots"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
                tab === key ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        {tab === "week" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap text-xs">
              <span className="flex items-center gap-1.5 text-slate-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Available
              </span>
              <span className="flex items-center gap-1.5 text-slate-400">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Working
              </span>
              <span className="flex items-center gap-1.5 text-slate-400">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Blocked
              </span>
              <span className="ml-auto font-bold text-white">
                {availableCount} slots open in next 7 days
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-7 gap-3">
              {week.map((d) => {
                const blocked = d.is_blocked;
                const off = !d.is_working && !blocked;
                return (
                  <div
                    key={d.date}
                    className={`rounded-2xl border p-3 ${
                      blocked
                        ? "bg-red-500/10 border-red-500/30"
                        : off
                        ? "bg-slate-950/40 border-white/5"
                        : "bg-emerald-500/5 border-emerald-500/20"
                    }`}
                  >
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.weekday]} ·{" "}
                      {new Date(`${d.date}T00:00:00`).toLocaleDateString([], { day: "2-digit", month: "short" })}
                    </p>
                    <p className="text-sm font-bold mt-1 flex items-center gap-1.5">
                      {blocked ? (
                        <>
                          <CalendarOff className="w-4 h-4 text-red-400" /> Blocked
                        </>
                      ) : off ? (
                        "No hours"
                      ) : (
                        <>
                          <Clock className="w-4 h-4 text-emerald-400" />
                          {d.available_slots.filter((s) => s.available).length} slots
                        </>
                      )}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{d.booked_count} booked</p>
                    {d.leave_blocks.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {d.leave_blocks.map((b) => (
                          <p key={b.id} className="text-[10px] text-red-300 truncate">
                            {b.block_type === "partial" ? "Partial: " : ""}
                            {b.title}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === "hours" && (
          <div className="space-y-5">
            <div className="flex items-center gap-3 flex-wrap">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Effective from
                </label>
                <input
                  type="date"
                  value={effectiveFrom}
                  onChange={(e) => setEffectiveFrom(e.target.value)}
                  className="bg-black/30 border border-white/10 text-white text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-blue-400"
                />
              </div>
              <div className="text-[11px] text-slate-400 mt-5">
                {latestSchedule
                  ? `Editing "${latestSchedule.title}" (from ${latestSchedule.effective_from})`
                  : "No working hours set yet — add your first schedule."}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {DAYS.map((d) => {
                const dayShifts = shifts[d.idx] || [];
                return (
                  <div key={d.idx} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-bold text-white">{d.label}</p>
                      <button
                        onClick={() => setShifts((p) => ({ ...p, [d.idx]: [...p[d.idx], newShift()] }))}
                        className="flex items-center gap-1 text-[11px] font-bold text-blue-300 hover:text-white"
                      >
                        <Plus className="w-3.5 h-3.5" /> Shift
                      </button>
                    </div>
                    {dayShifts.length === 0 ? (
                      <p className="text-[11px] text-slate-500">Off</p>
                    ) : (
                      <div className="space-y-2">
                        {dayShifts.map((s) => (
                          <div key={s.key} className="flex items-center gap-2">
                            <input
                              type="time"
                              value={s.start}
                              onChange={(e) => updateShift(d.idx, s.key, { start: e.target.value })}
                              className="bg-black/30 border border-white/10 text-white text-xs rounded-lg px-2 py-1.5 w-[5.5rem] focus:outline-none focus:border-blue-400"
                            />
                            <span className="text-slate-500 text-xs">to</span>
                            <input
                              type="time"
                              value={s.end}
                              onChange={(e) => updateShift(d.idx, s.key, { end: e.target.value })}
                              className="bg-black/30 border border-white/10 text-white text-xs rounded-lg px-2 py-1.5 w-[5.5rem] focus:outline-none focus:border-blue-400"
                            />
                            <input
                              type="number"
                              min={5}
                              step={5}
                              value={s.duration}
                              onChange={(e) => updateShift(d.idx, s.key, { duration: Number(e.target.value) })}
                              title="Minutes per slot"
                              className="bg-black/30 border border-white/10 text-white text-xs rounded-lg px-2 py-1.5 w-14 focus:outline-none focus:border-blue-400"
                            />
                            <span className="text-[9px] text-slate-500">min</span>
                            <button
                              onClick={() => setShifts((p) => ({ ...p, [d.idx]: p[d.idx].filter((r) => r.key !== s.key) }))}
                              className="text-slate-500 hover:text-red-400 p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              onClick={saveHours}
              disabled={saving}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save working hours
            </button>
          </div>
        )}

        {tab === "leave" && (
          <div className="space-y-5">
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-5 space-y-4">
              <p className="text-xs font-bold text-white flex items-center gap-2">
                <CalendarOff className="w-4 h-4 text-red-400" /> Block time / leave
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  placeholder="Title (e.g. Surgery day, Holiday)"
                  value={leaveForm.title}
                  onChange={(e) => setLeaveForm((f) => ({ ...f, title: e.target.value }))}
                  className="bg-black/30 border border-white/10 text-white text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-400"
                />
                <select
                  value={leaveForm.scope}
                  onChange={(e) => setLeaveForm((f) => ({ ...f, scope: e.target.value }))}
                  className="bg-black/30 border border-white/10 text-white text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-400"
                >
                  <option value="doctor">This doctor only</option>
                  <option value="business">Whole clinic (all doctors)</option>
                </select>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 text-[11px] text-slate-300">
                    <input
                      type="radio"
                      name="blocktype"
                      checked={leaveForm.blockType === "full_day"}
                      onChange={() => setLeaveForm((f) => ({ ...f, blockType: "full_day" }))}
                    />{" "}
                    Full day
                  </label>
                  <label className="flex items-center gap-1.5 text-[11px] text-slate-300">
                    <input
                      type="radio"
                      name="blocktype"
                      checked={leaveForm.blockType === "partial"}
                      onChange={() => setLeaveForm((f) => ({ ...f, blockType: "partial" }))}
                    />{" "}
                    Partial
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">From</label>
                    <input
                      type="date"
                      value={leaveForm.startDate}
                      onChange={(e) => setLeaveForm((f) => ({ ...f, startDate: e.target.value }))}
                      className="bg-black/30 border border-white/10 text-white text-xs rounded-xl px-3 py-2.5 w-full focus:outline-none focus:border-blue-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">To</label>
                    <input
                      type="date"
                      value={leaveForm.endDate}
                      min={leaveForm.startDate}
                      onChange={(e) => setLeaveForm((f) => ({ ...f, endDate: e.target.value }))}
                      className="bg-black/30 border border-white/10 text-white text-xs rounded-xl px-3 py-2.5 w-full focus:outline-none focus:border-blue-400"
                    />
                  </div>
                </div>
                {leaveForm.blockType === "partial" && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Start time</label>
                      <input
                        type="time"
                        value={leaveForm.startTime}
                        onChange={(e) => setLeaveForm((f) => ({ ...f, startTime: e.target.value }))}
                        className="bg-black/30 border border-white/10 text-white text-xs rounded-xl px-3 py-2.5 w-full focus:outline-none focus:border-blue-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">End time</label>
                      <input
                        type="time"
                        value={leaveForm.endTime}
                        onChange={(e) => setLeaveForm((f) => ({ ...f, endTime: e.target.value }))}
                        className="bg-black/30 border border-white/10 text-white text-xs rounded-xl px-3 py-2.5 w-full focus:outline-none focus:border-blue-400"
                      />
                    </div>
                  </div>
                )}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Recurring</label>
                  <select
                    value={leaveForm.recurrence}
                    onChange={(e) => setLeaveForm((f) => ({ ...f, recurrence: e.target.value }))}
                    className="bg-black/30 border border-white/10 text-white text-xs rounded-xl px-3 py-2.5 w-full focus:outline-none focus:border-blue-400"
                  >
                    <option value="none">One-off</option>
                    <option value="weekly">Every week</option>
                  </select>
                </div>
                {leaveForm.recurrence === "weekly" && (
                  <div className="flex items-center gap-1 flex-wrap">
                    {DAYS.map((d) => (
                      <button
                        key={d.idx}
                        onClick={() =>
                          setLeaveForm((f) => ({
                            ...f,
                            recurringDays: f.recurringDays.includes(d.idx)
                              ? f.recurringDays.filter((x) => x !== d.idx)
                              : [...f.recurringDays, d.idx],
                          }))
                        }
                        className={`text-[10px] font-bold px-2.5 py-1.5 rounded-lg border transition-all ${
                          leaveForm.recurringDays.includes(d.idx)
                            ? "bg-blue-600 border-blue-500 text-white"
                            : "border-white/10 text-slate-400 hover:text-white"
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={() => submitBlock(false)}
                disabled={saving}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarOff className="w-4 h-4" />}
                Create block
              </button>
            </div>

            {blocks.length > 0 && (
              <div className="space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active blocks</p>
                {blocks.map((b) => (
                  <div key={b.id} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white truncate">{b.title}</p>
                      <p className="text-[11px] text-slate-400">
                        {b.block_type === "full_day" ? "Full day" : `Partial ${b.start_time}–${b.end_time}`} ·{" "}
                        {b.start_date === b.end_date ? b.start_date : `${b.start_date} → ${b.end_date}`}
                        {b.recurrence === "weekly" ? " · repeats weekly" : ""}
                      </p>
                    </div>
                    <button
                      onClick={() => cancelBlock(b.id)}
                      className="text-[11px] font-bold text-red-300 border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-xl transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "slots" && (
          <div className="space-y-4">
            <p className="text-xs text-slate-400">
              Slot length, buffer and overbooking per appointment type. These drive what patients can book.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-slate-400 border-b border-white/10">
                    <th className="py-2 pr-4">Type</th>
                    <th className="py-2 pr-4">Minutes</th>
                    <th className="py-2 pr-4">Buffer</th>
                    <th className="py-2">Overbook</th>
                  </tr>
                </thead>
                <tbody>
                  {TYPES.map((type) => {
                    const c = configs.find((x) => x.appointment_type === type);
                    if (!c) return null;
                    return (
                      <tr key={type} className="border-b border-white/5">
                        <td className="py-2.5 pr-4 text-xs font-bold text-white capitalize">{type}</td>
                        <td className="py-2.5 pr-4">
                          <input
                            type="number"
                            min={5}
                            step={5}
                            value={c.duration_mins}
                            onChange={(e) => updateConfig(type, { duration_mins: Number(e.target.value) })}
                            className="bg-black/30 border border-white/10 text-white text-xs rounded-lg px-2 py-1.5 w-20 focus:outline-none focus:border-blue-400"
                          />
                        </td>
                        <td className="py-2.5 pr-4">
                          <input
                            type="number"
                            min={0}
                            step={5}
                            value={c.buffer_mins}
                            onChange={(e) => updateConfig(type, { buffer_mins: Number(e.target.value) })}
                            className="bg-black/30 border border-white/10 text-white text-xs rounded-lg px-2 py-1.5 w-20 focus:outline-none focus:border-blue-400"
                          />
                        </td>
                        <td className="py-2.5">
                          <input
                            type="number"
                            min={1}
                            value={c.overbooking}
                            onChange={(e) => updateConfig(type, { overbooking: Number(e.target.value) })}
                            className="bg-black/30 border border-white/10 text-white text-xs rounded-lg px-2 py-1.5 w-20 focus:outline-none focus:border-blue-400"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <button
              onClick={saveConfigs}
              disabled={saving}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Settings2 className="w-4 h-4" />}
              Save slot settings
            </button>
          </div>
        )}
      </div>

      {conflicts && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-lg max-h-[80vh] overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <p className="font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                {conflicts.length} conflicting appointment{conflicts.length === 1 ? "" : "s"}
              </p>
              <button onClick={() => setConflicts(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[50vh]">
              <p className="text-xs text-slate-400 mb-4">
                These appointments fall inside the new block. Blocking will not cancel them — patients will be notified
                to reschedule.
              </p>
              <div className="space-y-2">
                {conflicts.map((c) => (
                  <div key={c.appointment_id} className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
                    <p className="text-xs font-bold text-white">
                      {c.patient_name || c.patient_phone} · {c.doctor_name || "Doctor"}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {c.appointment_date}
                      {c.appointment_time ? ` at ${c.appointment_time}` : ""}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-6 border-t border-white/10 flex items-center justify-end gap-3">
              <button
                onClick={() => setConflicts(null)}
                className="text-xs font-bold text-slate-300 border border-white/10 px-4 py-2.5 rounded-xl hover:bg-white/5"
              >
                Go back
              </button>
              <button
                onClick={() => submitBlock(true)}
                disabled={saving}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Block anyway & notify patients
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
