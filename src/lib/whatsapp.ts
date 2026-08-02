import { formatPhoneNumberE164, SmsVariables, SmsTriggerType, interpolateTemplate, DEFAULT_TEMPLATES } from "@/lib/sms";
import { createClient } from "@/lib/supabaseServer";

const whatsappApiToken = process.env.WHATSAPP_API_TOKEN;
const whatsappPhoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
const whatsappServicePort = process.env.WHATSAPP_PORT || "3005";

export async function sendWhatsAppNotification({
  queueId,
  ticketId,
  phone,
  triggerType,
  variables,
}: {
  queueId: string;
  ticketId?: string;
  phone: string;
  triggerType: SmsTriggerType;
  variables: SmsVariables;
}) {
  if (!phone || !phone.trim()) {
    return { success: false, error: "No phone number provided" };
  }

  const supabase = await createClient();
  const formattedPhone = formatPhoneNumberE164(phone);
  const cleanDigits = formattedPhone.replace("+", "");

  let clinicName = "Sunrise Clinic";
  let customTemplates: Record<string, string> = {};

  try {
    const { data: queue } = await supabase.from("queues").select("name, sms_templates").eq("id", queueId).single();
    if (queue) {
      if (queue.name) clinicName = queue.name;
      if (queue.sms_templates && typeof queue.sms_templates === "object") {
        customTemplates = queue.sms_templates as Record<string, string>;
      }
    }
  } catch (e) {}

  const rawTemplate = customTemplates[triggerType] || DEFAULT_TEMPLATES[triggerType] || DEFAULT_TEMPLATES.manual;
  const messageBody = interpolateTemplate(rawTemplate, {
    clinic_name: clinicName,
    patient_name: variables.patient_name || "Patient",
    token_number: variables.token_number || "0",
    wait_time: variables.wait_time || "5",
    position: variables.position || "2",
    ...variables,
  });

  const whatsappUrl = `https://wa.me/${cleanDigits}?text=${encodeURIComponent(messageBody)}`;

  let status = "sent";
  let errorMsg: string | undefined = undefined;
  let sentViaService = false;

  // 1. First, attempt to send via local whatsapp-web.js service if running
  try {
    const serviceRes = await fetch(`http://localhost:${whatsappServicePort}/api/notify-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phoneNumber: cleanDigits,
        tokenNumber: variables.token_number || "0",
        clinicName,
        status: triggerType,
        roomNumber: variables.room_number || "Room 1",
        waitTime: variables.wait_time ? `${variables.wait_time} mins` : "5 mins",
        message: messageBody,
      }),
    });

    if (serviceRes.ok) {
      const sData = await serviceRes.json();
      if (sData.success) {
        sentViaService = true;
        console.log(`[WhatsApp Web Service] Sent successfully to ${formattedPhone}`);
      } else {
        errorMsg = sData.error;
      }
    }
  } catch (err) {
    // Service not running locally, will fall back to Meta API or wa.me URL
  }

  // 2. If local service was not used, try Meta WhatsApp Cloud API if configured
  if (!sentViaService && whatsappApiToken && whatsappPhoneNumberId) {
    try {
      const response = await fetch(`https://graph.facebook.com/v18.0/${whatsappPhoneNumberId}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${whatsappApiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: cleanDigits,
          type: "text",
          text: { body: messageBody },
        }),
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData?.error?.message || "WhatsApp Meta API Error");
      }
      console.log(`[WhatsApp Meta API Direct Sent] to ${formattedPhone}`);
    } catch (err: any) {
      console.error("[WhatsApp Send Error]:", err);
      status = "failed";
      errorMsg = err?.message || "Failed to deliver WhatsApp message via Meta API";
    }
  }

  // 3. Log to sms_logs with whatsapp channel indicator
  try {
    await supabase.from("sms_logs").insert({
      queue_id: queueId,
      ticket_id: ticketId || null,
      phone: formattedPhone,
      trigger_type: `whatsapp_${triggerType}`,
      message: messageBody,
      status,
      error_msg: errorMsg || null,
    });
  } catch (e) {}

  return { 
    success: true, 
    message: messageBody, 
    whatsappUrl, 
    formattedPhone,
    sentViaService,
    error: errorMsg 
  };
}
