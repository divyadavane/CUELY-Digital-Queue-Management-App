"use client";

import { useState, useEffect, useCallback } from "react";
import { TopBar } from "./TopBar";
import { StatsStrip } from "./StatsStrip";
import { QueueList } from "./QueueList";
import { CallNextButton } from "./CallNextButton";
import { PauseToggle } from "./PauseToggle";
import { TicketSearch } from "./TicketSearch";
import { ManualTicketForm } from "./ManualTicketForm";
import { UrgencyAnalyticsPanel } from "./UrgencyAnalyticsPanel";
import { useQueueRealtime } from "@/hooks/useQueueRealtime";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { DoctorRatingBadge } from "@/components/ui/DoctorRatingBadge";
import { Database } from "@/types/database";
import { createClient } from "@/lib/supabase";
import { Toaster } from "react-hot-toast";
import { SmsTemplateEditorModal } from "./SmsTemplateEditorModal";
import { BillingManager } from "./BillingManager";
import { BusinessSettingsModal } from "./BusinessSettingsModal";
import { BillInfo } from "./BillStatusBadge";
import { LayoutDashboard, BarChart3, Command, Keyboard, MessageSquare, Settings, Globe } from "lucide-react";
import toast from "react-hot-toast";

type Queue = Database["public"]["Tables"]["queues"]["Row"];

interface DashboardClientProps {
  initialQueues: Queue[];
  businessName: string;
  businessId: string;
  adminRole: "owner" | "admin" | string;
  currentUserId: string;
}

