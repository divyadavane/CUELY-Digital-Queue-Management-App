"use client";

import React, { useState, useEffect } from "react";
import { joinQueueAction } from "@/actions/queue";
import { CountryPhoneInput } from "@/components/ui/country-phone-input";
import { DepartmentDoctorWizard } from "@/components/patient/DepartmentDoctorWizard";
import {
  Stethoscope,
  Globe,
  QrCode,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  Sparkles,
  ShieldAlert,
  Building2,
  Ticket,
  Check,
  Heart,
  Baby,
  Activity,
  FlaskConical,
} from "lucide-react";
import toast from "react-hot-toast";
import { CuelyLogo } from "@/components/ui/CuelyLogo";

interface KioskWizardProps {
  queueId: string;
  clinicName?: string;
  queues?: { id: string; name: string }[];
}

const DEPARTMENTS = [
  { id: "opd", name: "General OPD", desc: "Routine health checkup & consultation", icon: Stethoscope, color: "from-blue-500/20 to-indigo-500/20 border-blue-500/30 text-blue-400" },
  { id: "peds", name: "Pediatrics (Child Care)", desc: "Infant & child health specialist", icon: Baby, color: "from-pink-500/20 to-rose-500/20 border-pink-500/30 text-pink-400" },
  { id: "dental", name: "Dental Care", desc: "Teeth checkup, pain & procedures", icon: Heart, color: "from-cyan-500/20 to-teal-500/20 border-cyan-500/30 text-cyan-400" },
  { id: "cardio", name: "Cardiology & ECG", desc: "Heart checkup & blood pressure", icon: Activity, color: "from-red-500/20 to-rose-500/20 border-red-500/30 text-red-400" },
  { id: "lab", name: "Lab & Diagnostics", desc: "Blood test, X-Ray & pathology", icon: FlaskConical, color: "from-purple-500/20 to-violet-500/20 border-purple-500/30 text-purple-400" },
];

const SYMPTOM_CHIPS = [
  { id: "fever", label: "Fever & Cold", urgency: "routine" },
  { id: "injury", label: "Acute Injury / Bleeding", urgency: "critical" },
  { id: "chest", label: "Chest Pain / Shortness of Breath", urgency: "critical" },
  { id: "severe_pain", label: "Severe Pain", urgency: "urgent" },
  { id: "followup", label: "Follow-up Visit", urgency: "follow_up" },
  { id: "routine", label: "Routine Checkup", urgency: "routine" },
];

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिंदी (Hindi)" },
  { code: "mr", label: "मराठी (Marathi)" },
  { code: "gu", label: "ગુજરાતી (Gujarati)" },
];

