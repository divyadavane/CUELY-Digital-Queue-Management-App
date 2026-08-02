import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabaseServer";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  
  // 1. Verify Authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    redirect("/login");
  }

  // 2. Lookup Admin Record
  const { data: admin, error: adminError } = await supabase
    .from("admins")
    .select("business_id, role, businesses(name)")
    .eq("id", user.id)
    .single();

  if (adminError || !admin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-md w-full bg-surface border border-border rounded-3xl p-8 text-center premium-shadow">
          <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto mb-6">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold font-sans text-foreground mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-8">
            Your account isn't set up as an admin yet. Please contact your business owner to grant you access.
          </p>
          <form action={async () => {
            "use server";
            const supabase = await createClient();
            await supabase.auth.signOut();
            redirect("/login");
          }}>
            <button className="w-full py-3 px-6 rounded-full font-bold bg-primary text-primary-foreground hover:scale-[1.02] transition-transform">
              Sign Out
            </button>
          </form>
        </div>
      </div>
    );
  }

  const adminData = admin as any;
  const businessName = Array.isArray(adminData.businesses) 
    ? adminData.businesses[0]?.name 
    : adminData.businesses?.name;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* 
        We pass down the authenticated user and admin details to the children.
        We can do this via cloneElement or Context, but in Next.js App Router, 
        it's easier to fetch in the child page component or pass via React Context if needed.
        Since it's a layout, children can't easily receive props directly.
        For now, just render children.
      */}
      {children}
    </div>
  );
}
