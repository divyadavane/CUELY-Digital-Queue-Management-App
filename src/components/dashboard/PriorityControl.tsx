import { useState } from "react";
import { ArrowUp, Star } from "lucide-react";
import { createClient } from "@/lib/supabase";
import toast from "react-hot-toast";

interface PriorityControlProps {
  ticketId: string;
  currentPriority: number;
}

export function PriorityControl({ ticketId, currentPriority }: PriorityControlProps) {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleBump = async () => {
    setLoading(true);
    const newPriority = currentPriority + 1;
    const { error } = await supabase.rpc("bump_priority", {
      p_ticket_id: ticketId,
      p_new_priority: newPriority
    });

    if (error) {
      toast.error(`Failed to bump priority: ${error.message}`);
    } else {
      toast.success("Priority bumped!");
    }
    setLoading(false);
  };

  return (
    <button
      onClick={handleBump}
      disabled={loading}
      title="Bump Priority"
      className="p-2 rounded-lg bg-surface border border-border text-muted-foreground hover:text-accent hover:border-accent hover:bg-accent/10 transition-colors premium-shadow disabled:opacity-50"
    >
      {currentPriority > 0 ? (
        <Star className="w-5 h-5 fill-accent text-accent" />
      ) : (
        <ArrowUp className="w-5 h-5" />
      )}
    </button>
  );
}
