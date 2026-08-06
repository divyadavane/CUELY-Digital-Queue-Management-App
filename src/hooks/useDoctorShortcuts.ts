import { useEffect } from "react";
import toast from "react-hot-toast";

interface UseDoctorShortcutsProps {
  queueId: string;
  calledTicketId: string | null;
  onComplete?: (ticketId: string) => void;
  onStart?: (ticketId: string) => void;
  onAssist?: () => void;
}

/**
 * Doctor-side keyboard shortcuts:
 *   C  — Complete current consult
 *   T  — Start/restart consult timer
 *   A  — Request front-desk assistance
 * Ignores keystrokes while typing in form fields.
 */
export function useDoctorShortcuts({ queueId, calledTicketId, onComplete, onStart, onAssist }: UseDoctorShortcutsProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        (target as HTMLElement)?.isContentEditable
      ) {
        return;
      }
      const key = e.key.toLowerCase();
      if (key === "c" && calledTicketId && onComplete) {
        e.preventDefault();
        onComplete(calledTicketId);
      } else if (key === "t" && calledTicketId && onStart) {
        e.preventDefault();
        onStart(calledTicketId);
      } else if (key === "a" && onAssist) {
        e.preventDefault();
        onAssist();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [queueId, calledTicketId, onComplete, onStart, onAssist]);
}