export function DashboardClient({
  initialQueues,
  businessName,
  businessId,
  adminRole,
  currentUserId,
}: DashboardClientProps) {
  const [activeQueueId, setActiveQueueId] = useState<string | null>(
    initialQueues.length > 0 ? initialQueues[0].id : null
  );

  const [activeQueue, setActiveQueue] = useState<Queue | null>(
    initialQueues.length > 0 ? initialQueues[0] : null
  );

  const [activeTab, setActiveTab] = useState<"queue" | "analytics">("queue");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSmsModalOpen, setIsSmsModalOpen] = useState(false);
  const [isBusinessSettingsOpen, setIsBusinessSettingsOpen] = useState(false);

  const { tickets, loading, queues, isMuted, toggleMute } = useQueueRealtime(
    activeQueueId,
    initialQueues
  );
  const [totalServedToday, setTotalServedToday] = useState(0);
  const [avgWaitSeconds, setAvgWaitSeconds] = useState(300);
  const [noShowRate, setNoShowRate] = useState(0);
  const [billsByTicket, setBillsByTicket] = useState<Record<string, BillInfo>>({});
  const supabase = createClient();

  // Fetch read-only billing status for the active queue
  const fetchBills = useCallback(async () => {
    if (!activeQueueId) return;
    try {
      const res = await fetch(`/api/dashboard/bills?queueId=${activeQueueId}`);
      if (!res.ok) return;
      const { bills } = await res.json();
      const map: Record<string, BillInfo> = {};
      (bills || []).forEach((b: BillInfo) => {
        if (b.ticket_id) map[b.ticket_id] = b;
      });
      setBillsByTicket(map);
    } catch (e) {
      console.error("Failed to fetch bills:", e);
    }
  }, [activeQueueId]);

  useEffect(() => {
    if (activeQueueId) {
      const q = queues.find((q) => q.id === activeQueueId) || null;
      setActiveQueue(q);
    }
  }, [activeQueueId, queues]);

  useEffect(() => {
    fetchBills();
    const channel = supabase
      .channel(`public:bills:admin:${activeQueueId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bills",
          filter: `business_id=eq.${activeQueue?.business_id}`,
        },
        () => fetchBills()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchBills, activeQueueId, activeQueue?.business_id, supabase]);

  useEffect(() => {
    async function fetchStats() {
      if (!activeQueueId) return;

      const today = new Date().toISOString().split("T")[0];

      // 1. Get total served today
      const { count: servedCount } = await supabase
        .from("serving_stats")
        .select("*", { count: "exact", head: true })
        .eq("queue_id", activeQueueId)
        .gte("recorded_at", `${today}T00:00:00Z`)
        .lte("recorded_at", `${today}T23:59:59Z`);

      const actualServed = servedCount || 0;
      setTotalServedToday(actualServed);

      // 2. Get no show count
      const { count: noShowCount } = await supabase
        .from("queue_activity_log")
        .select("*", { count: "exact", head: true })
        .eq("queue_id", activeQueueId)
        .eq("action", "mark_no_show")
        .gte("created_at", `${today}T00:00:00Z`)
        .lte("created_at", `${today}T23:59:59Z`);

      const actualNoShows = noShowCount || 0;
      if (actualServed + actualNoShows > 0) {
        setNoShowRate(Math.round((actualNoShows / (actualServed + actualNoShows)) * 100));
      } else {
        setNoShowRate(0);
      }

      // 3. Get average wait time (live calculation from active waiting tickets if rpc returns 0)
      const { data, error } = await supabase.rpc("get_queue_status", { p_queue_id: activeQueueId });
      let avgSec = 0;
      if (!error && data) {
        const status = data as any;
        avgSec = status.avg_serving_seconds || 0;
      }

      // If average wait seconds from database is 0, calculate rolling avg from active waiting tickets
      if (avgSec === 0 && tickets.length > 0) {
        const now = Date.now();
        const totalWaitedMins = tickets.reduce((acc, t) => {
          const joined = new Date(t.joined_at).getTime();
          return acc + Math.max(1, Math.floor((now - joined) / 60000));
        }, 0);
        avgSec = Math.round((totalWaitedMins / tickets.length) * 60);
      }

      setAvgWaitSeconds(avgSec || 300);
    }

    fetchStats();
    const interval = setInterval(fetchStats, 15000);
    return () => clearInterval(interval);
  }, [activeQueueId, tickets, supabase]);

  const hasWaitingTickets = tickets.some((t) => t.status === "waiting");
  const hasCalledTicket = tickets.some((t) => t.status === "called");
  const calledTicket = tickets.find((t) => t.status === "called");

  const isCallNextDisabled = !hasWaitingTickets || hasCalledTicket;

  useKeyboardShortcuts({
    queueId: activeQueueId,
    calledTicketId: calledTicket?.id || null,
    isCallNextDisabled,
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-background relative selection:bg-accent selection:text-white">
      <Toaster position="top-center" />

      <TopBar
        businessName={businessName}
        queues={queues}
        activeQueueId={activeQueueId}
        onQueueSelect={setActiveQueueId}
        isMuted={isMuted}
        toggleMute={toggleMute}
      />

      {activeQueue?.is_paused && (
        <div className="w-full bg-amber-500/10 text-amber-400 p-3 text-center text-sm font-bold border-b border-amber-500/20 backdrop-blur-md">
          Queue paused — not accepting new patients.
        </div>
      )}

      <main className="flex-1 overflow-y-auto p-4 md:p-8 max-w-7xl mx-auto w-full">
        {activeQueueId ? (
          <>
            {/* View Switcher Tabs */}
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/10 flex-wrap gap-4">
              <div className="flex bg-surface/60 backdrop-blur-md border border-white/10 p-1.5 rounded-2xl">
                <button
                  onClick={() => setActiveTab("queue")}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                    activeTab === "queue"
                      ? "bg-accent text-white shadow-lg shadow-accent/20"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Live Queue Management
                </button>
                <button
                  onClick={() => setActiveTab("analytics")}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                    activeTab === "analytics"
                      ? "bg-accent text-white shadow-lg shadow-accent/20"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  Patient Urgency Analytics
                </button>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-surface/60 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-xl">
                  <DoctorRatingBadge queueId={activeQueueId} />
                </div>
                <div className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  Live Realtime Sync Enabled
                </div>
              </div>
            </div>

            {activeTab === "queue" ? (
              <>
                <StatsStrip
                  tickets={tickets}
                  avgWaitSeconds={avgWaitSeconds}
                  totalServedToday={totalServedToday}
                  noShowRate={noShowRate}
                />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Left Column: Actions */}
                  <div className="lg:col-span-4 flex flex-col gap-6">
                    <CallNextButton queueId={activeQueueId} isDisabled={isCallNextDisabled} />

                    {(adminRole === "owner" || adminRole === "admin") && (
                      <>
                        <BillingManager
                          queueId={activeQueueId}
                          businessId={activeQueue?.business_id || businessId}
                          initialFee={(activeQueue as any)?.consultation_fee || 0}
                        />
                        <PauseToggle queueId={activeQueueId} isPaused={activeQueue?.is_paused || false} />
                        <ManualTicketForm queueId={activeQueueId} />

                        {/* Patient Language Settings */}
                        <div className="bg-surface/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl space-y-4">
                          <div className="flex items-center gap-2 text-foreground font-bold font-sans text-sm">
                            <Globe className="w-4 h-4 text-accent" />
                            <span>Patient Language</span>
                          </div>
                          <p className="text-xs text-slate-400">
                            Default language for join &amp; track pages when a patient hasn&apos;t selected one.
                          </p>
                          <button
                            type="button"
                            onClick={() => setIsBusinessSettingsOpen(true)}
                            className="w-full py-2.5 px-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-200 hover:text-white transition-all flex items-center justify-center gap-2"
                          >
                            <Settings className="w-3.5 h-3.5 text-accent" />
                            <span>Configure Default Language</span>
                          </button>
                        </div>
                      </>
                    )}

                    {/* SMS Settings & Template Control Box */}
                    <div className="bg-surface/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-foreground font-bold font-sans text-sm">
                          <MessageSquare className="w-4 h-4 text-emerald-400" />
                          <span>SMS Notifications</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={(activeQueue as any)?.sms_enabled !== false}
                            onChange={async (e) => {
                              const enabled = e.target.checked;
                              const { toggleSmsNotificationsAction } = await import("@/actions/sms");
                              const { success } = await toggleSmsNotificationsAction(activeQueueId, enabled);
                              if (success) {
                                toast.success(`SMS Notifications ${enabled ? "Enabled" : "Disabled"}`);
                              }
                            }}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500" />
                        </label>
                      </div>

                      <p className="text-xs text-slate-400">
                        Automatic Twilio text alerts sent to patients on Token Joined, Almost There, Called & No-Show.
                      </p>

                      <button
                        type="button"
                        onClick={() => setIsSmsModalOpen(true)}
                        className="w-full py-2.5 px-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-200 hover:text-white transition-all flex items-center justify-center gap-2"
                      >
                        <Settings className="w-3.5 h-3.5 text-accent" />
                        <span>Edit Message Templates</span>
                      </button>
                    </div>

                    {/* Command-Palette Style Quick Actions */}
                    <div className="bg-surface/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl hidden lg:block">
                      <div className="flex items-center gap-2 mb-4 text-foreground font-bold font-sans">
                        <Command className="w-4 h-4 text-accent" />
                        <span>Command Palette Shortcuts</span>
                      </div>
                      <ul className="text-xs space-y-3 font-medium text-slate-300">
                        <li className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5">
                          <span>Call Next Patient</span>
                          <span className="font-mono bg-black/40 px-2 py-1 rounded-md text-[10px] border border-white/10 font-bold">N</span>
                        </li>
                        <li className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5">
                          <span>Mark Ticket Served</span>
                          <span className="font-mono bg-black/40 px-2 py-1 rounded-md text-[10px] border border-white/10 font-bold">S</span>
                        </li>
                        <li className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5">
                          <span>Mark No Show</span>
                          <span className="font-mono bg-black/40 px-2 py-1 rounded-md text-[10px] border border-white/10 font-bold">X</span>
                        </li>
                        <li className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5">
                          <span>Recall Called Patient</span>
                          <span className="font-mono bg-black/40 px-2 py-1 rounded-md text-[10px] border border-white/10 font-bold">R</span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  {/* Right Column: Live Queue */}
                  <div className="lg:col-span-8 min-w-0 flex flex-col gap-4">
                    <TicketSearch searchQuery={searchQuery} onSearchChange={setSearchQuery} />
                    <QueueList
                      tickets={tickets}
                      loading={loading}
                      searchQuery={searchQuery}
                      adminRole={adminRole}
                      currentUserId={currentUserId}
                      queues={queues}
                      billsByTicket={billsByTicket}
                    />
                  </div>
                </div>
              </>
            ) : (
              <UrgencyAnalyticsPanel
                tickets={tickets}
                totalServedToday={totalServedToday}
                noShowRate={noShowRate}
                avgWaitSeconds={avgWaitSeconds}
                queueId={activeQueueId || undefined}
              />
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <h2 className="text-2xl font-bold font-sans text-foreground mb-2">No Active Queues</h2>
              <p className="text-muted-foreground">Please configure a queue for your business first.</p>
            </div>
          </div>
        )}
      </main>

      {activeQueueId && (
        <SmsTemplateEditorModal
          queueId={activeQueueId}
          initialTemplates={(activeQueue as any)?.sms_templates}
          isOpen={isSmsModalOpen}
          onClose={() => setIsSmsModalOpen(false)}
        />
      )}

      <BusinessSettingsModal
        businessId={businessId}
        isOpen={isBusinessSettingsOpen}
        onClose={() => setIsBusinessSettingsOpen(false)}
      />
    </div>
  );
}
