"use client";

import { useState } from "react";
import { Megaphone, Sparkles } from "lucide-react";
import toast from "react-hot-toast";
import { callNextAction } from "@/actions/queue";

interface CallNextButtonProps {
  queueId: string | null;
  isDisabled: boolean;
}

export function CallNextButton({ queueId, isDisabled }: CallNextButtonProps) {
  const [loading, setLoading] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const handleCallNext = async () => {
    if (!queueId) return;
    setLoading(true);
    
    const { success, data, error } = await callNextAction(queueId);

    if (!success) {
      toast.error(error || "Failed to call next");
      setLoading(false);
      return;
    }

    if (data && data.ticket_id) {
      toast.success(`Called Token #${data.token_number}`, {
        icon: '📢',
        style: {
          borderRadius: '16px',
          background: '#0F172A',
          color: '#FFF',
          border: '1px solid rgba(59, 130, 246, 0.3)'
        }
      });
      
      try {
        const audio = new Audio("https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1539c.mp3?filename=success-1-6297.mp3");
        audio.volume = 0.5;
        audio.play().catch(() => {});
      } catch (e) {
        // ignore audio errors
      }
    }
    
    setLoading(false);
  };

  return (
    <button
      onClick={handleCallNext}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      disabled={isDisabled || loading}
      className={`
        relative w-full py-6 px-8 rounded-3xl font-sans font-extrabold text-2xl md:text-3xl
        flex items-center justify-center gap-4 transition-all duration-300 overflow-hidden
        ${isPressed ? "scale-[0.97]" : ""}
        ${isDisabled 
          ? "bg-slate-800/50 text-slate-500 border border-white/5 cursor-not-allowed opacity-60" 
          : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-[0_0_30px_rgba(37,99,235,0.4)] hover:shadow-[0_0_40px_rgba(37,99,235,0.6)] border border-blue-400/30"
        }
      `}
    >
      {/* Background Glow Ripple */}
      {!isDisabled && (
        <span className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity duration-300" />
      )}

      {loading ? (
        <div className="flex items-center gap-3">
          <span className="w-7 h-7 border-4 border-white border-t-transparent rounded-full animate-spin" />
          <span className="tracking-tight">Calling Patient...</span>
        </div>
      ) : (
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <Megaphone className="w-8 h-8 text-blue-200 animate-pulse" />
            <span className="tracking-tight">Call Next</span>
          </div>

          <span className="text-xs font-bold font-mono px-3 py-1.5 rounded-xl bg-black/30 border border-white/20 text-blue-100 flex items-center gap-1 shadow-inner">
            <Sparkles className="w-3 h-3 text-amber-300" /> Key: N
          </span>
        </div>
      )}
    </button>
  );
}
