import { PatientStatusPage } from "@/components/patient/PatientStatusPage";
import { createClient } from "@/lib/supabaseServer";
import { notFound } from "next/navigation";

interface PatientStatusRouteProps {
  params: Promise<{ ticketId: string }>;
}

import { PatientChatWidget } from "@/components/patient/PatientChatWidget";

export default async function PatientStatusRoute({ params }: PatientStatusRouteProps) {
  const { ticketId } = await params;
  const supabase = await createClient();

  const { data: ticket, error } = await supabase
    .from("tickets")
    .select("*, queues(name, business_id)")
    .eq("id", ticketId)
    .single();

  if (error || !ticket) {
    notFound();
  }

  const clinicName = (ticket as any)?.queues?.name || "Sunrise Clinic";
  const businessId = (ticket as any)?.queues?.business_id;

  return (
    <>
      <PatientStatusPage initialTicket={ticket} clinicName={clinicName} />
      {businessId && <PatientChatWidget ticketId={ticket.id} businessId={businessId} />}
    </>
  );
}
