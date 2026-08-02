import { useState } from "react";
import toast from "react-hot-toast";
import { bookAppointmentAction } from "@/actions/queue";
import { Calendar, Clock, AlertTriangle } from "lucide-react";
import { CountryPhoneInput } from "@/components/ui/country-phone-input";

interface BookAppointmentFormProps {
  queueId: string;
  onBooked: (appointmentId: string, appointmentDate: string) => void;
}

export const EMERGENCY_TYPES = [
  { value: "routine", label: "Routine Visit (General checkup)" },
  { value: "urgent", label: "Urgent (Needs prompt care)" },
  { value: "critical", label: "Severe / Emergency (Immediate attention)" },
  { value: "follow_up", label: "Follow-up Visit" },
  { value: "other", label: "Other" },
];

export function BookAppointmentForm({ queueId, onBooked }: BookAppointmentFormProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [emergencyType, setEmergencyType] = useState("routine");
  const [date, setDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [time, setTime] = useState("10:00");
  const [loading, setLoading] = useState(false);

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) {
      toast.error("Name and phone number are required for booking an appointment.");
      return;
    }

    setLoading(true);
    const { success, data, error } = await bookAppointmentAction(
      queueId,
      phone,
      emergencyType,
      date,
      time,
      name
    );

    if (!success) {
      toast.error(error || "Failed to book appointment");
      setLoading(false);
      return;
    }

    if (data && data.appointment_id) {
      toast.success("Appointment booked successfully!");
      onBooked(data.appointment_id, date);
    }
    setLoading(false);
  };

  return (
    <div className="w-full max-w-md mx-auto bg-surface border border-border rounded-3xl p-8 md:p-12 premium-shadow">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold font-sans text-foreground mb-3 tracking-tight">Book for Later</h2>
        <p className="text-muted-foreground text-sm">
          Schedule an appointment for a future date. You will check in when you arrive.
        </p>
      </div>

      <form onSubmit={handleBook} className="space-y-6">
        <div>
          <label className="block text-sm font-bold text-foreground mb-2">
            Full Name *
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jane Doe"
            className="w-full bg-background border border-border rounded-xl px-4 py-3.5 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent transition-all text-base"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-foreground mb-2">
            Phone Number *
          </label>
          <CountryPhoneInput
            required
            value={phone}
            onChange={(fullPhone) => setPhone(fullPhone)}
            placeholder="98765 43210"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-foreground mb-2 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Visit Urgency / Category
          </label>
          <select
            value={emergencyType}
            onChange={(e) => setEmergencyType(e.target.value)}
            className="w-full bg-background border border-border rounded-xl px-4 py-3.5 text-foreground focus:outline-none focus:ring-2 focus:ring-accent transition-all text-base"
          >
            {EMERGENCY_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-foreground mb-2 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-accent" />
              Date *
            </label>
            <input
              type="date"
              required
              min={new Date().toISOString().split("T")[0]}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-background border border-border rounded-xl px-3 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-accent transition-all text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-foreground mb-2 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-accent" />
              Time
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full bg-background border border-border rounded-xl px-3 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-accent transition-all text-sm"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-accent text-white font-bold py-4 rounded-xl hover:brightness-110 active:scale-[0.98] transition-all text-lg flex items-center justify-center gap-3 disabled:opacity-50"
        >
          {loading && <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
          Book Appointment
        </button>
      </form>
    </div>
  );
}
