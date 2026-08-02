import { useState } from "react";
import { createClient } from "@/lib/supabase";
import toast from "react-hot-toast";
import { UserPlus } from "lucide-react";

interface ManualTicketFormProps {
  queueId: string;
}

export function ManualTicketForm({ queueId }: ManualTicketFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [isPriority, setIsPriority] = useState(false);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.rpc("add_manual_ticket", {
      p_queue_id: queueId,
      p_name: name || null,
      p_phone: phone || null,
      p_priority: isPriority ? 1 : 0
    });

    if (error) {
      toast.error(`Failed to add ticket: ${error.message}`);
    } else {
      toast.success("Walk-in ticket added successfully.");
      setName("");
      setPhone("");
      setIsPriority(false);
      setIsOpen(false);
    }
    setLoading(false);
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="w-full bg-surface border border-border rounded-3xl p-4 flex items-center justify-center gap-2 text-foreground font-medium hover:bg-accent hover:text-white hover:border-accent transition-colors premium-shadow"
      >
        <UserPlus className="w-5 h-5" />
        Add Walk-in
      </button>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-3xl p-6 premium-shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-foreground font-sans">Add Walk-in</h3>
        <button 
          onClick={() => setIsOpen(false)}
          className="text-muted-foreground hover:text-foreground p-1"
        >
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">
            Patient Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-accent transition-colors"
            placeholder="John Doe"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">
            Phone Number (Optional)
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-accent transition-colors"
            placeholder="+1 (555) 000-0000"
          />
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isPriority}
            onChange={(e) => setIsPriority(e.target.checked)}
            className="w-4 h-4 rounded border-border text-accent focus:ring-accent bg-background"
          />
          <span className="text-sm font-medium text-foreground">Priority Patient</span>
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 bg-accent text-white font-bold rounded-lg hover:brightness-110 transition-all disabled:opacity-50"
        >
          {loading ? "Adding..." : "Add Ticket"}
        </button>
      </form>
    </div>
  );
}
