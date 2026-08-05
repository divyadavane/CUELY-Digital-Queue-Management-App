import { NextRequest, NextResponse } from "next/server";
import { getPortalSession } from "@/lib/portal/session";
import { getPortalBills } from "@/lib/portal/data";

export async function GET(req: NextRequest) {
  const session = await getPortalSession(req);
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const bills = await getPortalBills(session.phone);
  return NextResponse.json({ bills });
}
