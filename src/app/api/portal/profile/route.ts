import { NextRequest, NextResponse } from "next/server";
import { getPortalSession } from "@/lib/portal/session";
import { createServiceClient } from "@/lib/supabaseService";

export async function PATCH(req: NextRequest) {
  const session = await getPortalSession(req);
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const updates: Record<string, unknown> = {};

    if (typeof body?.name === "string") {
      updates.name = body.name.trim().slice(0, 120) || null;
    }
    if (typeof body?.email === "string") {
      updates.email = body.email.trim().slice(0, 200) || null;
    }
    if (typeof body?.preferred_language === "string") {
      const allowed = ["en", "hi", "mr"];
      if (allowed.includes(body.preferred_language)) {
        updates.preferred_language = body.preferred_language;
      }
    }
    if (body?.notification_prefs && typeof body.notification_prefs === "object") {
      const prefs = body.notification_prefs as Record<string, boolean>;
      updates.notification_prefs = {
        sms: Boolean(prefs.sms),
        whatsapp: Boolean(prefs.whatsapp),
        email: Boolean(prefs.email),
      };
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No updates provided" }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("patient_profiles")
      .update(updates)
      .eq("id", session.patientId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, profile: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
