"use server";

import { createClient } from "@/lib/supabaseServer";
import { sendWhatsAppNotification } from "@/lib/whatsapp";
import { SmsTriggerType } from "@/lib/sms";

export async function resendWhatsAppAction(ticketId: string) {
  const supabase = await createClient();

  const { data: ticket, error } = await supabase
    .from("tickets")
    .select("*, queues(name)")
    .eq("id", ticketId)
    .single();

  if (error || !ticket || !ticket.customer_phone) {
    return { success: false, error: "Patient phone number not found" };
  }

  const triggerType: SmsTriggerType = ticket.status === "called" ? "called" : "joined";

  const result = await sendWhatsAppNotification({
    queueId: ticket.queue_id,
    ticketId: ticket.id,
    phone: ticket.customer_phone,
    triggerType,
    variables: {
      patient_name: ticket.customer_name || "Patient",
      token_number: ticket.token_number,
      clinic_name: (ticket as any).queues?.name || "Sunrise Clinic",
    },
  });

  return result;
}
