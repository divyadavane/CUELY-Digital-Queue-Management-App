"use client";

import React, { useState } from "react";
import { joinQueueAction } from "@/actions/queue";
import { CountryPhoneInput } from "@/components/ui/country-phone-input";
import { EMERGENCY_TYPES } from "@/components/customer/BookAppointmentForm";
import { CheckCircle2, QrCode, AlertTriangle, Stethoscope, Globe, Printer, Ticket } from "lucide-react";
import toast from "react-hot-toast";

interface SelfServiceKioskProps {
  queueId: string;
  clinicName?: string;
}

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिंदी (Hindi)" },
  { code: "mr", label: "मराठी (Marathi)" },
  { code: "gu", label: "ગુજરાતી (Gujarati)" },
];

const SYMPTOM_CHECKLIST = [
  { id: "routine", label: "General OPD / Routine Checkup", urgency: "routine" },
  { id: "fever", label: "Fever & Cold", urgency: "routine" },
  { id: "severe_pain", label: "Severe Pain / High Fever", urgency: "urgent" },
  { id: "chest_pain", label: "Chest Pain / Shortness of Breath", urgency: "critical" },
  { id: "injury", label: "Acute Injury / Bleeding", urgency: "critical" },
  { id: "followup", label: "Follow-up Visit", urgency: "follow_up" },
];

