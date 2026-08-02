import { KioskWizard } from "@/components/kiosk/KioskWizard";
import { createClient } from "@/lib/supabaseServer";

interface KioskPageProps {
  params: Promise<{ queueId: string }>;
}

export default async function KioskPage({ params }: KioskPageProps) {
  const { queueId } = await params;
  const supabase = await createClient();

  const { data: queue } = await supabase
    .from("queues")
    .select("name, business_id")
    .eq("id", queueId)
    .single();

  const { data: queues } = await supabase.from("queues").select("id, name");

  return (
    <KioskWizard
      queueId={queueId}
      clinicName={queue?.name || "Sunrise Clinic"}
      queues={queues || []}
    />
  );
}
