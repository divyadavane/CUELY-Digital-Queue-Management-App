import { createClient } from "@/lib/supabaseServer";

const pushServicePort = process.env.PUSH_PORT || "3006";

export async function sendPushNotification(ticketId: string, title: string, body: string, url: string = "/") {
  const supabase = await createClient();

  try {
    const { data: subscription } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!subscription) return { success: false, error: "No push subscription found" };

    const payload = { title, body, url };
    
    const pushRes = await fetch(`http://localhost:${pushServicePort}/api/notify-push`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subscription: {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth,
          }
        },
        payload
      })
    });

    if (pushRes.status === 410) {
      // Subscription expired, remove it
      await supabase.from("push_subscriptions").delete().eq("id", subscription.id);
      return { success: false, error: "Subscription expired and removed" };
    }

    if (!pushRes.ok) {
      throw new Error("Push service failed");
    }

    return { success: true };
  } catch (err: any) {
    console.error("[Push Client] Error sending notification:", err);
    return { success: false, error: err.message };
  }
}
