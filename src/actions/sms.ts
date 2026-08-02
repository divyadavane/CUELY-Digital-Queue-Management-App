"use server";

import { createClient } from "@/lib/supabaseServer";
import { sendWhatsAppNotification } from "@/lib/whatsapp";
import { SmsTriggerType, setMemoryTemplates, setMemorySmsEnabled } from "@/lib/sms";

export async function resendSmsAction(ticketId: string): Promise<{ success: boolean; whatsappUrl?: string; error?: string }> {
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

  return { success: result.success, whatsappUrl: result.whatsappUrl, error: result.error };
}

export async function updateSmsTemplatesAction(queueId: string, templates: Record<string, string>): Promise<{ success: boolean; error?: string }> {
  setMemoryTemplates(queueId, templates);

  const supabase = await createClient();

  try {
    const { error } = await supabase
      .from("queues")
      .update({ sms_templates: templates })
      .eq("id", queueId);

    if (error) {
      console.warn("Database column sms_templates update error:", error.message);
    }
  } catch (err: any) {
    console.warn("Saved SMS templates to memory store. Database column missing:", err);
  }

  return { success: true };
}

export async function toggleSmsNotificationsAction(queueId: string, enabled: boolean): Promise<{ success: boolean; error?: string }> {
  setMemorySmsEnabled(queueId, enabled);

  const supabase = await createClient();

  try {
    const { error } = await supabase
      .from("queues")
      .update({ sms_enabled: enabled })
      .eq("id", queueId);

    if (error) {
      console.warn("Database column sms_enabled update error:", error.message);
    }
  } catch (err: any) {
    console.warn("Saved SMS enabled status to memory store. Database column missing:", err);
  }

  return { success: true };
}
