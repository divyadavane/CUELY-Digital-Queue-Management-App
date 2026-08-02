import { useState } from "react";
import { createClient } from "@/lib/supabase";
import toast from "react-hot-toast";

interface PauseToggleProps {
  queueId: string;
  isPaused: boolean;
}

export function PauseToggle({ queueId, isPaused }: PauseToggleProps) {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleToggle = async () => {
    setLoading(true);
    const { error } = await supabase.rpc("toggle_queue_pause", {
      p_queue_id: queueId,
      p_is_paused: !isPaused
    });

    if (error) {
      toast.error(`Failed to ${!isPaused ? 'pause' : 'resume'} queue: ${error.message}`);
    } else {
      toast.success(
        !isPaused 
          ? "Queue paused. Not accepting new patients." 
          : "Queue resumed. Accepting patients."
      );
    }
    setLoading(false);
  };

  return (
    <div className="bg-surface border border-border rounded-3xl p-6 premium-shadow">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-foreground font-sans mb-1">Queue Status</h3>
          <p className="text-sm text-muted-foreground">
            {isPaused ? "Currently paused" : "Accepting patients"}
          </p>
        </div>
        
        <button
          onClick={handleToggle}
          disabled={loading}
          className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
            isPaused ? 'bg-orange-500' : 'bg-muted'
          } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
              isPaused ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
    </div>
  );
}
