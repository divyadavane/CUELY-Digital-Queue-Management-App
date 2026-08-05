"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PremiumAuthForm } from "@/components/ui/premium-auth";
import { joinQueueAction } from "@/actions/queue";
import toast from "react-hot-toast";
import { User, Phone, AlertTriangle, ArrowRight, Search, Ticket, LayoutDashboard } from "lucide-react";
import { CountryPhoneInput } from "@/components/ui/country-phone-input";
import { CuelyLogo } from "@/components/ui/CuelyLogo";

type LoginRole = "staff" | "patient";
type PatientAction = "join" | "track";

const EMERGENCY_OPTIONS = [
  { value: "routine", label: "Routine Consultation / Regular Visit" },
  { value: "urgent", label: "Urgent Care (Moderate Pain / High Fever)" },
  { value: "critical", label: "Critical / Medical Emergency" },
  { value: "follow_up", label: "Follow-up Visit / Report Review" },
  { value: "other", label: "Other / General Checkup" },
];

const DEFAULT_QUEUE_ID = "22222222-2222-2222-2222-222222222222";

export function LoginForm() {
  const [role, setRole] = useState<LoginRole>("staff");
  const [patientAction, setPatientAction] = useState<PatientAction>("join");

  // Patient Join Form State
  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [emergencyType, setEmergencyType] = useState("routine");

  // Track Phone State
  const [trackPhone, setTrackPhone] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  const handlePatientJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!patientName.trim()) {
      setError("Please enter your full name");
      return;
    }

    setLoading(true);
    const { success, data, error: actionError } = await joinQueueAction(
      DEFAULT_QUEUE_ID,
      patientPhone || null,
      emergencyType,
      patientName
    );

    if (!success || !data?.ticket_id) {
      setError(actionError || "Failed to join queue. Please try again.");
      toast.error(actionError || "Failed to join queue");
      setLoading(false);
      return;
    }

    // Save ticket to local storage and redirect to live tracking page
    localStorage.setItem(`cuely_ticket_${DEFAULT_QUEUE_ID}`, data.ticket_id);
    toast.success(`Joined queue successfully! Token #${data.token_number}`);
    router.push(`/join/${DEFAULT_QUEUE_ID}`);
  };

  const handlePatientTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackPhone.trim()) {
      setError("Please enter your phone number or token number");
      return;
    }
    router.push(`/patient?phone=${encodeURIComponent(trackPhone.trim())}`);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Brand Header */}
      <div className="text-center mb-6 flex flex-col items-center">
        <CuelyLogo size="lg" showGlow className="mb-3" />
        <h1 className="text-2xl font-extrabold font-sans text-foreground">Welcome to Cuely</h1>
        <p className="text-xs font-semibold text-muted-foreground mt-1">Select your access portal to continue</p>
      </div>

      <div className="bg-surface/80 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
        {/* Role Toggle Tabs */}
        <div className="flex border-b border-white/10 bg-white/5 p-1.5">
          <button
            onClick={() => {
              setRole("staff");
              setError(null);
            }}
            className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all ${
              role === "staff"
                ? "bg-accent text-white shadow-md"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Staff Access
          </button>
          <button
            onClick={() => {
              setRole("patient");
              setError(null);
            }}
            className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all ${
              role === "patient"
                ? "bg-accent text-white shadow-md"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Patient Portal
          </button>
        </div>

        <div className="p-6 md:p-8">
          {error && (
            <div className="mb-6 p-3.5 rounded-2xl bg-red-500/10 text-red-400 text-xs border border-red-500/20 font-medium animate-in fade-in">
              {error}
            </div>
          )}

          {role === "staff" ? (
            /* STAFF LOGIN FORM */
            <PremiumAuthForm onSuccess={() => router.push("/dashboard")} />
          ) : (
            /* PATIENT PORTAL */
            <div className="space-y-6">
              {/* Sub-tabs: Join Queue vs Track Status */}
              <div className="flex bg-background border border-white/10 p-1 rounded-xl text-xs font-bold">
                <button
                  onClick={() => setPatientAction("join")}
                  className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                    patientAction === "join"
                      ? "bg-accent/20 text-accent border border-accent/30"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Ticket className="w-3.5 h-3.5" />
                  Join Queue Now
                </button>
                <button
                  onClick={() => setPatientAction("track")}
                  className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                    patientAction === "track"
                      ? "bg-accent/20 text-accent border border-accent/30"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Search className="w-3.5 h-3.5" />
                  Track Live Ticket
                </button>
              </div>

              {/* Patient Portal quick access */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  router.push("/portal/login");
                }}
                className="w-full flex items-center justify-center gap-2 border border-white/10 bg-white/5 hover:bg-white/10 text-foreground font-bold rounded-xl px-4 py-3 text-sm transition-all"
              >
                <LayoutDashboard className="w-4 h-4 text-accent" />
                Open My Portal (appointments, visits, ratings & bills)
              </button>

              {patientAction === "join" ? (
                /* REDIRECT TO FULL PATIENT FLOW (WIZARD) */
                <div className="flex flex-col items-center justify-center py-4 text-center space-y-4 animate-in fade-in zoom-in-95">
                  <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-2">
                    <User className="w-8 h-8 text-blue-400" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground">Welcome to the Patient Portal</h3>
                  <p className="text-sm text-muted-foreground px-4">
                    Please select a department and doctor to join the queue.
                  </p>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      router.push("/patient");
                    }}
                    className="w-full mt-6 bg-accent hover:brightness-110 text-white font-bold rounded-xl px-4 py-3.5 text-sm transition-all shadow-lg shadow-accent/20 flex items-center justify-center gap-2 active:scale-95"
                  >
                    <span>Select Department & Doctor</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                /* TRACK TICKET FORM */
                <form onSubmit={handlePatientTrack} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-accent" />
                      Phone Number or Token #
                    </label>
                    <p className="text-xs text-muted-foreground mb-3">
                      Enter the phone number or token number used when joining to view live status.
                    </p>
                    <input
                      type="text"
                      required
                      value={trackPhone}
                      onChange={(e) => setTrackPhone(e.target.value)}
                      className="w-full bg-background border border-white/10 text-foreground rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent transition-all placeholder:text-muted-foreground"
                      placeholder="+1 (555) 000-0000 or #17"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full mt-6 bg-accent hover:brightness-110 text-white font-bold rounded-xl px-4 py-3.5 text-sm transition-all shadow-lg shadow-accent/20 flex items-center justify-center gap-2 active:scale-95"
                  >
                    <span>Track Live Status</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
