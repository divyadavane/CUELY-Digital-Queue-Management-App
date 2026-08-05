import { sendWhatsAppNotification } from "@/lib/whatsapp";

interface VideoBookingNotifyArgs {
  queueId: string;
  phone: string;
  consultationId: string;
  patientName: string;
  joinUrl: string;
  scheduledStart: string;
}

/**
 * Sends the WhatsApp/SMS confirmation when a video consultation is booked.
 * Reuses the full notification pipeline (local service -> Meta API -> wa.me),
 * translated via the business/patient preferred language.
 */
export async function sendVideoBookingNotification({
  queueId,
  phone,
  patientName,
  joinUrl,
  scheduledStart,
}: VideoBookingNotifyArgs) {
  const start = new Date(scheduledStart);
  const date = start.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const time = start.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });

  return sendWhatsAppNotification({
    queueId,
    ticketId: undefined,
    phone,
    triggerType: "video_booked",
    variables: {
      patient_name: patientName,
      date,
      time,
      join_url: joinUrl,
    },
  });
}
