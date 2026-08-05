import { NextRequest, NextResponse } from "next/server";
import { getAdminUser, isAdminOfConsultation } from "@/lib/admin/guard";
import { getDoctorConsultationDetail } from "@/lib/admin/consultations";
import { createServiceClient } from "@/lib/supabaseService";

export const maxDuration = 10;

// GET /api/dashboard/consultations/[id]/prescription — current prescription
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
  return NextResponse.json({ prescription: detail?.prescription || null });
}

// POST /api/dashboard/consultations/[id]/prescription
// body: { diagnosis, medicineItems: [{name, dosage, frequency, duration, instructions}], labTests: [string], followUpDate, notes }
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
    const { data, error } = await supabase.rpc("save_prescription", {
      p_consultation_id: id,
      p_diagnosis: body?.diagnosis ? String(body.diagnosis) : null,
      p_medicine_items: Array.isArray(body?.medicineItems) ? body.medicineItems : [],
      p_lab_tests: Array.isArray(body?.labTests) ? body.labTests : [],
      p_follow_up_date: body?.followUpDate ? String(body.followUpDate) : null,
      p_notes: body?.notes ? String(body.notes) : null,
      p_created_by: admin.adminId,
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
