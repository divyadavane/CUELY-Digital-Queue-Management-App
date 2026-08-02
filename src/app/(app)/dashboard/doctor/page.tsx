import { DoctorQueueView } from "@/components/dashboard/DoctorQueueView";
import { createClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";

export default async function DoctorQueuePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: queues } = await supabase.from("queues").select("*");

  return (
    <main className="min-h-screen bg-slate-950">
      <DoctorQueueView queues={queues || []} />
    </main>
  );
}
