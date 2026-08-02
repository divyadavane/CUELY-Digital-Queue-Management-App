import { useState } from "react";
import toast from "react-hot-toast";
import { checkInAppointmentAction, cancelAppointmentAction } from "@/actions/queue";
import { Calendar, CheckCircle2, XCircle } from "lucide-react";

interface CheckInPromptProps {
  appointmentId: string;
  appointmentDate: string;
  onCheckedIn: (ticketId: string) => void;
  onCancelled: () => void;
}

export function CheckInPrompt({
  appointmentId,
  appointmentDate,
  onCheckedIn,
  onCancelled,
}: CheckInPromptProps) {
  const [loading, setLoading] = useState(false);
  const today = new Date().toISOString().split("T")[0];
  const isToday = appointmentDate <= today; // Allowed to check in on or after scheduled date

  const handleCheckIn = async () => {
    setLoading(true);
    const { success, data, error } = await checkInAppointmentAction(appointmentId);

    if (!success) {
      toast.error(error || "Failed to check in");
      setLoading(false);
      return;
    }

    if (data && data.ticket_id) {
      toast.success("Checked in! You are now in the live queue.");
      onCheckedIn(data.ticket_id);
    } else {
      toast.error("Could not retrieve queue ticket.");
    }
    setLoading(false);
  };

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel this appointment?")) return;
    setLoading(true);
    const { success, error } = await cancelAppointmentAction(appointmentId);

    if (!success) {
      toast.error(error || "Failed to cancel appointment");
      setLoading(false);
      return;
    }

    toast.success("Appointment cancelled.");
    onCancelled();
    setLoading(false);
  };

  return (
    <div className="w-full max-w-md mx-auto bg-surface border border-border rounded-3xl p-8 md:p-12 text-center premium-shadow">
      <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
        <Calendar className="w-8 h-8 text-accent" />
      </div>

      <h2 className="text-3xl font-bold font-sans text-foreground mb-2 tracking-tight">
        Existing Appointment
      </h2>
      <p className="text-muted-foreground text-base mb-6">
        You have an appointment booked for <strong className="text-foreground">{appointmentDate}</strong>.
      </p>

      {isToday ? (
        <div className="space-y-4">
          <div className="bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 p-4 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            Check-in is open for today!
          </div>

          <button
            onClick={handleCheckIn}
            disabled={loading}
            className="w-full bg-accent text-white font-bold py-4 rounded-xl hover:brightness-110 active:scale-[0.98] transition-all text-lg flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {loading && <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            Check In Now
          </button>
        </div>
      ) : (
        <div className="bg-muted p-4 rounded-2xl text-sm text-muted-foreground mb-6">
          Check-in will be available when you arrive on <strong className="text-foreground">{appointmentDate}</strong>.
        </div>
      )}

      <button
        onClick={handleCancel}
        disabled={loading}
        className="mt-6 text-sm font-semibold text-destructive hover:underline inline-flex items-center gap-1.5"
      >
        <XCircle className="w-4 h-4" />
        Cancel Appointment
      </button>
    </div>
  );
}
