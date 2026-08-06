import { createServiceClient } from "@/lib/supabaseService";

// ============================================================
// Availability & Schedule Management — server helpers.
// Doctors are `queues` rows; schedules are effective-dated weekly
// working hours. Slots are computed on the fly (never stored) so the
// booking module always sees truly available slots.
// ============================================================

export type AppointmentType = "routine" | "urgent" | "critical" | "follow_up" | "other";

export interface ScheduleShift {
  id: string;
  day_of_week: number; // 0=Sun .. 6=Sat
  start_time: string;
  end_time: string;
  slot_duration_mins: number;
  buffer_mins: number;
  max_patients: number;
  is_active: boolean;
}

export interface DoctorSchedule {
  id: string;
  business_id: string;
  queue_id: string | null;
  doctor_name: string | null;
  title: string;
  effective_from: string;
  effective_to: string | null;
  timezone: string;
  shifts: ScheduleShift[];
}

export interface SlotConfig {
  id: string;
  queue_id: string | null;
  appointment_type: AppointmentType;
  duration_mins: number;
  buffer_mins: number;
  overbooking: number;
  is_active: boolean;
}

export interface LeaveBlock {
  id: string;
  business_id: string;
  queue_id: string | null;
  doctor_name: string | null;
  title: string;
  block_type: "full_day" | "partial";
  start_date: string;
  end_date: string;
  start_time: string | null;
  end_time: string | null;
  recurrence: "none" | "weekly";
  recurring_days: number[];
  status: "pending" | "confirmed" | "cancelled";
  notes: string | null;
  created_by_name: string | null;
  created_at: string;
}

export interface BlockConflict {
  appointment_id: string;
  patient_name: string | null;
  patient_phone: string;
  appointment_date: string;
  appointment_time: string | null;
  doctor_name: string | null;
  queue_id: string;
}

export interface BookableSlot {
  start: string; // "HH:MM"
  end: string;
  available: boolean;
  booked_count: number;
  reason?: string;
}

export interface Actor {
  id?: string;
  name?: string;
}

export interface DayAvailability {
  date: string;
  weekday: number;
  is_working: boolean;
  is_blocked: boolean;
  shifts: ScheduleShift[];
  leave_blocks: LeaveBlock[];
  booked_count: number;
  available_slots: BookableSlot[];
}

// ---------------- time helpers ----------------

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function weekdayOf(dateISO: string): number {
  return new Date(`${dateISO}T00:00:00`).getDay();
}

export function toMinutes(time: string): number {
  const parts = time.split(":");
  const h = parseInt(parts[0] || "0", 10);
  const m = parseInt(parts[1] || "0", 10);
  return h * 60 + m;
}

