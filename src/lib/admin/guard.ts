import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabaseServer";
import { createServiceClient } from "@/lib/supabaseService";

export interface AdminAuth {
  adminId: string;
  role: string;
}

/** Authenticate an admin via Supabase session cookies. */
export async function getAdminUser(): Promise<AdminAuth | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: admin } = await supabase
    .from("admins")
    .select("id, role")
    .eq("id", user.id)
    .maybeSingle();
  if (!admin) return null;

  return { adminId: user.id, role: (admin as any).role || "admin" };
}

/** Verify the admin belongs to the business that owns the given queue. */
export async function isAdminOfQueue(queueId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data: queue } = await supabase
    .from("queues")
    .select("business_id")
    .eq("id", queueId)
    .maybeSingle();
  if (!queue) return false;

  const result = await supabase.rpc("is_admin_of_business", {
    p_business_id: queue.business_id,
  });
  return !result.error && !!result.data;
}

/** Verify the admin belongs to the business that owns the consultation. */
export async function isAdminOfConsultation(consultationId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data: consultation } = await supabase
    .from("consultations")
    .select("business_id")
    .eq("id", consultationId)
    .maybeSingle();
  if (!consultation) return false;

  const result = await supabase.rpc("is_admin_of_business", {
    p_business_id: consultation.business_id,
  });
  return !result.error && !!result.data;
}

/** Keep the request param for parity with route handlers that need it later. */
export function getQueueIdFromRequest(req: NextRequest): string {
  return req.nextUrl.searchParams.get("queueId") || "";
}
