import { useState, useCallback, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import toast from "react-hot-toast";

export function useUndoableAction() {
  const supabase = createClient();
  const timeouts = useRef<Record<string, NodeJS.Timeout>>({});
  
  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(timeouts.current).forEach(clearTimeout);
    };
  }, []);

  const executeActionWithUndo = useCallback(
    async (
      ticketId: string,
      actionFn: () => Promise<{ error: any }>,
      successMessage: string,
      revertToStatus: string = "called"
    ) => {
      // 1. Execute immediately for responsive UI
      const { error } = await actionFn();
      
      if (error) {
        toast.error(`Action failed: ${error.message}`);
        return;
      }

      // 2. Show toast with Undo button
      toast(
        (t) => (
          <div className="flex items-center gap-4">
            <span>{successMessage}</span>
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                // Execute undo
                const { error: undoError } = await supabase.rpc("undo_ticket_action", {
                  p_ticket_id: ticketId,
                  p_revert_to_status: revertToStatus
                });
                if (undoError) {
                  toast.error(`Undo failed: ${undoError.message}`);
                } else {
                  toast.success("Action undone.");
                }
              }}
              className="px-3 py-1 bg-surface border border-border rounded-lg text-sm font-bold text-foreground hover:bg-accent hover:text-white hover:border-accent transition-colors"
            >
              Undo
            </button>
          </div>
        ),
        { duration: 5000 }
      );
    },
    [supabase]
  );

  return { executeActionWithUndo };
}
