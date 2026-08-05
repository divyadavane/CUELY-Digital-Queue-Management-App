import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";

export const maxDuration = 10;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const phone = String(body?.phone || "").trim();
    const code = String(body?.code || "").trim();

    if (!phone || !code) {
      return NextResponse.json({ error: "Phone and code are required" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase.rpc("verify_patient_otp", {
      p_phone: phone,
      p_code: code,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const result = data as { token?: string; patient_id?: string; phone?: string };
    if (!result.token) {
      return NextResponse.json({ error: "Login failed, please try again" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      token: result.token,
      patientId: result.patient_id,
      phone: result.phone,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