export function SelfServiceKiosk({ queueId, clinicName = "Sunrise Clinic" }: SelfServiceKioskProps) {
  const [step, setStep] = useState<"form" | "ticket">("form");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [selectedSymptom, setSelectedSymptom] = useState(SYMPTOM_CHECKLIST[0]);
  const [reasonText, setReasonText] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatedTicket, setGeneratedTicket] = useState<{
    tokenNumber: string | number;
    ticketId: string;
    patientName: string;
    urgencyLabel: string;
    joinedAt: string;
  } | null>(null);

  const handleKioskCheckin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter your name");
      return;
    }

    setLoading(true);

    // Auto-derive urgency signal from symptom choice or reason text
    let derivedUrgency = selectedSymptom.urgency;
    if (reasonText.toLowerCase().includes("chest") || reasonText.toLowerCase().includes("breath") || reasonText.toLowerCase().includes("bleed")) {
      derivedUrgency = "critical";
    } else if (reasonText.toLowerCase().includes("pain") || reasonText.toLowerCase().includes("fever")) {
      derivedUrgency = "urgent";
    }

    const { success, data, error } = await joinQueueAction(
      queueId,
      phone,
      derivedUrgency,
      name
    );

    if (!success) {
      toast.error(error || "Check-in failed. Please ask reception desk.");
      setLoading(false);
      return;
    }

    if (data && data.ticket_id) {
      setGeneratedTicket({
        tokenNumber: data.token_number,
        ticketId: data.ticket_id,
        patientName: name,
        urgencyLabel: derivedUrgency.toUpperCase(),
        joinedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      });
      setStep("ticket");
    }
    setLoading(false);
  };

  const handleReset = () => {
    setName("");
    setPhone("");
    setReasonText("");
    setSelectedSymptom(SYMPTOM_CHECKLIST[0]);
    setStep("form");
    setGeneratedTicket(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden">
      {/* Background Decorative Mesh Blobs */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-accent/20 rounded-full blur-3xl pointer-events-none" />

      {/* Top Kiosk Header Banner */}
      <div className="w-full max-w-2xl mx-auto flex items-center justify-between mb-6 z-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-accent/20 border border-accent/40 flex items-center justify-center text-accent shadow-lg shadow-accent/20">
            <Stethoscope className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black font-sans text-white tracking-tight">{clinicName}</h1>
            <p className="text-xs text-slate-400 font-medium">Self-Service OPD Check-in Kiosk</p>
          </div>
        </div>

        {/* Language Selector */}
        <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full text-xs font-bold">
          <Globe className="w-3.5 h-3.5 text-accent" />
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="bg-transparent text-white focus:outline-none cursor-pointer text-xs font-bold"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code} className="bg-slate-900 text-white">
                {l.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {step === "form" ? (
        /* FORM STEP */
        <div className="w-full max-w-2xl bg-slate-900/80 backdrop-blur-2xl border border-white/15 rounded-3xl p-6 md:p-10 shadow-2xl z-10 space-y-6">
          <div className="text-center pb-4 border-b border-white/10">
            <h2 className="text-2xl md:text-3xl font-black font-sans text-white mb-1">
              Welcome! Get Your Token
            </h2>
            <p className="text-sm text-slate-400">
              Touch the fields below to enter your information and generate your ticket.
            </p>
          </div>

          <form onSubmit={handleKioskCheckin} className="space-y-6">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-bold text-slate-200 mb-2">
                Patient Full Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ramesh Patel"
                className="w-full bg-slate-950 border border-white/15 rounded-2xl px-5 py-4 text-white text-lg placeholder:text-slate-500 focus:outline-none focus:border-accent transition-all font-semibold"
              />
            </div>

            {/* Phone Number with Country Selector */}
            <div>
              <label className="block text-sm font-bold text-slate-200 mb-2">
                Mobile Number (for Live SMS & WhatsApp Status Link)
              </label>
              <CountryPhoneInput
                value={phone}
                onChange={(fullPhone) => setPhone(fullPhone)}
                placeholder="98765 43210"
              />
            </div>

            {/* Symptom Checklist for Urgency Signal Capture */}
            <div>
              <label className="block text-sm font-bold text-slate-200 mb-2 flex items-center justify-between">
                <span>Reason for Visit / Symptoms *</span>
                <span className="text-xs text-amber-400 font-normal flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Auto-triage active
                </span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                {SYMPTOM_CHECKLIST.map((symptom) => (
                  <button
                    key={symptom.id}
                    type="button"
                    onClick={() => setSelectedSymptom(symptom)}
                    className={`p-3.5 rounded-2xl border text-left text-sm font-bold transition-all flex items-center justify-between ${
                      selectedSymptom.id === symptom.id
                        ? "bg-accent/20 border-accent text-white shadow-lg shadow-accent/20"
                        : "bg-slate-950/60 border-white/10 text-slate-300 hover:border-white/20"
                    }`}
                  >
                    <span>{symptom.label}</span>
                    {selectedSymptom.id === symptom.id && <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />}
                  </button>
                ))}
              </div>

              {/* Optional Additional Detail Input */}
              <input
                type="text"
                value={reasonText}
                onChange={(e) => setReasonText(e.target.value)}
                placeholder="Additional notes for doctor (optional)"
                className="w-full bg-slate-950 border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-accent transition-all"
              />
            </div>

            {/* Check-in Action Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-accent to-blue-600 hover:from-accent/90 hover:to-blue-500 text-white font-extrabold py-5 rounded-2xl text-xl shadow-xl shadow-accent/25 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? (
                <span className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Ticket className="w-6 h-6" />
                  Generate My Token Ticket
                </>
              )}
            </button>
          </form>
        </div>
      ) : (
        /* GENERATED TICKET STEP */
        <div className="w-full max-w-md bg-slate-900 border border-white/20 rounded-3xl p-8 shadow-2xl z-10 text-center space-y-6 animate-in zoom-in-95 duration-300">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400 block mb-1">
              Your Token Number
            </span>
            <div className="text-6xl font-black font-sans text-amber-400 tracking-tight my-2">
              #{generatedTicket?.tokenNumber}
            </div>
            <h3 className="text-xl font-extrabold text-white">{generatedTicket?.patientName}</h3>
            <p className="text-xs text-slate-400 mt-1">Checked in at {generatedTicket?.joinedAt}</p>
          </div>

          {/* QR Code Block for Mobile Live Status Tracking */}
          <div className="p-4 bg-white rounded-2xl flex flex-col items-center justify-center gap-2">
            <div className="w-32 h-32 bg-slate-900 p-2 rounded-xl flex items-center justify-center">
              <QrCode className="w-24 h-24 text-white" />
            </div>
            <span className="text-xs font-bold text-slate-900">
              Scan with phone camera to track status live
            </span>
          </div>

          <div className="pt-2 flex flex-col gap-3">
            <a
              href={`/patient/status/${generatedTicket?.ticketId}`}
              target="_blank"
              rel="noreferrer"
              className="w-full bg-accent text-white font-bold py-3.5 rounded-xl hover:brightness-110 transition-all text-sm flex items-center justify-center gap-2"
            >
              Open Live Status Page
            </a>

            <button
              type="button"
              onClick={handleReset}
              className="w-full bg-white/5 hover:bg-white/10 text-slate-300 font-bold py-3 rounded-xl transition-all text-xs flex items-center justify-center gap-2 border border-white/10"
            >
              Done &mdash; Return to Check-in Screen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
