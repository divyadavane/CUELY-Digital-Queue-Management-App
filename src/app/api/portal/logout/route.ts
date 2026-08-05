import { NextRequest, NextResponse } from "next/server";
import { getPortalSession, getBearerToken } from "@/lib/portal/session";
import { createServiceClient } from "@/lib/supabaseService";

export async function POST(req: NextRequest) {
  const session = await getPortalSession(req);
  const token = getBearerToken(req);

  if (session && token) {
    const supabase = createServiceClient();
    await supabase.rpc("revoke_patient_session", { p_token: token });
  }

  return NextResponse.json({ success: true });
}
