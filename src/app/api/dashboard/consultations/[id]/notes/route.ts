import { NextRequest, NextResponse } from "next/server";
import { getAdminUser, isAdminOfConsultation } from "@/lib/admin/guard";
import { getDoctorConsultationDetail } from "@/lib/admin/consultations";
import { createServiceClient } from "@/lib/supabaseService";

export const maxDuration = 10;

// GET /api/dashboard/consultations/[id]/notes — current SOAP notes
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const { id } = await ctx.params;
  if (!(await isAdminOfConsultation(id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const detail = await getDoctorConsultationDetail(id);
  return NextResponse.json({ notes: detail?.notes || null });
}

// POST /api/dashboard/consultations/[id]/notes
// body: { subjective, objective, assessment, plan } (SOAP autosave)
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const { id } = await ctx.params;
  if (!(await isAdminOfConsultation(id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const supabase = createServiceClient();
    const { data, error } = await supabase.rpc("save_consultation_notes", {
      p_consultation_id: id,
      p_subjective: String(body?.subjective || ""),
      p_objective: String(body?.objective || ""),
      p_assessment: String(body?.assessment || ""),
      p_plan: String(body?.plan || ""),
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, ...(data as Record<string, unknown>) });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