export function KioskWizard({ queueId, clinicName = "Sunrise Clinic", queues = [] }: KioskWizardProps) {
  const [step, setStep] = useState<"landing" | 1 | 2 | 3 | 4 | "confirmation">("landing");
  const [selectedDept, setSelectedDept] = useState(DEPARTMENTS[0]);
  const [targetQueueId, setTargetQueueId] = useState(queueId);

  // Form State
  const [patientName, setPatientName] = useState("");
  const [phone, setPhone] = useState("");
  const [reasonText, setReasonText] = useState("");
  const [selectedChip, setSelectedChip] = useState(SYMPTOM_CHIPS[5]);

  // Triage Checklist State
  const [isEmergency, setIsEmergency] = useState(false);
  const [isSeverePain, setIsSeverePain] = useState(false);
  const [isFollowUp, setIsFollowUp] = useState(false);

  // Preferences
  const [smsConsent, setSmsConsent] = useState(true);
  const [selectedLang, setSelectedLang] = useState("en");

  // Output Token State
  const [loading, setLoading] = useState(false);
  const [tokenTicket, setTokenTicket] = useState<{
    tokenNumber: string | number;
    ticketId: string;
    patientName: string;
    departmentName: string;
    joinedAt: string;
  } | null>(null);

  // Auto-reset Countdown Timer for Kiosk
  const [countdown, setCountdown] = useState(15);

  useEffect(() => {
    let interval: any = null;
    if (step === "confirmation") {
      setCountdown(15);
      interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            resetKiosk();
            return 15;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step]);

  const resetKiosk = () => {
    setStep("landing");
    setPatientName("");
    setPhone("");
    setReasonText("");
    setSelectedDept(DEPARTMENTS[0]);
    setSelectedChip(SYMPTOM_CHIPS[5]);
    setIsEmergency(false);
    setIsSeverePain(false);
    setIsFollowUp(false);
    setTokenTicket(null);
  };

  const handleFinishCheckin = async () => {
    if (!patientName.trim()) {
      toast.error("Please enter patient name");
      return;
    }

    setLoading(true);

    // Compute urgency signal from triage checklist & chips
    let urgencyLevel = selectedChip.urgency;
    if (isEmergency || reasonText.toLowerCase().includes("chest") || reasonText.toLowerCase().includes("breath")) {
      urgencyLevel = "critical";
    } else if (isSeverePain || reasonText.toLowerCase().includes("pain")) {
      urgencyLevel = "urgent";
    } else if (isFollowUp) {
      urgencyLevel = "follow_up";
    }

    const activeQueue = targetQueueId || queueId;

    const { success, data, error } = await joinQueueAction(
      activeQueue,
      phone,
      urgencyLevel,
      patientName
    );

    if (!success) {
      toast.error(error || "Check-in failed. Please ask reception desk.");
      setLoading(false);
      return;
    }

    if (data && data.ticket_id) {
      setTokenTicket({
        tokenNumber: data.token_number,
        ticketId: data.ticket_id,
        patientName,
        departmentName: selectedDept.name,
        joinedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      });
      setStep("confirmation");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden select-none font-sans">
      {/* Decorative Blur Background Elements */}
      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-blue-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-accent/15 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Header Bar */}
      <header className="w-full max-w-4xl mx-auto flex items-center justify-between py-4 mb-4 z-10">
        <div className="flex items-center gap-3">
          <CuelyLogo size="md" showGlow />
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">{clinicName}</h1>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
              Self-Service OPD Touchscreen Kiosk
            </p>
          </div>
        </div>

        {/* Language Selector */}
        <div className="flex items-center gap-2 bg-slate-900 border border-white/15 px-4 py-2 rounded-full text-xs font-bold shadow-lg">
          <Globe className="w-4 h-4 text-accent" />
          <select
            value={selectedLang}
            onChange={(e) => setSelectedLang(e.target.value)}
            className="bg-transparent text-white focus:outline-none cursor-pointer font-bold"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code} className="bg-slate-900 text-white">
                {l.label}
              </option>
            ))}
          </select>
        </div>
      </header>

      {/* LANDING SCREEN */}
      {step === "landing" && (
        <main className="w-full max-w-4xl bg-slate-900/80 backdrop-blur-2xl border border-white/15 rounded-3xl p-8 md:p-14 text-center shadow-2xl z-10 space-y-8 animate-in zoom-in-95 duration-300">
          <div className="space-y-3">
            <span className="text-xs font-black uppercase tracking-widest text-accent bg-accent/10 px-4 py-1.5 rounded-full border border-accent/20">
              ⚡ Fast OPD Check-In &mdash; No Waiting at Reception
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight pt-2">
              Welcome to {clinicName}
            </h2>
            <p className="text-slate-400 text-base max-w-lg mx-auto">
              Tap the button below on this screen, or scan the QR code with your mobile phone to check in.
            </p>
          </div>

          {/* Big Touch-Friendly Button */}
          <div className="py-4">
            <button
              onClick={() => setStep(1)}
              className="w-full max-w-lg min-h-[72px] bg-gradient-to-r from-accent via-blue-600 to-indigo-600 hover:from-accent hover:to-blue-500 text-white text-2xl font-black rounded-3xl shadow-2xl shadow-accent/30 transition-all transform active:scale-95 flex items-center justify-center gap-4 mx-auto border border-white/20"
            >
              <span>Tap Here to Check In</span>
              <ChevronRight className="w-8 h-8" />
            </button>
          </div>

          {/* QR Code Scan Mobile Banner */}
          <div className="p-6 bg-slate-950/80 border border-white/10 rounded-2xl max-w-lg mx-auto flex items-center gap-6 text-left">
            <div className="w-24 h-24 bg-white p-2 rounded-xl flex items-center justify-center shrink-0">
              <QrCode className="w-20 h-20 text-slate-950" />
            </div>
            <div>
              <h4 className="font-extrabold text-white text-sm">Scan with Phone Camera</h4>
              <p className="text-xs text-slate-400 mt-1">
                Scan this QR code to generate a token directly on your phone without touching the screen.
              </p>
            </div>
          </div>
        </main>
      )}

      {/* WIZARD STEPS (1 to 4) */}
      {typeof step === "number" && (
        <main className="w-full max-w-4xl bg-slate-900/80 backdrop-blur-2xl border border-white/15 rounded-3xl p-6 md:p-10 shadow-2xl z-10 space-y-6">
          {/* Progress Indicator Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                Step {step} of 4:
              </span>
              <span className="text-sm font-bold text-accent">
                {step === 1 && "Select Department & Doctor"}
                {step === 2 && "Patient Information"}
                {step === 3 && "Urgency Checklist"}
                {step === 4 && "Consent & Confirmation"}
              </span>
            </div>

            {/* Progress Step Circles */}
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full transition-all ${
                    step === i
                      ? "bg-accent ring-4 ring-accent/30 scale-110"
                      : step > i
                      ? "bg-emerald-500"
                      : "bg-white/10"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* STEP 1: SELECT DEPARTMENT & DOCTOR */}
          {step === 1 && (
            <div className="animate-in fade-in duration-300">
              <DepartmentDoctorWizard 
                isKiosk 
                onComplete={(q) => {
                  setTargetQueueId(q.id);
                  setSelectedDept({
                    id: q.department || "opd",
                    name: q.department || "General OPD",
                    desc: q.doctor_name || q.name,
                    icon: Stethoscope,
                    color: "from-blue-500/20 to-indigo-500/20 border-blue-500/30 text-blue-400"
                  });
                  setStep(2);
                }} 
              />
            </div>
          )}

          {/* STEP 2: ENTER DETAILS */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <h3 className="text-2xl font-extrabold text-white">Enter Patient Details</h3>

              {/* Patient Name */}
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">
                  Patient Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="e.g. Anish Sharma"
                  className="w-full bg-slate-950 border border-white/15 rounded-2xl px-5 py-4 text-xl text-white font-bold placeholder:text-slate-600 focus:outline-none focus:border-accent transition-all"
                />
              </div>

              {/* Mobile Phone */}
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">
                  Mobile Phone Number (for Live SMS & WhatsApp Status)
                </label>
                <CountryPhoneInput
                  value={phone}
                  onChange={(fullPhone) => setPhone(fullPhone)}
                  placeholder="98765 43210"
                />
              </div>

              {/* Reason for Visit Symptom Chips */}
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">
                  Reason for Visit / Symptom Tag
                </label>
                <div className="flex flex-wrap gap-2.5 mb-3">
                  {SYMPTOM_CHIPS.map((chip) => (
                    <button
                      key={chip.id}
                      type="button"
                      onClick={() => setSelectedChip(chip)}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                        selectedChip.id === chip.id
                          ? "bg-accent text-white border-accent shadow-md"
                          : "bg-slate-950 border-white/10 text-slate-300 hover:border-white/20"
                      }`}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>

                <input
                  type="text"
                  value={reasonText}
                  onChange={(e) => setReasonText(e.target.value)}
                  placeholder="Optional additional notes for doctor"
                  className="w-full bg-slate-950 border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-accent transition-all"
                />
              </div>
            </div>
          )}

          {/* STEP 3: CLINICAL TRIAGE CHECKLIST */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div>
                <h3 className="text-2xl font-extrabold text-white flex items-center gap-2">
                  <ShieldAlert className="w-6 h-6 text-amber-400" />
                  Quick Urgency Checklist
                </h3>
                <p className="text-xs text-slate-400">Answer 3 simple questions to prioritize your queue placement</p>
              </div>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setIsEmergency((prev) => !prev)}
                  className={`w-full p-4 rounded-2xl border text-left transition-all flex items-center justify-between ${
                    isEmergency
                      ? "bg-red-500/20 border-red-500 text-white shadow-lg shadow-red-500/20"
                      : "bg-slate-950/60 border-white/10 text-slate-300"
                  }`}
                >
                  <span className="font-bold text-sm">1. Is this a medical emergency?</span>
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${isEmergency ? "bg-red-500 text-white" : "border border-white/20"}`}>
                    {isEmergency && <Check className="w-4 h-4" />}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setIsSeverePain((prev) => !prev)}
                  className={`w-full p-4 rounded-2xl border text-left transition-all flex items-center justify-between ${
                    isSeverePain
                      ? "bg-amber-500/20 border-amber-500 text-white shadow-lg shadow-amber-500/20"
                      : "bg-slate-950/60 border-white/10 text-slate-300"
                  }`}
                >
                  <span className="font-bold text-sm">2. Are you experiencing severe pain or discomfort?</span>
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${isSeverePain ? "bg-amber-500 text-white" : "border border-white/20"}`}>
                    {isSeverePain && <Check className="w-4 h-4" />}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setIsFollowUp((prev) => !prev)}
                  className={`w-full p-4 rounded-2xl border text-left transition-all flex items-center justify-between ${
                    isFollowUp
                      ? "bg-blue-500/20 border-blue-500 text-white shadow-lg shadow-blue-500/20"
                      : "bg-slate-950/60 border-white/10 text-slate-300"
                  }`}
                >
                  <span className="font-bold text-sm">3. Is this a follow-up visit for an existing prescription?</span>
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${isFollowUp ? "bg-blue-500 text-white" : "border border-white/20"}`}>
                    {isFollowUp && <Check className="w-4 h-4" />}
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: CONSENT & CONFIRMATION */}
          {step === 4 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <h3 className="text-2xl font-extrabold text-white">SMS Consent & Final Confirmation</h3>

              <div className="p-5 bg-slate-950 border border-white/10 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-semibold">Selected Department:</span>
                  <span className="text-sm font-extrabold text-accent">{selectedDept.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-semibold">Patient Name:</span>
                  <span className="text-sm font-bold text-white">{patientName || "Patient"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-semibold">Contact Phone:</span>
                  <span className="text-sm font-mono text-purple-300">{phone || "Walk-in"}</span>
                </div>
              </div>

              {/* Consent Toggle */}
              <label className="flex items-center gap-3 p-4 bg-slate-950/60 border border-white/10 rounded-2xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={smsConsent}
                  onChange={(e) => setSmsConsent(e.target.checked)}
                  className="w-5 h-5 accent-accent rounded cursor-pointer"
                />
                <span className="text-xs font-medium text-slate-300">
                  I agree to receive live SMS & WhatsApp queue position text updates on my phone.
                </span>
              </label>
            </div>
          )}

          {/* Navigation Controls (Back & Next) */}
          <div className="flex items-center justify-between pt-6 border-t border-white/10">
            <button
              type="button"
              onClick={() => {
                if (step === 2) setStep(1);
                else if (step === 3) setStep(2);
                else if (step === 4) setStep(3);
                else setStep("landing");
              }}
              className="px-6 py-3.5 rounded-2xl text-sm font-bold text-slate-300 bg-white/5 hover:bg-white/10 transition-all flex items-center gap-2 border border-white/10"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>

            {step < 4 ? (
              <button
                type="button"
                onClick={() => {
                  if (step === 1) setStep(2);
                  else if (step === 2) {
                    if (!patientName.trim()) {
                      toast.error("Please enter patient name");
                      return;
                    }
                    setStep(3);
                  } else if (step === 3) setStep(4);
                }}
                className="px-8 py-3.5 rounded-2xl text-sm font-extrabold bg-accent hover:bg-accent/90 text-white shadow-xl shadow-accent/25 transition-all flex items-center gap-2"
              >
                Next Step
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={loading}
                onClick={handleFinishCheckin}
                className="px-8 py-4 rounded-2xl text-base font-black bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white shadow-xl shadow-emerald-500/30 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <span className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Ticket className="w-5 h-5" />
                    Generate Token
                  </>
                )}
              </button>
            )}
          </div>
        </main>
      )}

      {/* CONFIRMATION SCREEN */}
      {step === "confirmation" && (
        <main className="w-full max-w-md bg-slate-900 border border-white/20 rounded-3xl p-8 text-center shadow-2xl z-10 space-y-6 animate-in zoom-in-95 duration-300">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400 block mb-1">
              Your Token Number
            </span>
            <div className="text-6xl font-black font-sans text-amber-400 tracking-tight my-2">
              #{tokenTicket?.tokenNumber}
            </div>
            <h3 className="text-xl font-extrabold text-white">{tokenTicket?.patientName}</h3>
            <p className="text-xs text-slate-400 mt-1">{tokenTicket?.departmentName}</p>
          </div>

          {/* Live Mobile Status QR Code */}
          <div className="p-4 bg-white rounded-2xl flex flex-col items-center justify-center gap-2">
            <div className="w-28 h-28 bg-slate-900 p-2 rounded-xl flex items-center justify-center">
              <QrCode className="w-20 h-20 text-white" />
            </div>
            <span className="text-xs font-bold text-slate-900">
              Scan with phone camera for live position
            </span>
          </div>

          {/* Auto-reset countdown message */}
          <div className="text-xs text-slate-400 flex items-center justify-center gap-1.5 pt-2">
            <RotateCcw className="w-3.5 h-3.5 text-accent animate-spin" />
            <span>Screen resets for next patient in <strong>{countdown}s</strong></span>
          </div>

          <button
            type="button"
            onClick={resetKiosk}
            className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-3.5 rounded-2xl transition-all text-xs border border-white/15"
          >
            Check In Another Patient
          </button>
        </main>
      )}
    </div>
  );
}
