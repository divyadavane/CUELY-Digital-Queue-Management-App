import { NextRequest, NextResponse } from "next/server";

// This token can be any string you choose — it just needs to match
// what you enter in the Meta Developer Console "Verify token" field.
const VERIFY_TOKEN = "cuely_whatsapp_verify_2024";

/**
 * GET /api/whatsapp/webhook
 * Meta sends a GET request to verify the webhook URL.
 */
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("[WhatsApp Webhook] Verification successful");
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

/**
 * POST /api/whatsapp/webhook
 * Meta sends message delivery status updates and incoming messages here.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Log delivery status updates (sent, delivered, read, failed)
    const entries = body?.entry || [];
    for (const entry of entries) {
      const changes = entry?.changes || [];
      for (const change of changes) {
        const statuses = change?.value?.statuses || [];
        for (const status of statuses) {
          console.log(
            `[WhatsApp Status] ${status.recipient_id}: ${status.status}` +
              (status.errors ? ` | Error: ${JSON.stringify(status.errors)}` : "")
          );
        }
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch {
    return NextResponse.json({ success: true }, { status: 200 });
  }
}