export function fromMinutes(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function addDays(dateISO: string, days: number): string {
  const [y, m, d] = dateISO.split("-").map(Number);
  const dt = new Date(y, m - 1, d + days);
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${dt.getFullYear()}-${mm}-${dd}`;
}

function rangeDates(start: string, end: string): string[] {
  const out: string[] = [];
  let cur = start;
  let guard = 0;
  while (cur <= end && guard < 500) {
    out.push(cur);
    cur = addDays(cur, 1);
    guard++;
  }
  return out;
}

// ---------------- schedules ----------------

export async function getSchedulesForQueue(queueId: string): Promise<DoctorSchedule[]> {
  const { data, error } = await createServiceClient()
    .from("doctor_schedules")
    .select("*, doctor_schedule_shifts(*)")
    .eq("queue_id", queueId)
    .order("effective_from", { ascending: false });
  if (error || !data) return [];
  return (data as any[]).map((row) => mapSchedule(row));
}

function mapSchedule(row: any): DoctorSchedule {
  const shifts = (row.doctor_schedule_shifts || []).map((s: any) => ({
    id: s.id,
    day_of_week: s.day_of_week,
    start_time: s.start_time,
    end_time: s.end_time,
    slot_duration_mins: s.slot_duration_mins,
    buffer_mins: s.buffer_mins,
    max_patients: s.max_patients,
    is_active: s.is_active,
  }));
  return {
    id: row.id,
    business_id: row.business_id,
    queue_id: row.queue_id,
    doctor_name: row.doctor_name,
    title: row.title,
    effective_from: row.effective_from,
    effective_to: row.effective_to,
    timezone: row.timezone,
    shifts,
  };
}

/** The schedule in effect on a given date (latest effective_from <= date). */
export async function getEffectiveSchedule(
  queueId: string,
  date: string
): Promise<DoctorSchedule | null> {
  const { data, error } = await createServiceClient()
    .from("doctor_schedules")
    .select("*, doctor_schedule_shifts(*)")
    .eq("queue_id", queueId)
    .lte("effective_from", date)
    .or(`effective_to.is.null,effective_to.gte.${date}`)
    .order("effective_from", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return mapSchedule(data);
}

export interface UpsertScheduleInput {
  businessId: string;
  queueId: string;
  doctorName: string | null;
  title?: string;
  effectiveFrom: string;
  effectiveTo?: string | null;
  timezone?: string;
  shifts: {
    day_of_week: number;
    start_time: string;
    end_time: string;
    slot_duration_mins?: number;
    buffer_mins?: number;
    max_patients?: number;
    is_active?: boolean;
  }[];
  actor?: Actor;
}

export async function createSchedule(input: UpsertScheduleInput): Promise<DoctorSchedule | null> {
  const svc = createServiceClient();
  const { data: schedule, error } = await svc
    .from("doctor_schedules")
    .insert({
      business_id: input.businessId,
      queue_id: input.queueId,
      doctor_name: input.doctorName,
      title: input.title || "Default",
      effective_from: input.effectiveFrom,
      effective_to: input.effectiveTo ?? null,
      timezone: input.timezone || "Asia/Kolkata",
      created_by: input.actor?.id ?? null,
    })
    .select("id, business_id")
    .single();
  if (error || !schedule) return null;

  await insertShifts(schedule.id, input.shifts);
  await logAudit({
    businessId: input.businessId,
    entityType: "working_hours",
    entityId: schedule.id,
    action: "create",
    actor: input.actor,
    details: { title: input.title, effective_from: input.effectiveFrom, shifts: input.shifts },
  });
  return getSchedulesForQueue(input.queueId).then((list) => list.find((s) => s.id === schedule.id) || null);
}

export async function updateSchedule(
  id: string,
  input: Omit<UpsertScheduleInput, "queueId"> & { queueId: string }
): Promise<DoctorSchedule | null> {
  const svc = createServiceClient();
  const { error } = await svc
    .from("doctor_schedules")
    .update({
      title: input.title,
      effective_from: input.effectiveFrom,
      effective_to: input.effectiveTo ?? null,
      timezone: input.timezone || "Asia/Kolkata",
    })
    .eq("id", id);
  if (error) return null;

  // replace shifts wholesale
  await svc.from("doctor_schedule_shifts").delete().eq("schedule_id", id);
  await insertShifts(id, input.shifts);
  await logAudit({
    businessId: input.businessId,
    entityType: "working_hours",
    entityId: id,
    action: "update",
    actor: input.actor,
    details: { title: input.title, effective_from: input.effectiveFrom },
  });
  return getSchedulesForQueue(input.queueId).then((list) => list.find((s) => s.id === id) || null);
}

async function insertShifts(scheduleId: string, shifts: UpsertScheduleInput["shifts"]) {
  if (shifts.length === 0) return;
  const rows = shifts
    .filter((s) => s.start_time && s.end_time)
    .map((s) => ({
      schedule_id: scheduleId,
      day_of_week: s.day_of_week,
      start_time: s.start_time,
      end_time: s.end_time,
      slot_duration_mins: s.slot_duration_mins ?? 15,
      buffer_mins: s.buffer_mins ?? 0,
      max_patients: s.max_patients ?? 20,
      is_active: s.is_active ?? true,
    }));
  if (rows.length > 0) {
    await createServiceClient().from("doctor_schedule_shifts").insert(rows);
  }
}

export async function deleteSchedule(id: string, actor?: Actor): Promise<boolean> {
  const { data: sched } = await createServiceClient()
    .from("doctor_schedules")
    .select("id, business_id, title")
    .eq("id", id)
    .maybeSingle();
  const { error } = await createServiceClient().from("doctor_schedules").delete().eq("id", id);
  if (error) return false;
  if (sched) {
    await logAudit({
      businessId: sched.business_id,
      entityType: "working_hours",
      entityId: id,
      action: "delete",
      actor,
      details: { title: sched.title },
    });
  }
  return true;
}

// ---------------- slot configs ----------------

export async function getSlotConfigs(queueId: string): Promise<SlotConfig[]> {
  const { data, error } = await createServiceClient()
    .from("slot_configs")
    .select("*")
    .eq("queue_id", queueId)
    .order("appointment_type", { ascending: true });
  if (error || !data) return [];
  return data.map((r: any) => ({
    id: r.id,
    queue_id: r.queue_id,
    appointment_type: r.appointment_type,
    duration_mins: r.duration_mins,
    buffer_mins: r.buffer_mins,
    overbooking: r.overbooking,
    is_active: r.is_active,
  }));
}

export async function upsertSlotConfig(
  input: {
    businessId: string;
    queueId: string;
    appointmentType: AppointmentType;
    durationMins: number;
    bufferMins?: number;
    overbooking?: number;
    isActive?: boolean;
  },
  actor?: Actor
): Promise<SlotConfig | null> {
  const svc = createServiceClient();
  const { data, error } = await svc
    .from("slot_configs")
    .upsert(
      {
        business_id: input.businessId,
        queue_id: input.queueId,
        appointment_type: input.appointmentType,
        duration_mins: input.durationMins,
        buffer_mins: input.bufferMins ?? 0,
        overbooking: input.overbooking ?? 1,
        is_active: input.isActive ?? true,
      },
      { onConflict: "queue_id,appointment_type" }
    )
    .select("*")
    .single();
  if (error || !data) return null;
  await logAudit({
    businessId: input.businessId,
    entityType: "slot_config",
    entityId: data.id,
    action: "update",
    actor,
    details: { appointment_type: input.appointmentType, duration_mins: input.durationMins },
  });
  return {
    id: data.id,
    queue_id: data.queue_id,
    appointment_type: data.appointment_type,
    duration_mins: data.duration_mins,
    buffer_mins: data.buffer_mins,
    overbooking: data.overbooking,
    is_active: data.is_active,
  };
}

// ---------------- leave blocks ----------------

export async function getLeaveBlocks(query: { queueId?: string; businessId?: string }): Promise<LeaveBlock[]> {
  let q = createServiceClient().from("leave_blocks").select("*");
  if (query.queueId) q = q.eq("queue_id", query.queueId);
  if (query.businessId) q = q.eq("business_id", query.businessId);
  const { data, error } = await q
    .order("start_date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map((r: any) => mapLeaveBlock(r));
}

function mapLeaveBlock(r: any): LeaveBlock {
  return {
    id: r.id,
    business_id: r.business_id,
    queue_id: r.queue_id,
    doctor_name: r.doctor_name,
    title: r.title,
    block_type: r.block_type,
    start_date: r.start_date,
    end_date: r.end_date,
    start_time: r.start_time,
    end_time: r.end_time,
    recurrence: r.recurrence,
    recurring_days: r.recurring_days || [],
    status: r.status,
    notes: r.notes,
    created_by_name: r.created_by_name,
    created_at: r.created_at,
  };
}

function occurrenceDates(block: { recurrence: string; recurring_days: number[]; start_date: string; end_date: string }): string[] {
  const dates = rangeDates(block.start_date, block.end_date);
  if (block.recurrence === "weekly" && (block.recurring_days?.length ?? 0) > 0) {
    return dates.filter((d) => block.recurring_days!.includes(weekdayOf(d)));
  }
  return dates;
}

async function blocksCoveringDate(queueId: string, businessId: string, date: string): Promise<LeaveBlock[]> {
  const { data, error } = await createServiceClient()
    .from("leave_blocks")
    .select("*")
    .eq("status", "confirmed")
    .or(`queue_id.eq.${queueId},and(queue_id.is.null,business_id.eq.${businessId})`)
    .lte("start_date", date)
    .gte("end_date", date);
  if (error || !data) return [];
  const blocks = data.map(mapLeaveBlock);
  return blocks.filter((b) => occurrenceDates(b).includes(date));
}

function timeOverlap(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && bStart < aEnd;
}

function blockCovers(block: LeaveBlock, slotStart: number, slotEnd: number): boolean {
  if (block.status !== "confirmed") return false;
  if (block.block_type === "full_day") return true;
  const bStart = toMinutes(block.start_time || "00:00");
  const bEnd = toMinutes(block.end_time || "23:59");
  return timeOverlap(slotStart, slotEnd, bStart, bEnd);
}

/** Existing appointments on a date for a queue, with time in minutes. */
async function appointmentsOnDate(queueId: string, date: string) {
  const { data, error } = await createServiceClient()
    .from("appointments")
    .select("id, patient_name, patient_phone, appointment_time, status")
    .eq("queue_id", queueId)
    .eq("appointment_date", date)
    .in("status", ["scheduled", "checked_in"]);
  if (error || !data) return [];
  return data;
}

export async function computeAvailableSlots(
  queueId: string,
  date: string,
  appointmentType: AppointmentType = "routine"
): Promise<BookableSlot[]> {
  const schedule = await getEffectiveSchedule(queueId, date);
  if (!schedule) return [];
  const dow = weekdayOf(date);
  const shifts = schedule.shifts.filter((s) => s.day_of_week === dow && s.is_active);
  if (shifts.length === 0) return [];

  const configs = await getSlotConfigs(queueId);
  const config =
    configs.find((c) => c.appointment_type === appointmentType && c.is_active) ||
    configs.find((c) => c.appointment_type === "routine") || {
      duration_mins: 15,
      buffer_mins: 0,
      overbooking: 1,
    };

  const blocks = await blocksCoveringDate(queueId, schedule.business_id, date);
  const appts = await appointmentsOnDate(queueId, date);

  const nowDate = new Date();
  const todayISO = nowDate.toISOString().slice(0, 10);
  const nowMinutes = nowDate.getHours() * 60 + nowDate.getMinutes();
  const isToday = date === todayISO;

  const slots: BookableSlot[] = [];
  for (const shift of shifts) {
    const duration = config.duration_mins;
    const buffer = config.buffer_mins;
    const shiftStart = toMinutes(shift.start_time);
    const shiftEnd = toMinutes(shift.end_time);
    const shiftBooked = appts.filter(
      (a) => a.appointment_time && toMinutes(a.appointment_time) >= shiftStart && toMinutes(a.appointment_time) < shiftEnd
    ).length;

    let start = shiftStart;
    let guard = 0;
    while (start + duration <= shiftEnd && guard < 100) {
      const slotEnd = start + duration;
      const blocked = blocks.some((b) => blockCovers(b, start, slotEnd));
      const bookedCount = appts.filter((a) => {
        if (!a.appointment_time) return false;
        const t = toMinutes(a.appointment_time);
        return t >= start && t < slotEnd;
      }).length;
      const past = isToday && start <= nowMinutes;

      const available = !blocked && !past && bookedCount < config.overbooking && shiftBooked < shift.max_patients;

      slots.push({
        start: fromMinutes(start),
        end: fromMinutes(slotEnd),
        available,
        booked_count: bookedCount,
        reason: blocked ? "blocked" : past ? "past" : !available ? "unavailable" : undefined,
      });

      start += duration + buffer;
      guard++;
    }
  }
  return slots;
}

/** Validate that a specific requested time falls in an available slot. */
export async function isSlotAvailable(
  queueId: string,
  date: string,
  time: string,
  appointmentType: AppointmentType = "routine"
): Promise<boolean> {
  const slots = await computeAvailableSlots(queueId, date, appointmentType);
  const t = toMinutes(time);
  return slots.some((s) => s.available && t >= toMinutes(s.start) && t < toMinutes(s.end));
}

// ---------------- conflict detection ----------------

export async function findBlockConflicts(params: {
  queueIds: string[];
  startDate: string;
  endDate: string;
  blockType: "full_day" | "partial";
  startTime?: string | null;
  endTime?: string | null;
  recurrence?: string;
  recurringDays?: number[];
}): Promise<BlockConflict[]> {
  if (!params.queueIds || params.queueIds.length === 0) return [];

  const svc = createServiceClient();
  const { data, error } = await svc
    .from("appointments")
    .select("id, patient_name, patient_phone, appointment_date, appointment_time, status, queue_id")
    .in("queue_id", params.queueIds)
    .in("status", ["scheduled", "checked_in"])
    .lte("appointment_date", params.endDate)
    .gte("appointment_date", params.startDate);

  if (error || !data) return [];

  // occurrence dates for the block
  const dates = occurrenceDates({
    recurrence: params.recurrence || "none",
    recurring_days: params.recurringDays || [],
    start_date: params.startDate,
    end_date: params.endDate,
  });
  const dateSet = new Set(dates);

  // queue -> doctor name
  const queueIds = [...new Set((data as any[]).map((a) => a.queue_id))];
  const queueRows = await svc.from("queues").select("id, doctor_name, name").in("id", queueIds);
  const queueName = new Map(
    (queueRows.data || []).map((q: any) => [q.id, q.doctor_name || q.name])
  );

  const conflicts: BlockConflict[] = [];
  for (const a of data as any[]) {
    if (!dateSet.has(a.appointment_date)) continue;
    if (params.blockType === "full_day") {
      conflicts.push(toConflict(a, queueName));
      continue;
    }
    // partial block — need time overlap; null times treated as conflicting (cannot verify)
    if (!a.appointment_time) {
      conflicts.push(toConflict(a, queueName));
      continue;
    }
    const bStart = toMinutes(params.startTime || "00:00");
    const bEnd = toMinutes(params.endTime || "23:59");
    const t = toMinutes(a.appointment_time);
    if (t >= bStart && t < bEnd) {
      conflicts.push(toConflict(a, queueName));
    }
  }
  return conflicts;
}

function toConflict(a: any, queueName: Map<string, string>): BlockConflict {
  return {
    appointment_id: a.id,
    patient_name: a.patient_name,
    patient_phone: a.patient_phone,
    appointment_date: a.appointment_date,
    appointment_time: a.appointment_time,
    doctor_name: queueName.get(a.queue_id) || null,
    queue_id: a.queue_id,
  };
}

export interface CreateLeaveBlockInput {
  businessId: string;
  title: string;
  blockType: "full_day" | "partial";
  startDate: string;
  endDate: string;
  startTime?: string | null;
  endTime?: string | null;
  recurrence?: string;
  recurringDays?: number[];
  queueId?: string | null;
  queueIds?: string[];
  notes?: string | null;
  doctorName?: string | null;
  confirmConflicts?: boolean;
  actor?: Actor;
}

export interface CreateLeaveBlockResult {
  blocks: LeaveBlock[];
  conflicts: BlockConflict[];
  confirmed: boolean;
}

export async function createLeaveBlock(input: CreateLeaveBlockInput): Promise<CreateLeaveBlockResult> {
  const svc = createServiceClient();

  // resolve target queues
  let targetQueueIds: string[] = [];
  let businessWide = false;
  if (input.queueIds && input.queueIds.length > 0) {
    targetQueueIds = input.queueIds;
  } else if (input.queueId) {
    targetQueueIds = [input.queueId];
  } else {
    businessWide = true;
    const { data } = await svc.from("queues").select("id").eq("business_id", input.businessId).eq("is_active", true);
    targetQueueIds = (data || []).map((q: any) => q.id);
  }

  const conflicts =
    input.blockType === "full_day" || input.startTime || input.endTime
      ? await findBlockConflicts({
          queueIds: targetQueueIds,
          startDate: input.startDate,
          endDate: input.endDate,
          blockType: input.blockType,
          startTime: input.startTime,
          endTime: input.endTime,
          recurrence: input.recurrence,
          recurringDays: input.recurringDays,
        })
      : [];

  const confirmed = !input.confirmConflicts ? false : true;
  if (conflicts.length > 0 && !input.confirmConflicts) {
    return { blocks: [], conflicts, confirmed: false };
  }

  const rows = businessWide
    ? [null]
    : targetQueueIds;

  const inserted: LeaveBlock[] = [];
  for (const qid of rows) {
    const { data, error } = await svc
      .from("leave_blocks")
      .insert({
        business_id: input.businessId,
        queue_id: qid,
        doctor_name: input.doctorName ?? null,
        title: input.title,
        block_type: input.blockType,
        start_date: input.startDate,
        end_date: input.endDate,
        start_time: input.startTime ?? null,
        end_time: input.endTime ?? null,
        recurrence: input.recurrence || "none",
        recurring_days: input.recurringDays || [],
        status: "confirmed",
        notes: input.notes ?? null,
        created_by: input.actor?.id ?? null,
        created_by_name: input.actor?.name ?? null,
      })
      .select("*")
      .single();
    if (!error && data) {
      inserted.push(mapLeaveBlock(data));
      await logAudit({
        businessId: input.businessId,
        entityType: "leave_block",
        entityId: data.id,
        action: "create",
        actor: input.actor,
        details: { title: input.title, start_date: input.startDate, end_date: input.endDate },
      });
    }
  }

  return { blocks: inserted, conflicts, confirmed: true };
}

export async function updateLeaveBlock(
  id: string,
  input: Partial<Omit<CreateLeaveBlockInput, "businessId">> & { businessId: string },
  actor?: Actor
): Promise<LeaveBlock | null> {
  const { data, error } = await createServiceClient()
    .from("leave_blocks")
    .update({
      title: input.title,
      block_type: input.blockType,
      start_date: input.startDate,
      end_date: input.endDate,
      start_time: input.startTime ?? null,
      end_time: input.endTime ?? null,
      recurrence: input.recurrence || undefined,
      recurring_days: input.recurringDays || undefined,
      notes: input.notes ?? null,
    })
    .eq("id", id)
    .select("*")
    .single();
  if (error || !data) return null;
  await logAudit({
    businessId: input.businessId,
    entityType: "leave_block",
    entityId: id,
    action: "update",
    actor,
    details: { title: input.title, start_date: input.startDate, end_date: input.endDate },
  });
  return mapLeaveBlock(data);
}

export async function cancelLeaveBlock(id: string, businessId: string, actor?: Actor): Promise<boolean> {
  const { error } = await createServiceClient()
    .from("leave_blocks")
    .update({ status: "cancelled" })
    .eq("id", id);
  if (error) return false;
  await logAudit({
    businessId,
    entityType: "leave_block",
    entityId: id,
    action: "delete",
    actor,
    details: { cancelled: true },
  });
  return true;
}

// ---------------- calendar / availability ----------------

export async function getAvailabilityCalendar(
  queueId: string,
  startDate: string,
  endDate: string
): Promise<DayAvailability[]> {
  const svc = createServiceClient();

  const { data: queue } = await svc
    .from("queues")
    .select("business_id, doctor_name, name")
    .eq("id", queueId)
    .maybeSingle();
  const businessId = queue?.business_id;
  if (!businessId) return [];

  // latest schedule effective on or before endDate
  const { data: schedRows } = await svc
    .from("doctor_schedules")
    .select("*, doctor_schedule_shifts(*)")
    .eq("queue_id", queueId)
    .lte("effective_from", endDate)
    .order("effective_from", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1);
  const schedule = schedRows && schedRows[0] ? mapSchedule(schedRows[0]) : null;

  // leave blocks covering the window
  const { data: blockRows } = await svc
    .from("leave_blocks")
    .select("*")
    .eq("status", "confirmed")
    .or(`queue_id.eq.${queueId},and(queue_id.is.null,business_id.eq.${businessId})`)
    .lte("start_date", endDate)
    .gte("end_date", startDate);
  const allBlocks = (blockRows || []).map(mapLeaveBlock);

  // appointments grouped by date
  const { data: apptRows } = await svc
    .from("appointments")
    .select("id, patient_name, appointment_date, appointment_time")
    .eq("queue_id", queueId)
    .in("status", ["scheduled", "checked_in"])
    .lte("appointment_date", endDate)
    .gte("appointment_date", startDate);
  const apptsByDate: Record<string, any[]> = {};
  (apptRows || []).forEach((a: any) => {
    (apptsByDate[a.appointment_date] = apptsByDate[a.appointment_date] || []).push(a);
  });

  const configs = await getSlotConfigs(queueId);

  const days: DayAvailability[] = [];
  for (const date of rangeDates(startDate, endDate)) {
    const dow = weekdayOf(date);
    const shifts = schedule ? schedule.shifts.filter((s) => s.day_of_week === dow && s.is_active) : [];
    const blocks = allBlocks.filter((b) => occurrenceDates(b).includes(date));
    const isBlockedFullDay = blocks.some((b) => b.block_type === "full_day");
    const appts = apptsByDate[date] || [];

    // compute available slots (reuse logic without refetch)
    const slots = computeSlotsFromParts({
      date,
      shifts,
      blocks,
      appts,
      configs,
      scheduleBusinessId: businessId,
    });

    days.push({
      date,
      weekday: dow,
      is_working: shifts.length > 0,
      is_blocked: isBlockedFullDay,
      shifts,
      leave_blocks: blocks,
      booked_count: appts.length,
      available_slots: slots,
    });
  }
  return days;
}

function computeSlotsFromParts(p: {
  date: string;
  shifts: ScheduleShift[];
  blocks: LeaveBlock[];
  appts: any[];
  configs: SlotConfig[];
  scheduleBusinessId: string;
}): BookableSlot[] {
  if (p.shifts.length === 0) return [];
  const config =
    p.configs.find((c) => c.appointment_type === "routine") || {
      duration_mins: 15,
      buffer_mins: 0,
      overbooking: 1,
    };
  const nowDate = new Date();
  const todayISO = nowDate.toISOString().slice(0, 10);
  const nowMinutes = nowDate.getHours() * 60 + nowDate.getMinutes();
  const isToday = p.date === todayISO;

  const slots: BookableSlot[] = [];
  for (const shift of p.shifts) {
    const duration = config.duration_mins;
    const buffer = config.buffer_mins;
    const shiftStart = toMinutes(shift.start_time);
    const shiftEnd = toMinutes(shift.end_time);
    const shiftBooked = p.appts.filter(
      (a) => a.appointment_time && toMinutes(a.appointment_time) >= shiftStart && toMinutes(a.appointment_time) < shiftEnd
    ).length;

    let start = shiftStart;
    let guard = 0;
    while (start + duration <= shiftEnd && guard < 100) {
      const slotEnd = start + duration;
      const blocked = p.blocks.some((b) => blockCovers(b, start, slotEnd));
      const bookedCount = p.appts.filter((a) => {
        if (!a.appointment_time) return false;
        const t = toMinutes(a.appointment_time);
        return t >= start && t < slotEnd;
      }).length;
      const past = isToday && start <= nowMinutes;
      slots.push({
        start: fromMinutes(start),
        end: fromMinutes(slotEnd),
        available: !blocked && !past && bookedCount < config.overbooking && shiftBooked < shift.max_patients,
        booked_count: bookedCount,
      });
      start += duration + buffer;
      guard++;
    }
  }
  return slots;
}

// ---------------- audit log ----------------

async function logAudit(p: {
  businessId: string;
  entityType: string;
  entityId: string;
  action: string;
  actor?: Actor;
  details?: unknown;
}) {
  try {
    await createServiceClient().from("schedule_audit_log").insert({
      business_id: p.businessId,
      entity_type: p.entityType,
      entity_id: p.entityId,
      action: p.action,
      actor_id: p.actor?.id ?? null,
      actor_name: p.actor?.name ?? null,
      details: p.details ?? null,
    });
  } catch {
    /* audit is best-effort */
  }
}

export { DAY_NAMES };
