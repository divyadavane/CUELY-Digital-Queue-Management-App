import { useEffect } from "react";
import { createClient } from "@/lib/supabase";
import toast from "react-hot-toast";

interface UseKeyboardShortcutsProps {
  queueId: string | null;
  calledTicketId: string | null;
  isCallNextDisabled: boolean;
}

export function useKeyboardShortcuts({ queueId, calledTicketId, isCallNextDisabled }: UseKeyboardShortcutsProps) {
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      // Ignore if user is typing in an input or textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      const key = e.key.toLowerCase();
      const supabase = createClient();

      if (key === "n" && queueId && !isCallNextDisabled) {
        e.preventDefault();
        const { error } = await supabase.rpc("call_next", { p_queue_id: queueId });
        if (error) toast.error(error.message);
        else toast.success("Called next ticket");
      } 
      else if (key === "s" && calledTicketId) {
        e.preventDefault();
        const { error } = await supabase.rpc("mark_served", { p_ticket_id: calledTicketId });
        if (error) toast.error(error.message);
        else toast.success("Marked as served");
      } 
      else if (key === "x" && calledTicketId) {
        e.preventDefault();
        const { error } = await supabase.rpc("mark_no_show", { p_ticket_id: calledTicketId });
        if (error) toast.error(error.message);
        else toast.success("Marked as no show");
      } 
      else if (key === "r" && calledTicketId) {
        e.preventDefault();
        const { error } = await supabase.rpc("recall_ticket", { p_ticket_id: calledTicketId });
        if (error) toast.error(error.message);
        else toast.success("Ticket recalled");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [queueId, calledTicketId, isCallNextDisabled]);
}
