import { createClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
import { DashboardClient } from "@/components/dashboard/DashboardClient";

export default async function DashboardPage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: admin } = await supabase
    .from("admins")
    .select("business_id, businesses(name)")
    .eq("id", user.id)
    .single();

  if (!admin) redirect("/login"); // fallback

  const adminData = admin as any;
  const businessName = Array.isArray(adminData.businesses) 
    ? adminData.businesses[0]?.name 
    : adminData.businesses?.name || "Dashboard";

  // Fetch all active queues for this business
  const { data: queues, error: queuesError } = await supabase
    .from("queues")
    .select("*")
    .eq("business_id", admin.business_id)
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  if (queuesError) {
    console.error("Error fetching queues:", queuesError);
  }

  return (
    <DashboardClient 
      initialQueues={queues || []} 
      businessName={businessName} 
      businessId={admin.business_id}
      adminRole={adminData.role}
      currentUserId={user.id}
    />
  );
}
