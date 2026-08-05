import { NextRequest, NextResponse } from "next/server";
import { getPortalSession } from "@/lib/portal/session";
import { getPatientJoinRoom } from "@/lib/portal/consultations";

export const maxDuration = 10;

// GET /api/portal/consultations/join?consultationId=...
// Authorizes the patient to join their room and returns the room_token.
// The token is the shared secret for the realtime signaling channel and is
// never returned to anyone who doesn't own the consultation (and has paid).
export async function GET(req: NextRequest) {
  const session = await getPortalSession(req);
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const consultationId = req.nextUrl.searchParams.get("consultationId");
  if (!consultationId) {
    return NextResponse.json({ error: "consultationId is required" }, { status: 400 });
  }

  const room = await getPatientJoinRoom(consultationId, session);
  if (!room) {
    return NextResponse.json({ error: "Consultation is not joinable" }, { status: 403 });
  }

  return NextResponse.json({ consultation: room.consultation, roomToken: room.roomToken });
}
