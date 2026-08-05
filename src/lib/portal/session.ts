import { NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabaseService";
import { PatientProfile } from "@/types/database";

export interface PortalSession {
  token: string;
  patientId: string;
  phone: string;
  profile: PatientProfile;
}

export function getBearerToken(req: NextRequest): string | null {
  const auth = req.headers.get("authorization") || "";
  if (auth.toLowerCase().startsWith("bearer ")) {
    return auth.slice(7).trim() || null;
  }
  return null;
}

export async function getPortalSession(req: NextRequest): Promise<PortalSession | null> {
  const token = getBearerToken(req);
  if (!token) return null;

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("patient_sessions")
    .select("token, expires_at, patient_id, patient_profiles(*)")
    .eq("token", token)
    .maybeSingle();

  if (error || !data) return null;

  const profile = data.patient_profiles as unknown as PatientProfile | null;
  if (!profile) return null;

  if (new Date(data.expires_at).getTime() < Date.now()) return null;

  return {
    token,
    patientId: profile.id,
    phone: profile.phone,
    profile,
  };
}
