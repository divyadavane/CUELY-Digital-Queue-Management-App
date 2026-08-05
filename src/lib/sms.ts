import { createClient } from "@/lib/supabaseServer";
import { sendWhatsAppNotification } from "@/lib/whatsapp";

export type SmsTriggerType = "joined" | "almost_there" | "called" | "no_show" | "served" | "manual" | "video_booked";

export interface SmsVariables {
  patient_name?: string;
  token_number?: number | string;
  wait_time?: number | string;
  clinic_name?: string;
  position?: number | string;
  [key: string]: any;
}

// Global in-memory template fallback store
const MEMORY_TEMPLATES: Record<string, Record<string, string>> = {};
const MEMORY_ENABLED: Record<string, boolean> = {};

export const DEFAULT_TEMPLATES: Record<SmsTriggerType, string> = {
  joined: "Hi {patient_name}! Your token #{token_number} for {clinic_name} is confirmed. Est. wait: {wait_time}m. We will message on WhatsApp when close.",
  almost_there: "Almost your turn! Token #{token_number} is only {position} positions away at {clinic_name}. Please head to the clinic.",
  called: "TOKEN #{token_number}! Please proceed to Desk/Room 1 now. Your turn has arrived.",
  no_show: "You missed your turn for Token #{token_number}. Visit the desk within 10 min to get requeued.",
  served: "Thank you for visiting {clinic_name}! Token #{token_number} is completed. Have a great day!",
  manual: "Update for Token #{token_number} at {clinic_name}: Your queue status has been updated.",
  video_booked: "Your video consultation with {clinic_name} is confirmed for {date} at {time}. Join: {join_url}",
};

export function setMemoryTemplates(queueId: string, templates: Record<string, string>) {
  MEMORY_TEMPLATES[queueId] = templates;
}

export function setMemorySmsEnabled(queueId: string, enabled: boolean) {
  MEMORY_ENABLED[queueId] = enabled;
}

export function interpolateTemplate(template: string, vars: SmsVariables): string {
  let result = template;
  for (const [key, val] of Object.entries(vars)) {
    const replacement = val !== undefined && val !== null ? String(val) : "";
    result = result.replace(new RegExp(`\\{${key}\\}`, "g"), replacement);
  }
  return result;
}

export function formatPhoneNumberE164(phone: string): string {
  if (!phone) return "";
  let cleaned = phone.trim();
  
  // Extract all digits
  const digitsOnly = cleaned.replace(/\D/g, "");
  if (!digitsOnly) return "";

  if (cleaned.startsWith("+")) {
    return "+" + digitsOnly;
  }

  // 12 digits starting with 91 (e.g. 918983675270)
  if (digitsOnly.length === 12 && digitsOnly.startsWith("91")) {
    return "+" + digitsOnly;
  }

  // 11 digits starting with 1 (e.g. 14155551234)
  if (digitsOnly.length === 11 && digitsOnly.startsWith("1")) {
    return "+" + digitsOnly;
  }

  // 11 digits starting with 0 (e.g. 08983675270)
  if (digitsOnly.length === 11 && digitsOnly.startsWith("0")) {
    return "+91" + digitsOnly.slice(1);
  }

  // 10-digit mobile number: if starts with 6,7,8,9 -> Indian mobile (+91), otherwise +1
  if (digitsOnly.length === 10) {
    if (/^[6-9]/.test(digitsOnly)) {
      return "+91" + digitsOnly;
    }
    return "+1" + digitsOnly;
  }

  return "+" + digitsOnly;
}

// Redirect legacy SMS function calls directly to WhatsApp Notifications
export async function sendSmsNotification({
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
  return sendWhatsAppNotification({
    queueId,
    ticketId,
    phone,
    triggerType,
    variables,
  });
}
