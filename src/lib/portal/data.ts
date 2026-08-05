import { createServiceClient } from "@/lib/supabaseService";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export interface PortalDashboardData {
  activeTicket: any | null;
  upcomingAppointment: any | null;
  recentAppointment: any | null;
}

export async function getPortalDashboard(phone: string): Promise<PortalDashboardData> {
  const supabase = createServiceClient();

  const ticketQuery = supabase
    .from("tickets")
    .select("*, queues(name, department, doctor_name, counter_number)")
    .eq("customer_phone", phone)
    .in("status", ["waiting", "called", "serving"])
    .order("joined_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const upcomingQuery = supabase
    .from("appointments")
    .select("*, queues(name, department, doctor_name)")
    .eq("patient_phone", phone)
    .eq("status", "scheduled")
    .gte("appointment_date", today())
    .order("appointment_date", { ascending: true })
    .limit(1)
    .maybeSingle();

  const recentQuery = supabase
    .from("appointments")
    .select("*, queues(name, department, doctor_name)")
    .eq("patient_phone", phone)
    .in("status", ["checked_in", "completed"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const [activeRes, upcomingRes, recentRes] = await Promise.all([
    ticketQuery,
    upcomingQuery,
    recentQuery,
  ]);

  return {
    activeTicket: activeRes.data ?? null,
    upcomingAppointment: upcomingRes.data ?? null,
    recentAppointment: recentRes.data ?? null,
  };
}

export async function getPortalAppointments(phone: string) {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("appointments")
    .select("*, queues(name, department, doctor_name)")
    .eq("patient_phone", phone)
    .order("appointment_date", { ascending: false });
  return data ?? [];
}

export async function getPortalVisits(phone: string) {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("tickets")
    .select("*, queues(name, department, doctor_name, counter_number)")
    .eq("customer_phone", phone)
    .in("status", ["served", "no_show", "left"])
    .order("joined_at", { ascending: false })
    .limit(100);
  return data ?? [];
}

export async function getPortalRatings(phone: string) {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("ratings")
    .select("*, queues(name, department, doctor_name)")
    .eq("patient_phone", phone)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getPortalBills(phone: string) {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("bills")
    .select("*, tickets(token_number, status)")
    .eq("patient_phone", phone)
    .order("created_at", { ascending: false });
  return data ?? [];
}
