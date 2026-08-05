import { NextRequest, NextResponse } from "next/server";
import { getPortalSession } from "@/lib/portal/session";

export async function GET(req: NextRequest) {
  const session = await getPortalSession(req);
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  return NextResponse.json({ profile: session.profile });
}
