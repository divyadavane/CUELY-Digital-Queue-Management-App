import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";
import { sendOtpWhatsApp } from "@/lib/whatsapp";

export const maxDuration = 10;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const phone = String(body?.phone || "").trim();
    const preferredLanguage = String(body?.preferred_language || "");

    if (phone.length < 8) {
      return NextResponse.json({ error: "Please enter a valid phone number" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase.rpc("request_patient_otp", {
      p_phone: phone,
      p_language: preferredLanguage || null,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const result = data as { code?: string; expires_at?: string };

    // Deliver the code to the patient's phone over WhatsApp. The code itself is
    // never returned to the client.
    const delivery = result.code ? await sendOtpWhatsApp(phone, result.code) : undefined;

    return NextResponse.json({
      success: true,
      expiresAt: result.expires_at,
      delivery,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
