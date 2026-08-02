import { Pause } from "lucide-react";

export function QueuePausedState() {
  return (
    <div className="w-full max-w-md mx-auto bg-surface border border-border rounded-3xl p-12 text-center premium-shadow">
      <div className="w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
        <Pause className="w-8 h-8 text-orange-500" />
      </div>
      <h2 className="text-2xl font-bold font-sans text-foreground mb-2">Queue is Paused</h2>
      <p className="text-muted-foreground">
        This queue isn't accepting new patients right now. Please check back shortly.
      </p>
    </div>
  );
}
