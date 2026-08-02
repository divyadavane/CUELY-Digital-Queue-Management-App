import { useState } from "react";
import toast from "react-hot-toast";
import { joinQueueAction } from "@/actions/queue";
import { AlertTriangle } from "lucide-react";
import { EMERGENCY_TYPES } from "@/components/customer/BookAppointmentForm";
import { CountryPhoneInput } from "@/components/ui/country-phone-input";

import { Database } from "@/types/database";

type Queue = Database["public"]["Tables"]["queues"]["Row"];

interface JoinFormProps {
  queue: Queue;
  onJoin: (ticketId: string) => void;
}

const urlBase64ToUint8Array = (base64String: string) => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

export function JoinForm({ queue, onJoin }: JoinFormProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [emergencyType, setEmergencyType] = useState("routine");
  const [loading, setLoading] = useState(false);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { success, data, error, whatsapp } = (await joinQueueAction(queue.id, phone, emergencyType, name)) as any;

    if (!success) {
      toast.error(error || "Failed to join queue");
      setLoading(false);
      return;
    }

    if (data && data.ticket_id) {
      if (whatsapp && whatsapp.sentViaService) {
        toast.success(`Ticket issued! WhatsApp alert sent automatically to ${phone}.`);
      } else {
        toast.success(`Ticket issued! WhatsApp notification queued for ${phone}.`);
      }

      // Handle Web Push Subscriptions
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

      if (isIOS && !isStandalone) {
        toast("Tap Share → Add to Home Screen, then enable notifications to get alerted", { icon: "📱", duration: 8000 });
      } else if ('serviceWorker' in navigator && 'PushManager' in window) {
        try {
          const permission = await Notification.requestPermission();
          if (permission === 'granted') {
            const registration = await navigator.serviceWorker.register('/sw.js');
            let subscription = await registration.pushManager.getSubscription();
            
            if (!subscription) {
              const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'BPBPYM1X-Do5GmNNyFWyrsqc_JciIFKr_BN8b0FRRBSZc4TBM4vJVEUNhy8CMtCUv0rKPLM_lCmeFY_RS7Z39lI';
              subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(publicVapidKey),
              });
            }

            await fetch('/api/push/subscribe', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ subscription, ticketId: data.ticket_id })
            });

            toast.success("Browser notifications enabled!");
          } else {
            toast("Enable notifications to get alerted when it's your turn", { icon: "🔔" });
          }
        } catch (err) {
          console.error("Push subscription failed:", err);
        }
      }

      onJoin(data.ticket_id);
    } else {
      toast.error("Invalid response from server.");
    }
    setLoading(false);
  };

  return (
    <div className="w-full max-w-md mx-auto bg-surface border border-border rounded-3xl p-8 md:p-12 premium-shadow">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold font-sans text-foreground mb-3 tracking-tight">Join Queue</h2>
        <div className="bg-muted p-3 rounded-xl mb-4 text-left border border-border">
          <p className="text-sm font-bold text-foreground">{queue.doctor_name || queue.name}</p>
          <p className="text-xs text-muted-foreground">{queue.department} • {queue.counter_number}</p>
        </div>
        <p className="text-muted-foreground text-sm">
          Enter your details to get your token and track your position live.
        </p>
      </div>

      <form onSubmit={handleJoin} className="space-y-6">
        <div>
          <label className="block text-sm font-bold text-foreground mb-2">
            Full Name *
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Doe"
            className="w-full bg-background border border-border rounded-xl px-4 py-3.5 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent transition-all text-base"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-foreground mb-2">
            Phone Number (Optional - For SMS/WhatsApp)
          </label>
          <CountryPhoneInput
            value={phone}
            onChange={(fullPhone) => setPhone(fullPhone)}
            placeholder="98765 43210"
          />
          <p className="text-xs text-muted-foreground mt-2">
            Select your country code to receive instant updates.
          </p>
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

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-accent text-white font-bold py-4 rounded-xl hover:brightness-110 active:scale-[0.98] transition-all text-lg flex items-center justify-center gap-3 disabled:opacity-50"
        >
          {loading && <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
          Get My Ticket
        </button>
      </form>
    </div>
  );
}
