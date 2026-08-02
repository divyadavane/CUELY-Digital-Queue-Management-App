import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { Star } from "lucide-react";

interface PostCheckupCardProps {
  ticket: any;
  onClear: () => void;
}

export function PostCheckupCard({ ticket, onClear }: PostCheckupCardProps) {
  const [showContent, setShowContent] = useState(false);
  const [showRating, setShowRating] = useState(false);

  useEffect(() => {
    // Staggered reveal
    const timer1 = setTimeout(() => setShowContent(true), 600);
    
    // Confetti burst on load
    const duration = 1.5 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#6366f1', '#3b82f6', '#06b6d4']
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#6366f1', '#3b82f6', '#06b6d4']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    
    // Slight delay before confetti
    setTimeout(() => requestAnimationFrame(frame), 300);

    return () => clearTimeout(timer1);
  }, []);

  const waitTimeMinutes = ticket.called_at && ticket.joined_at 
    ? Math.round((new Date(ticket.called_at).getTime() - new Date(ticket.joined_at).getTime()) / 60000)
    : 0;

  if (showRating) {
    return (
      <div className="w-full max-w-md mx-auto bg-surface/80 backdrop-blur-md border border-accent/20 rounded-[32px] p-10 text-center shadow-[0_8px_32px_-12px_rgba(99,102,241,0.2)] animate-in zoom-in-95 duration-500">
        <h2 className="text-2xl font-bold font-sans text-foreground mb-6">How was your visit?</h2>
        <div className="flex justify-center gap-2 mb-8">
          {[1, 2, 3, 4, 5].map((star) => (
            <button key={star} onClick={onClear} className="text-muted-foreground hover:text-yellow-400 hover:scale-110 transition-all">
              <Star className="w-10 h-10 fill-current" />
            </button>
          ))}
        </div>
        <p className="text-sm text-muted-foreground mb-6">Your feedback helps us improve.</p>
        <button onClick={onClear} className="text-sm font-bold text-muted-foreground hover:text-foreground">Skip</button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto bg-surface/80 backdrop-blur-md border border-accent/20 rounded-[32px] p-10 text-center shadow-[0_8px_32px_-12px_rgba(99,102,241,0.2)]">
      
      {/* Animated Checkmark and Pulse */}
      <div className="relative w-24 h-24 mx-auto mb-8 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-accent opacity-20 animate-ping" style={{ animationDuration: '3s' }} />
        <div className="absolute inset-2 rounded-full bg-accent opacity-20 animate-ping" style={{ animationDuration: '3s', animationDelay: '0.5s' }} />
        
        <div className="relative z-10 w-20 h-20 bg-gradient-to-tr from-indigo-500 via-blue-500 to-cyan-500 rounded-full flex items-center justify-center shadow-lg animate-in zoom-in duration-500 ease-out">
          <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              d="M5 13l4 4L19 7"
              className="animate-[dash_0.6s_ease-out_forwards]"
              style={{ strokeDasharray: 24, strokeDashoffset: 24 }}
            />
          </svg>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes dash {
          to { stroke-dashoffset: 0; }
        }
      `}} />

      {/* Staggered Content */}
      <div className={`transition-all duration-700 transform ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <h2 className="text-3xl font-bold font-sans text-foreground mb-2 tracking-tight">Visit Complete</h2>
        <p className="text-muted-foreground mb-6">
          Your visit at {ticket.queues?.name || "the clinic"} is complete.
        </p>

        <div className="bg-background rounded-2xl p-4 mb-8 border border-border inline-block min-w-[200px]">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Token {ticket.token_number}</p>
          <p className="text-lg font-bold text-foreground">Seen in {waitTimeMinutes} mins</p>
        </div>

        {/* Progress Tracker */}
        <div className="flex items-center justify-between max-w-[240px] mx-auto mb-10 relative">
          <div className="absolute left-0 top-1/2 w-full h-1 bg-border -z-10 -translate-y-1/2 rounded-full" />
          <div className="absolute left-0 top-1/2 w-full h-1 bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-500 -z-10 -translate-y-1/2 rounded-full" />
          
          <div className="flex flex-col items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-accent border-4 border-surface" />
            <span className="text-[10px] font-bold text-foreground uppercase tracking-wider">Joined</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-accent border-4 border-surface" />
            <span className="text-[10px] font-bold text-foreground uppercase tracking-wider">Wait</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-accent border-4 border-surface shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
            <span className="text-[10px] font-bold text-accent uppercase tracking-wider">Seen</span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button onClick={() => setShowRating(true)} className="w-full bg-accent text-white font-bold py-3.5 rounded-xl hover:brightness-110 active:scale-[0.98] transition-all text-sm flex items-center justify-center gap-2">
            <Star className="w-4 h-4" /> Rate your experience
          </button>
          <button onClick={onClear} className="w-full bg-transparent text-foreground border border-border font-bold py-3.5 rounded-xl hover:bg-muted active:scale-[0.98] transition-all text-sm">
            Return to Home
          </button>
        </div>
      </div>
    </div>
  );
}
