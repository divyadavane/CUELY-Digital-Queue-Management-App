import { NextRequest, NextResponse } from "next/server";
import { getAdminUser, isAdminOfQueue } from "@/lib/admin/guard";
import { createServiceClient } from "@/lib/supabaseService";
import { getEffectiveSchedule, getLeaveBlocks, computeAvailableSlots, weekdayOf, DAY_NAMES } from "@/lib/schedule";

export const maxDuration = 15;

// GET /api/dashboard/doctor/summary?queueId=...
// Returns the doctor-facing digest: today's working hours + slot capacity
// (ties into Availability & Schedule Management), plus end-of-day stats.
export async function GET(req: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const queueId = req.nextUrl.searchParams.get("queueId");
  if (!queueId) return NextResponse.json({ error: "queueId is required" }, { status: 400 });
  if (!(await isAdminOfQueue(queueId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const svc = createServiceClient();
  const todayStr = new Date().toISOString().slice(0, 10);

  const [{ data: queue }, schedule, blocks, slots] = await Promise.all([
    svc.from("queues").select("id, doctor_name, department, avg_consult_mins").eq("id", queueId).maybeSingle(),
    getEffectiveSchedule(queueId, todayStr),
    getLeaveBlocks({ queueId }),
    computeAvailableSlots(queueId, todayStr, "routine"),
  ]);

  const dow = weekdayOf(todayStr);
  const todayShifts = schedule?.shifts.filter((s) => s.day_of_week === dow && s.is_active) || [];

  const todayBlocks = blocks.filter((b) => {
    if (b.status !== "confirmed") return false;
    return todayStr >= b.start_date && todayStr <= b.end_date;
  });

  // EOD: patients served today
  const { count: servedToday } = await svc
    .from("tickets")
    .select("id", { count: "exact", head: true })
    .eq("queue_id", queueId)
    .eq("status", "served")
    .gte("served_at", `${todayStr}T00:00:00`)
    .lte("served_at", `${todayStr}T23:59:59`);

  // avg consult duration from completed in-person consults
  const { data: consultRows } = await svc
    .from("tickets")
    .select("consult_started_at, consult_ended_at")
    .eq("queue_id", queueId)
    .not("consult_started_at", "is", null)
    .not("consult_ended_at", "is", null)
    .gte("consult_started_at", `${todayStr}T00:00:00`)
    .lte("consult_started_at", `${todayStr}T23:59:59`);

  let avgConsultSec = 0;
  if (consultRows && consultRows.length > 0) {
    const total = consultRows.reduce((acc: number, r: { consult_started_at: string | null; consult_ended_at: string | null }) => {
      const s = r.consult_started_at ? new Date(r.consult_started_at).getTime() : 0;
      const e = r.consult_ended_at ? new Date(r.consult_ended_at).getTime() : 0;
      return acc + Math.max(0, Math.round((e - s) / 1000));
    }, 0);
    avgConsultSec = Math.round(total / consultRows.length);
  }

  // pending follow-ups: prescriptions with a future follow-up date
  // (prescriptions link to consultations, which are scoped to this queue)
  const { data: followUps } = await svc
    .from("prescriptions")
    .select("follow_up_date, notes, diagnosis, consultations(queue_id)")
    .not("follow_up_date", "is", null)
    .gte("follow_up_date", todayStr)
    .order("follow_up_date", { ascending: true });

  // tomorrow's first booked slot
  const tomorrow = new Date(new Date(`${todayStr}T00:00:00`).getTime() + 86400000).toISOString().slice(0, 10);
  const { data: nextAppt } = await svc
    .from("appointments")
    .select("patient_name, patient_phone, appointment_time")
    .eq("queue_id", queueId)
    .eq("appointment_date", tomorrow)
    .in("status", ["scheduled", "checked_in"])
    .order("appointment_time", { ascending: true })
    .limit(1)
    .maybeSingle();

  // remaining slot capacity for today
  const openCapacity = slots.filter((s) => s.available).length;

  return NextResponse.json({
    queueId,
    doctor_name: queue?.doctor_name || null,
    department: queue?.department || null,
    avg_consult_mins: queue?.avg_consult_mins ?? 10,
    day_name: DAY_NAMES[dow],
    schedule: {
      has_shifts_today: todayShifts.length > 0,
      shifts: todayShifts.map((s) => ({
        start: String(s.start_time).slice(0, 5),
        end: String(s.end_time).slice(0, 5),
        duration: s.slot_duration_mins,
      })),
      blocked: todayBlocks.map((b) => ({
        title: b.title,
        block_type: b.block_type,
        start_time: b.start_time ? String(b.start_time).slice(0, 5) : null,
        end_time: b.end_time ? String(b.end_time).slice(0, 5) : null,
      })),
      open_capacity: openCapacity,
    },
    eod: {
      served_today: servedToday || 0,
      avg_consult_sec: avgConsultSec,
      follow_ups: (followUps || [])
        .filter((f: { consultations?: { queue_id?: string | null }[] | null }) =>
          (f.consultations || []).some((c) => c.queue_id === queueId)
        )
        .slice(0, 5)
        .map((f: { follow_up_date?: string | null; diagnosis?: string | null; notes?: string | null }) => ({
          date: f.follow_up_date,
          diagnosis: f.diagnosis,
          notes: f.notes,
        })),
      tomorrow_first: nextAppt
        ? {
            name: nextAppt.patient_name,
            phone: nextAppt.patient_phone,
            time: nextAppt.appointment_time ? String(nextAppt.appointment_time).slice(0, 5) : "Anytime",
          }
        : null,
    },
  });
}