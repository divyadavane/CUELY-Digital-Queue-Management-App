import { NextRequest, NextResponse } from "next/server";
import { getAdminUser, isAdminOfConsultation } from "@/lib/admin/guard";
import { getDoctorJoinRoom } from "@/lib/admin/consultations";

export const maxDuration = 10;

// GET /api/dashboard/consultations/join?consultationId=...
// Authorizes the doctor to join a room; returns the room_token + detail.
export async function GET(req: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const consultationId = req.nextUrl.searchParams.get("consultationId");
  if (!consultationId) {
    return NextResponse.json({ error: "consultationId is required" }, { status: 400 });
  }

  if (!(await isAdminOfConsultation(consultationId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const room = await getDoctorJoinRoom(consultationId);
  if (!room) {
    return NextResponse.json({ error: "Consultation is not joinable" }, { status: 403 });
  }

  return NextResponse.json({ roomToken: room.roomToken, consultation: room.detail });
}
