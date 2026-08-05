import { DoctorQueueView } from "@/components/dashboard/DoctorQueueView";
import { createClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";

export default async function DoctorQueuePage() {
  const supabase = await createClient();

  const [{ data: user }, { data: queues }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from("queues").select("*"),
  ]);

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-slate-950">
      <DoctorQueueView queues={queues || []} />
    </main>
  );
}
