import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { subscription, ticketId } = body;

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json({ success: false, error: "Invalid subscription data" }, { status: 400 });
    }

    if (!ticketId) {
      return NextResponse.json({ success: false, error: "Ticket ID is required" }, { status: 400 });
    }

    const supabase = await createClient();

    // Insert or update subscription
    const { error } = await supabase.from("push_subscriptions").insert({
      ticket_id: ticketId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    });

    if (error) {
      console.error("[Push API] Database error saving subscription:", error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // Update ticket notification method to 'push'
    await supabase.from("tickets").update({ notification_method: 'push' }).eq('id', ticketId);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[Push API] Internal Server Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
