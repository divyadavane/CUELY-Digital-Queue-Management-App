import { createServiceClient } from "@/lib/supabaseService";
import { Consultation, PatientProfile } from "@/types/database";

export interface VideoDoctor {
  queue_id: string;
  business_id: string;
  name: string;
  doctor_name: string | null;
  department: string | null;
  consultation_fee: number;
  avg_rating: number;
  total_ratings: number;
}

export interface ConsultationDetail {
  id: string;
  status: Consultation["status"];
  scheduled_start: string;
  started_at: string | null;
  ended_at: string | null;
  expires_at: string;
  patient_name: string | null;
  patient_phone: string;
  doctor: {
    queue_id: string;
    name: string;
    doctor_name: string | null;
    department: string | null;
    counter_number: string | null;
    avg_rating: number;
    total_ratings: number;
  } | null;
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
    created_at: string;
  } | null;
  rating: { rating_value: number } | null;
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
  queues: any | null;
  bills: any[] | null;
  consultation_notes: any | null;
  prescriptions: any | null;
  ratings: any[] | null;
};

// PostgREST returns to-one relations (unique FK) as a single object while
// to-many relations come back as arrays. Normalize both to an array.
function asArray<T>(value: T | T[] | null | undefined): T[] {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

function mapDetail(row: RawRow): ConsultationDetail {
  const queue = row.queues || null;
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
    doctor: queue
      ? {
          queue_id: queue.id,
          name: queue.name,
          doctor_name: queue.doctor_name || null,
          department: queue.department || null,
          counter_number: queue.counter_number || null,
          avg_rating: queue.avg_rating || 0,
          total_ratings: queue.total_ratings || 0,
        }
      : null,
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
          created_at: prescription.created_at,
        }
      : null,
    rating: row.ratings && row.ratings[0] ? { rating_value: row.ratings[0].rating_value } : null,
  };
}

const CONSULTATION_SELECT = `*,
  queues(id, name, doctor_name, department, counter_number, avg_rating, total_ratings),
  bills(id, amount, status, consultation_id),
  consultation_notes(subjective, objective, assessment, plan, updated_at),
  prescriptions(diagnosis, medicine_items, lab_tests, follow_up_date, notes, created_at),
  ratings(rating_value)`;

function consultationQuery(supabase: ReturnType<typeof createServiceClient>) {
  return supabase
    .from("consultations")
    .select(CONSULTATION_SELECT)
    .order("scheduled_start", { ascending: false })
    .limit(50);
}

/** Upcoming + past consultations for a patient (no room_token exposed). */
export async function getPortalConsultations(phone: string): Promise<ConsultationDetail[]> {
  const supabase = createServiceClient();
  const { data, error } = await consultationQuery(supabase).eq("patient_phone", phone);
  if (error || !data) return [];
  return (data as unknown as RawRow[]).map(mapDetail);
}

/** Doctors that currently offer video consultations. */
export async function getVideoDoctors(): Promise<VideoDoctor[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("queues")
    .select("id, business_id, name, doctor_name, department, consultation_fee, avg_rating, total_ratings")
    .eq("is_active", true)
    .eq("video_enabled", true)
    .order("department", { ascending: true });
  if (error || !data) return [];
  return data.map((q: any) => ({
    queue_id: q.id,
    business_id: q.business_id,
    name: q.name,
    doctor_name: q.doctor_name || null,
    department: q.department || null,
    consultation_fee: q.consultation_fee || 0,
    avg_rating: q.avg_rating || 0,
    total_ratings: q.total_ratings || 0,
  }));
}

/** Full read-only detail (notes + prescription) for history views. */
export async function getPortalConsultationDetail(
  consultationId: string,
  phone: string
): Promise<ConsultationDetail | null> {
  const supabase = createServiceClient();
  const { data, error } = await consultationQuery(supabase)
    .eq("id", consultationId)
    .eq("patient_phone", phone)
    .maybeSingle();
  if (error || !data) return null;
  return mapDetail(data as unknown as RawRow);
}

export interface JoinRoomResult {
  consultation: ConsultationDetail;
  roomToken: string;
}

/**
 * Authorizes a patient to join their own consultation room.
 * Enforces ownership, payment, and expiry. Returns the room_token only
 * on success — this is the secret that unlocks the realtime signaling channel.
 */
export async function getPatientJoinRoom(
  consultationId: string,
  session: { phone: string; profile: PatientProfile }
): Promise<JoinRoomResult | null> {
  const supabase = createServiceClient();
  const { data, error } = await consultationQuery(supabase)
    .eq("id", consultationId)
    .eq("patient_phone", session.phone)
    .maybeSingle();
  if (error || !data) return null;

  const row = data as unknown as RawRow;
  const consultation = mapDetail(row);

  const bill = row.bills && row.bills[0];
  if (!bill || bill.status !== "paid") return null;

  if (!["scheduled", "ready", "in_call"].includes(consultation.status)) return null;

  const expiresAt = new Date(row.expires_at).getTime();
  if (expiresAt < Date.now()) return null;

  return { consultation, roomToken: row.room_token };
}
