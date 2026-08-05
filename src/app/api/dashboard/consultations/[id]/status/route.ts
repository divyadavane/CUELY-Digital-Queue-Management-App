import { NextRequest, NextResponse } from "next/server";
import { getAdminUser, isAdminOfConsultation } from "@/lib/admin/guard";
import { createServiceClient } from "@/lib/supabaseService";

export const maxDuration = 10;

const ALLOWED = new Set(["ready", "in_call", "completed", "cancelled", "missed"]);

// POST /api/dashboard/consultations/[id]/status
// body: { status: "ready" | "in_call" | "completed" | "cancelled" | "missed" }
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
    const status = String(body?.status || "");
    if (!ALLOWED.has(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { data, error } = await supabase.rpc("set_consultation_status", {
      p_consultation_id: id,
      p_status: status,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, ...(data as Record<string, unknown>) });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
