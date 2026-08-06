import { createServiceClient } from "@/lib/supabaseService";
import { Consultation } from "@/types/database";

export interface DoctorConsultationRow {
  id: string;
  status: Consultation["status"];
  scheduled_start: string;
  started_at: string | null;
  ended_at: string | null;
  expires_at: string;
  patient_name: string | null;
  patient_phone: string;
  doctor_name: string | null;
  queue_name: string | null;
  bill: { id: string; amount: number; status: "paid" | "pending" } | null;
  notes: {
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
    updated_at: string;
  } | null;
  prescription: {
    diagnosis: string | null;
    medicine_items: unknown[];
    lab_tests: unknown[];
    follow_up_date: string | null;
    notes: string | null;
  } | null;
}

type RawRow = Record<string, any> & {
  id: string;
  status: Consultation["status"];
  scheduled_start: string;
  started_at: string | null;
  ended_at: string | null;
  expires_at: string;
  patient_name: string | null;
  patient_phone: string;
  doctor_name: string | null;
  queue_name: string | null;
  bills: any[] | null;
  consultation_notes: any | null;
  prescriptions: any | null;
  queues: any | null;
};

// PostgREST returns to-one relations (unique FK) as a single object while
// to-many relations come back as arrays. Normalize both to an array.
function asArray<T>(value: T | T[] | null | undefined): T[] {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

function mapRow(row: RawRow): DoctorConsultationRow {
  const notes = asArray(row.consultation_notes)[0];
  const prescription = asArray(row.prescriptions)[0];
  return {
    id: row.id,
    status: row.status,
    scheduled_start: row.scheduled_start,
    started_at: row.started_at,
    ended_at: row.ended_at,
    expires_at: row.expires_at,
    patient_name: row.patient_name,
    patient_phone: row.patient_phone,
    doctor_name: row.queues?.doctor_name || row.queues?.name || null,
    queue_name: row.queues?.name || null,
    bill: (row.bills && row.bills[0]) || null,
    notes: notes
      ? {
          subjective: notes.subjective || "",
          objective: notes.objective || "",
          assessment: notes.assessment || "",
          plan: notes.plan || "",
          updated_at: notes.updated_at,
        }
      : null,
    prescription: prescription
      ? {
          diagnosis: prescription.diagnosis || null,
          medicine_items: prescription.medicine_items || [],
          lab_tests: prescription.lab_tests || [],
          follow_up_date: prescription.follow_up_date || null,
          notes: prescription.notes || null,
        }
      : null,
  };
}

const SELECT = `*,
  queues(id, name, doctor_name, department),
  bills(id, amount, status),
  consultation_notes(subjective, objective, assessment, plan, updated_at),
  prescriptions(diagnosis, medicine_items, lab_tests, follow_up_date, notes)`;

/** Consultations for one doctor's queue: today's live + recent history. */
export async function getAdminConsultations(queueId: string): Promise<DoctorConsultationRow[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("consultations")
    .select(SELECT)
    .eq("queue_id", queueId)
    .order("scheduled_start", { ascending: false })
    .limit(100);
  if (error || !data) return [];
  return (data as unknown as RawRow[]).map(mapRow);
}

/** Single consultation detail for the doctor (by id, admin already validated). */
export async function getDoctorConsultationDetail(consultationId: string): Promise<DoctorConsultationRow | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("consultations")
    .select(SELECT)
    .eq("id", consultationId)
    .maybeSingle();
  if (error || !data) return null;
  return mapRow(data as unknown as RawRow);
}

/** Authorizes the doctor to join a room; returns the room_token + detail. */
export async function getDoctorJoinRoom(
  consultationId: string
): Promise<{ roomToken: string; detail: DoctorConsultationRow } | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("consultations")
    .select(SELECT)
    .eq("id", consultationId)
    .maybeSingle();
  if (error || !data) return null;
  if (!["scheduled", "ready", "in_call"].includes(data.status)) return null;
  if (new Date(data.expires_at).getTime() < Date.now()) return null;
  return { roomToken: data.room_token, detail: mapRow(data as unknown as RawRow) };
}
