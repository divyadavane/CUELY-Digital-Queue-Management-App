"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  History,
  LayoutDashboard,
  LogOut,
  Star,
  User,
  Wallet,
} from "lucide-react";
import { clearPortalToken } from "@/lib/portal/client";
import { usePortalSession } from "@/hooks/usePortalSession";
import { CuelyLogo } from "@/components/ui/CuelyLogo";
import { DashboardSection } from "@/components/portal/sections/DashboardSection";
import { AppointmentsSection } from "@/components/portal/sections/AppointmentsSection";
import { VisitsSection } from "@/components/portal/sections/VisitsSection";
import { RatingsSection } from "@/components/portal/sections/RatingsSection";
import { BillingSection } from "@/components/portal/sections/BillingSection";
import { ProfileSection } from "@/components/portal/sections/ProfileSection";

type Tab = "dashboard" | "appointments" | "visits" | "ratings" | "billing" | "profile";

const NAV_ITEMS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: "dashboard", label: "Home", icon: <LayoutDashboard className="w-5 h-5" /> },
  { key: "appointments", label: "Appts", icon: <CalendarDays className="w-5 h-5" /> },
  { key: "visits", label: "Visits", icon: <History className="w-5 h-5" /> },
  { key: "ratings", label: "Ratings", icon: <Star className="w-5 h-5" /> },
  { key: "billing", label: "Billing", icon: <Wallet className="w-5 h-5" /> },
  { key: "profile", label: "Profile", icon: <User className="w-5 h-5" /> },
];

export function PatientPortal() {
  const router = useRouter();
  const { profile, loading, refresh } = usePortalSession();
  const [tab, setTab] = useState<Tab>("dashboard");

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold text-slate-400">Opening your portal...</p>
      </div>
    );
  }

  if (!profile) {
    clearPortalToken();
    router.replace("/portal/login");
    return null;
  }

  const firstName = (profile.name || "Patient").trim().split(" ")[0];

  return (
    <div className="min-h-screen bg-[#070b16] text-white font-manrope">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-24 w-96 h-96 rounded-full bg-blue-600/20 blur-3xl" />
        <div className="absolute top-1/3 -right-32 w-96 h-96 rounded-full bg-purple-600/15 blur-3xl" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#070b16]/85 backdrop-blur-xl border-b border-white/10 px-4 py-3.5">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <CuelyLogo size="sm" showGlow />
            <div>
              <p className="text-sm font-extrabold leading-none">My Portal</p>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                Welcome, {firstName}
              </p>
            </div>
          </div>
          <button
            onClick={() => router.push("/portal/login")}
            className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-all"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 max-w-lg mx-auto px-4 pt-6 pb-28">
        {tab === "dashboard" && (
          <DashboardSection patientName={profile.name} onNavigate={(t) => setTab(t as Tab)} />
        )}
        {tab === "appointments" && <AppointmentsSection />}
        {tab === "visits" && <VisitsSection />}
        {tab === "ratings" && <RatingsSection />}
        {tab === "billing" && <BillingSection />}
        {tab === "profile" && (
          <ProfileSection profile={profile} onUpdated={refresh} />
        )}
      </main>

      {/* Bottom navigation (mobile-first) */}
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-[#0b101d]/95 backdrop-blur-xl border-t border-white/10 pb-[env(safe-area-inset-bottom)]">
        <div className="max-w-lg mx-auto grid grid-cols-6 px-2">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              onClick={() => setTab(item.key)}
              className={`flex flex-col items-center gap-1 py-3 relative transition-all ${
                tab === item.key ? "text-blue-400" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              {tab === item.key && (
                <span className="absolute top-0 w-10 h-0.5 rounded-full bg-blue-500" />
              )}
              {item.icon}
              <span className="text-[9px] font-bold tracking-wide">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
