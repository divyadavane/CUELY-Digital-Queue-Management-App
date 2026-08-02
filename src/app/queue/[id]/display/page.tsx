import { createClient } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export default async function DisplayPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();

  // Fetch all active queues (departments/doctors)
  const { data: queues } = await supabase
    .from("queues")
    .select("*")
    .eq("is_active", true);

  if (!queues || queues.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <p className="text-2xl">No active queues found.</p>
      </div>
    );
  }

  // Fetch tickets for all these queues
  const { data: tickets } = await supabase
    .from("tickets")
    .select("queue_id, token_number, status, customer_name, called_at")
    .in("status", ["called", "serving"])
    .order("called_at", { ascending: false, nullsFirst: false });

  // Group tickets by queue
  const servingByQueue: Record<string, any[]> = {};
  queues.forEach((q) => {
    servingByQueue[q.id] = tickets?.filter((t) => t.queue_id === q.id) || [];
  });

  return (
    <div className="min-h-screen bg-background text-foreground p-8 flex flex-col font-sans">
      <header className="mb-12 text-center">
        <h1 className="text-5xl font-bold font-sans tracking-tight mb-2">
          Hospital Now Serving
        </h1>
        <p className="text-2xl text-muted-foreground">Please proceed to your counter when called</p>
      </header>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-[1400px] mx-auto w-full">
        {queues.map((queue) => {
          const currentServing = servingByQueue[queue.id];
          return (
            <div key={queue.id} className="bg-surface border-4 border-accent rounded-3xl p-8 flex flex-col items-center justify-start premium-shadow">
              <h2 className="text-2xl font-bold mb-2 text-foreground text-center">
                {queue.counter_number || "Counter"} &mdash; {queue.doctor_name || queue.name}
              </h2>
              <p className="text-lg text-muted-foreground mb-8 text-center">{queue.department}</p>
              
              {currentServing.length > 0 ? (
                <div className="space-y-6 w-full">
                  {currentServing.map((ticket, idx) => (
                    <div key={idx} className="bg-background rounded-2xl p-6 text-center animate-pulse border-2 border-accent">
                      <div className="text-6xl font-black tracking-tighter text-foreground mb-2">
                        {ticket.token_number}
                      </div>
                      <div className="text-xl text-muted-foreground font-medium truncate">
                        {ticket.customer_name || "Patient"}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-2xl text-muted-foreground font-medium text-center flex-1 flex items-center justify-center">
                  Waiting...
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Auto-refresh script */}
      <script dangerouslySetInnerHTML={{
        __html: `
          setTimeout(function() {
            window.location.reload();
          }, 5000);
        `
      }} />
    </div>
  );
}
