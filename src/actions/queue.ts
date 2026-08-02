"use server";

import { createClient } from "@/lib/supabaseServer";
import { sendWhatsAppNotification } from "@/lib/whatsapp";
import { sendPushNotification } from "@/lib/push";

export async function joinQueueAction(
  queueId: string,
  phone: string | null,
  emergencyType: string | null = null,
  name: string | null = null
) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("join_queue", {
    p_queue_id: queueId,
    p_name: name || undefined,
    p_phone: phone || undefined,
    p_emergency_type: emergencyType || undefined,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  const result = data as any;
  let whatsappResult = null;
  if (phone && result.ticket_id) {
    whatsappResult = await sendWhatsAppNotification({
      queueId,
      ticketId: result.ticket_id,
      phone,
      triggerType: "joined",
      variables: {
        patient_name: name || "Patient",
        token_number: result.token_number,
        wait_time: 5,
      },
    });
  }

  return { success: true, data: result, whatsapp: whatsappResult };
}

export async function bookAppointmentAction(
  queueId: string,
  phone: string,
  emergencyType: string | null,
  date: string,
  time: string | null = null,
  name: string | null = null
) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("book_appointment", {
    p_queue_id: queueId,
    p_name: name || undefined,
    p_phone: phone,
    p_emergency_type: emergencyType || undefined,
    p_date: date,
    p_time: time || undefined,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  const result = data as any;
  if (phone && result.appointment_id) {
    await sendWhatsAppNotification({
      queueId,
      phone,
      triggerType: "joined",
      variables: {
        patient_name: name || "Patient",
        token_number: "APPT",
        wait_time: `Booked for ${date}`,
      },
    });
  }

  return { success: true, data: result };
}

export async function checkInAppointmentAction(appointmentId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("check_in_appointment", {
    p_appointment_id: appointmentId,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: data as any };
}

export async function cancelAppointmentAction(appointmentId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("cancel_appointment", {
    p_appointment_id: appointmentId,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: data as any };
}

export async function callNextAction(queueId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("call_next", { p_queue_id: queueId });

  if (error) {
    return { success: false, error: error.message };
  }

  const result = data as any;

  if (result.ticket_id) {
    const { data: ticket } = await supabase.from("tickets").select("notification_method").eq("id", result.ticket_id).single();
    
    if (ticket?.notification_method === 'push') {
      await sendPushNotification(
        result.ticket_id,
        "It's your turn!",
        `Your token ${result.token_number} is being called. Please proceed.`,
        `/queue/${queueId}/track/${result.ticket_id}`
      );
    } else if (result.customer_phone) {
      await sendWhatsAppNotification({
        queueId,
        ticketId: result.ticket_id,
        phone: result.customer_phone,
        triggerType: "called",
        variables: {
          patient_name: result.customer_name || "Patient",
          token_number: result.token_number,
        },
      });
    }

    // Check remaining waiting tickets to send "Almost There" WhatsApp alerts (2-3 positions away)
    try {
      const { data: waiting } = await supabase
        .from("tickets")
        .select("id, customer_phone, customer_name, token_number")
        .eq("queue_id", queueId)
        .eq("status", "waiting")
        .order("joined_at", { ascending: true })
        .limit(3);

      if (waiting && waiting.length > 0) {
        for (let i = 0; i < waiting.length; i++) {
          const t = waiting[i];
          const pos = i + 1; // position in line
          if (t.customer_phone && (pos === 2 || pos === 3)) {
            await sendWhatsAppNotification({
              queueId,
              ticketId: t.id,
              phone: t.customer_phone,
              triggerType: "almost_there",
              variables: {
                patient_name: t.customer_name || "Patient",
                token_number: t.token_number,
                position: pos,
              },
            });
          }
        }
      }
    } catch (e) {
      console.warn("Skipped position alert check:", e);
    }
  }

  return { success: true, data: result };
}

export async function recallTicketAction(ticketId: string) {
  const supabase = await createClient();
  const { data: ticket } = await supabase
    .from("tickets")
    .select("*, queues(name)")
    .eq("id", ticketId)
    .single();

  const { data, error } = await supabase.rpc("recall_ticket", { p_ticket_id: ticketId });

  if (error) {
    return { success: false, error: error.message };
  }

  if (ticket) {
    if (ticket.notification_method === 'push') {
      await sendPushNotification(
        ticket.id,
        "It's your turn!",
        `Your token ${ticket.token_number} is being called again. Please proceed.`,
        `/queue/${ticket.queue_id}/track/${ticket.id}`
      );
    } else if (ticket.customer_phone) {
      await sendWhatsAppNotification({
        queueId: ticket.queue_id,
        ticketId: ticket.id,
        phone: ticket.customer_phone,
        triggerType: "called",
        variables: {
          patient_name: ticket.customer_name || "Patient",
          token_number: ticket.token_number,
        },
      });
    }
  }

  return { success: true, data: data as any };
}
