"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Stethoscope, Pill, Plus, Trash2, Check, Loader2, ClipboardList } from "lucide-react";
import toast from "react-hot-toast";

interface MedicineRow {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

interface DoctorPanelProps {
  consultationId: string;
  initialNotes?: {
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
  } | null;
  initialPrescription?: {
    diagnosis: string | null;
    medicine_items: unknown[];
    lab_tests: unknown[];
    follow_up_date: string | null;
    notes: string | null;
  } | null;
}

export function DoctorPanel({ consultationId, initialNotes, initialPrescription }: DoctorPanelProps) {
  const { t } = useTranslation();
  const [notes, setNotes] = useState({
    subjective: initialNotes?.subjective || "",
    objective: initialNotes?.objective || "",
    assessment: initialNotes?.assessment || "",
    plan: initialNotes?.plan || "",
  });
  const [diagnosis, setDiagnosis] = useState(initialPrescription?.diagnosis || "");
  const [medicines, setMedicines] = useState<MedicineRow[]>(() => {
    if (!initialPrescription?.medicine_items?.length) return [{ name: "", dosage: "", frequency: "", duration: "", instructions: "" }];
    return (initialPrescription.medicine_items as any[]).map((m: any) => ({
      name: m.name || "",
      dosage: m.dosage || "",
      frequency: m.frequency || "",
      duration: m.duration || "",
      instructions: m.instructions || "",
    }));
  });
  const [labTests, setLabTests] = useState<string[]>(() =>
    (initialPrescription?.lab_tests as string[]) || []
  );
  const [labTestInput, setLabTestInput] = useState("");
  const [followUpDate, setFollowUpDate] = useState(initialPrescription?.follow_up_date || "");
  const [prescriptionNotes, setPrescriptionNotes] = useState(initialPrescription?.notes || "");
  const [savingNotes, setSavingNotes] = useState(false);
  const [savingRx, setSavingRx] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const notesTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hydratedRef = useRef(false);

  // Hydrate existing SOAP notes + prescription when the panel opens.
  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;
    (async () => {
      try {
        const [notesRes, rxRes] = await Promise.all([
          fetch(`/api/dashboard/consultations/${consultationId}/notes`),
          fetch(`/api/dashboard/consultations/${consultationId}/prescription`),
        ]);
        const notesBody = await notesRes.json().catch(() => ({}));
        const rxBody = await rxRes.json().catch(() => ({}));
        const n = notesBody?.notes;
        const p = rxBody?.prescription;
        if (n) {
          setNotes((prev) => ({
            subjective: n.subjective || prev.subjective,
            objective: n.objective || prev.objective,
            assessment: n.assessment || prev.assessment,
            plan: n.plan || prev.plan,
          }));
        }
        if (p) {
          if (p.diagnosis) setDiagnosis(p.diagnosis);
          if (Array.isArray(p.medicine_items) && p.medicine_items.length > 0) {
            setMedicines(p.medicine_items.map((m: any) => ({
              name: m.name || "",
              dosage: m.dosage || "",
              frequency: m.frequency || "",
              duration: m.duration || "",
              instructions: m.instructions || "",
            })));
          }
          if (Array.isArray(p.lab_tests)) setLabTests(p.lab_tests);
          if (p.follow_up_date) setFollowUpDate(p.follow_up_date);
          if (p.notes) setPrescriptionNotes(p.notes);
        }
      } catch {
        /* panel stays empty on failure */
      }
    })();
  }, [consultationId]);

  // Autosave SOAP notes a few seconds after the doctor stops typing.
  useEffect(() => {
    if (notesTimerRef.current) clearTimeout(notesTimerRef.current);
    notesTimerRef.current = setTimeout(async () => {
      setSavingNotes(true);
      try {
        const res = await fetch(`/api/dashboard/consultations/${consultationId}/notes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(notes),
        });
        if (res.ok) setLastSaved(new Date());
      } catch {
        /* offline — will retry on next keystroke */
      } finally {
        setSavingNotes(false);
      }
    }, 2500);
    return () => {
      if (notesTimerRef.current) clearTimeout(notesTimerRef.current);
    };
  }, [notes, consultationId]);

  const savePrescription = async () => {
    setSavingRx(true);
    try {
      const res = await fetch(`/api/dashboard/consultations/${consultationId}/prescription`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          diagnosis: diagnosis || null,
          medicineItems: medicines.filter((m) => m.name.trim()),
          labTests: labTests.filter((t) => t.trim()),
          followUpDate: followUpDate || null,
          notes: prescriptionNotes || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to save prescription");
      } else {
        toast.success(t("video.rxSaved"));
      }
    } catch {
      toast.error(t("video.rxSaveFailed"));
    } finally {
      setSavingRx(false);
    }
  };

  const updateMedicine = (index: number, field: keyof MedicineRow, value: string) => {
    setMedicines((prev) => prev.map((m, i) => (i === index ? { ...m, [field]: value } : m)));
  };

  const addMedicine = () => {
    setMedicines((prev) => [...prev, { name: "", dosage: "", frequency: "", duration: "", instructions: "" }]);
  };

  const removeMedicine = (index: number) => {
    setMedicines((prev) => prev.filter((_, i) => i !== index));
  };

  const field = (label: string, key: keyof typeof notes) => (
    <div>
      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</label>
      <textarea
        value={notes[key]}
        onChange={(e) => setNotes((prev) => ({ ...prev, [key]: e.target.value }))}
        rows={2}
        className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-all resize-y"
        placeholder={label}
      />
    </div>
  );

  return (
    <div className="h-full overflow-y-auto p-4 space-y-5">
      {/* SOAP Notes */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <ClipboardList className="w-4 h-4 text-blue-400" />
            {t("video.soapNotes")}
          </div>
          <div className="flex items-center gap-1.5">
            {savingNotes ? (
              <Loader2 className="w-3.5 h-3.5 text-slate-400 animate-spin" />
            ) : (
              lastSaved && <span className="text-[9px] text-slate-500 font-medium">{t("video.savedAt", { time: lastSaved.toLocaleTimeString() })}</span>
            )}
          </div>
        </div>
        <div className="space-y-3">
          {field(t("video.subjective"), "subjective")}
          {field(t("video.objective"), "objective")}
          {field(t("video.assessment"), "assessment")}
          {field(t("video.plan"), "plan")}
        </div>
      </div>

      {/* Prescription */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
        <div className="flex items-center gap-2 text-sm font-bold text-white mb-3">
          <Pill className="w-4 h-4 text-emerald-400" />
          {t("video.prescription")}
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{t("video.diagnosis")}</label>
            <input
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-all"
              placeholder={t("video.diagnosisPh")}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t("video.medicines")}</label>
              <button onClick={addMedicine} className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 hover:text-emerald-300">
                <Plus className="w-3 h-3" /> {t("video.addMedicine")}
              </button>
            </div>
            <div className="space-y-2">
              {medicines.map((med, i) => (
                <div key={i} className="bg-black/40 border border-white/10 rounded-xl p-2.5 space-y-1.5 relative">
                  <div className="grid grid-cols-3 gap-1.5">
                    <input
                      value={med.name}
                      onChange={(e) => updateMedicine(i, "name", e.target.value)}
                      className="col-span-3 bg-transparent border-b border-white/10 px-1 py-1 text-xs font-bold text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                      placeholder={t("video.medName")}
                    />
                    <input
                      value={med.dosage}
                      onChange={(e) => updateMedicine(i, "dosage", e.target.value)}
                      className="bg-transparent border-b border-white/10 px-1 py-1 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                      placeholder={t("video.dosage")}
                    />
                    <input
                      value={med.frequency}
                      onChange={(e) => updateMedicine(i, "frequency", e.target.value)}
                      className="bg-transparent border-b border-white/10 px-1 py-1 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                      placeholder={t("video.frequency")}
                    />
                    <input
                      value={med.duration}
                      onChange={(e) => updateMedicine(i, "duration", e.target.value)}
                      className="bg-transparent border-b border-white/10 px-1 py-1 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                      placeholder={t("video.duration")}
                    />
                  </div>
                  <input
                    value={med.instructions}
                    onChange={(e) => updateMedicine(i, "instructions", e.target.value)}
                    className="w-full bg-transparent px-1 py-0.5 text-[11px] text-slate-300 placeholder-slate-600 focus:outline-none"
                    placeholder={t("video.medInstructions")}
                  />
                  <button
                    onClick={() => removeMedicine(i)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500/20 border border-red-500/30 text-red-400 flex items-center justify-center hover:bg-red-500/30"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{t("video.labTests")}</label>
            <div className="flex gap-2">
              <input
                value={labTestInput}
                onChange={(e) => setLabTestInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && labTestInput.trim()) {
                    setLabTests((prev) => [...prev, labTestInput.trim()]);
                    setLabTestInput("");
                  }
                }}
                className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                placeholder={t("video.labTestPh")}
              />
              <button
                onClick={() => {
                  if (labTestInput.trim()) {
                    setLabTests((prev) => [...prev, labTestInput.trim()]);
                    setLabTestInput("");
                  }
                }}
                className="px-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {labTests.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {labTests.map((test, i) => (
                  <span key={i} className="flex items-center gap-1 text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 px-2 py-1 rounded-full">
                    {test}
                    <button onClick={() => setLabTests((prev) => prev.filter((_, j) => j !== i))} className="text-emerald-500 hover:text-red-400">
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{t("video.followUp")}</label>
            <input
              type="date"
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 [color-scheme:dark]"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{t("video.rxNotes")}</label>
            <textarea
              value={prescriptionNotes}
              onChange={(e) => setPrescriptionNotes(e.target.value)}
              rows={2}
              className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-all"
              placeholder={t("video.rxNotesPh")}
            />
          </div>

          <button
            onClick={savePrescription}
            disabled={savingRx}
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {savingRx ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            {t("video.savePrescription")}
          </button>
        </div>
      </div>
    </div>
  );
}
