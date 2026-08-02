"use client";

import { useState } from "react";
import { X, Save, MessageSquare, Tag, Check } from "lucide-react";
import toast from "react-hot-toast";
import { updateSmsTemplatesAction } from "@/actions/sms";

interface SmsTemplateEditorModalProps {
  queueId: string;
  initialTemplates?: Record<string, string>;
  isOpen: boolean;
  onClose: () => void;
}

const TRIGGER_LABELS: { key: string; label: string; description: string }[] = [
  {
    key: "joined",
    label: "1. Token Joined Confirmation",
    description: "Sent immediately when patient receives a new ticket token.",
  },
  {
    key: "almost_there",
    label: "2. Almost There Alert (2-3 away)",
    description: "Sent when patient is 2-3 positions away in line.",
  },
  {
    key: "called",
    label: "3. Patient Called Alert",
    description: "Sent when doctor/staff calls the ticket to desk.",
  },
  {
    key: "no_show",
    label: "4. No-Show Warning Alert",
    description: "Sent when patient is marked as missed/no-show.",
  },
  {
    key: "served",
    label: "5. Visit Complete & Thank You",
    description: "Sent when patient finishes consultation.",
  },
];

const VARIABLE_TAGS = [
  "{patient_name}",
  "{token_number}",
  "{wait_time}",
  "{clinic_name}",
  "{position}",
];

export function SmsTemplateEditorModal({
  queueId,
  initialTemplates,
  isOpen,
  onClose,
}: SmsTemplateEditorModalProps) {
  const [templates, setTemplates] = useState<Record<string, string>>({
    joined:
      initialTemplates?.joined ||
      "Hi {patient_name}! Your token #{token_number} for {clinic_name} is confirmed. Est. wait: {wait_time}m.",
    almost_there:
      initialTemplates?.almost_there ||
      "Almost your turn! Token #{token_number} is only {position} positions away at {clinic_name}.",
    called:
      initialTemplates?.called ||
      "TOKEN #{token_number}! Please proceed to Desk/Room 1 now. Your turn has arrived.",
    no_show:
      initialTemplates?.no_show ||
      "You missed your turn for Token #{token_number}. Visit the desk within 10 min to get requeued.",
    served:
      initialTemplates?.served ||
      "Thank you for visiting {clinic_name}! Token #{token_number} is completed. Have a great day!",
  });

  const [activeTrigger, setActiveTrigger] = useState<string>("joined");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleInsertTag = (tag: string) => {
    setTemplates((prev) => ({
      ...prev,
      [activeTrigger]: (prev[activeTrigger] || "") + ` ${tag}`,
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    const { success, error } = await updateSmsTemplatesAction(queueId, templates);

    if (error || !success) {
      toast.error(error || "Failed to update templates");
    } else {
      toast.success("SMS Message Templates updated successfully!");
      onClose();
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-accent/20 border border-accent/30 flex items-center justify-center text-accent">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-sans text-white">SMS Message Templates</h2>
              <p className="text-xs text-slate-400">Customize automated text triggers for patients</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Trigger Selection Tabs */}
          <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/5 overflow-x-auto gap-1">
            {TRIGGER_LABELS.map((item) => (
              <button
                key={item.key}
                onClick={() => setActiveTrigger(item.key)}
                className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  activeTrigger === item.key
                    ? "bg-accent text-white shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Active Template Editor */}
          <div className="space-y-4">
            <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
              <p className="text-xs font-bold text-accent mb-1">
                {TRIGGER_LABELS.find((t) => t.key === activeTrigger)?.label}
              </p>
              <p className="text-xs text-slate-400">
                {TRIGGER_LABELS.find((t) => t.key === activeTrigger)?.description}
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">
                SMS Wording Template
              </label>
              <textarea
                rows={4}
                value={templates[activeTrigger] || ""}
                onChange={(e) =>
                  setTemplates((prev) => ({ ...prev, [activeTrigger]: e.target.value }))
                }
                className="w-full bg-black/50 border border-white/10 rounded-2xl p-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-accent transition-all font-mono"
                placeholder="Type SMS wording template here..."
              />
            </div>

            {/* Variable Tag Helpers */}
            <div>
              <span className="text-xs font-bold text-slate-400 mb-2 block flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-amber-400" />
                Click to insert dynamic variables:
              </span>
              <div className="flex flex-wrap gap-2">
                {VARIABLE_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleInsertTag(tag)}
                    className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-accent/20 border border-white/10 text-xs font-mono font-bold text-accent hover:border-accent/40 transition-all"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-5 border-t border-white/10 bg-white/5 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl font-bold text-xs text-slate-400 hover:text-white transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-6 py-2.5 rounded-xl font-bold text-xs bg-accent hover:brightness-110 text-white shadow-lg shadow-accent/20 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Templates</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
