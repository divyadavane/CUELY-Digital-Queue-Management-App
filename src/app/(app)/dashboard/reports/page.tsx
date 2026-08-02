import { ReportsDashboard } from "@/components/reports/ReportsDashboard";
import { createClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";

export default async function ReportsPage() {
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
      <ReportsDashboard queues={queues || []} />
    </main>
  );
}
