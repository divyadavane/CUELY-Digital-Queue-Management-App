import { createClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
import { ActivityLog } from "@/components/dashboard/ActivityLog";

export default async function ActivityPage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: admin } = await supabase
    .from("admins")
    .select("business_id, businesses(name)")
    .eq("id", user.id)
    .single();

  if (!admin) redirect("/login");

  // Fetch today's activity logs for this business's queues
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  
  const { data: logs, error } = await supabase
    .from("queue_activity_log")
    .select(`
      id, 
      action, 
      created_at, 
      queues!inner(business_id, name),
      tickets(token_number),
      admins(id, role) 
    `)
    .eq("queues.business_id", admin.business_id)
    .gte("created_at", `${today}T00:00:00Z`)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching activity logs:", error);
  }

  const formattedLogs = (logs || []).map((log: any) => ({
    id: log.id,
    action: log.action,
    createdAt: log.created_at,
    queueName: log.queues?.name || "Unknown Queue",
    tokenNumber: log.tickets?.token_number || null,
    adminId: log.admins?.id || "System"
  }));

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-7xl mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-3xl font-bold font-sans text-foreground">Activity Log</h1>
        <p className="text-muted-foreground mt-2">Today's actions across all queues.</p>
      </div>
      <ActivityLog logs={formattedLogs} />
    </div>
  );
}
