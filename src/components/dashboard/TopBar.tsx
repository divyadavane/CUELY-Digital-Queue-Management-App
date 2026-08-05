"use client";

import { LogOut, Volume2, VolumeX } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Database } from "@/types/database";
import { CuelyLogo } from "@/components/ui/CuelyLogo";

type Queue = Database["public"]["Tables"]["queues"]["Row"];

interface TopBarProps {
  businessName: string;
  queues: Queue[];
  activeQueueId: string | null;
  onQueueSelect: (id: string) => void;
  isMuted?: boolean;
  toggleMute?: () => void;
}

export function TopBar({ businessName, queues, activeQueueId, onQueueSelect, isMuted, toggleMute }: TopBarProps) {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-surface px-6 h-16 flex items-center justify-between premium-shadow">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <Link href="/dashboard" className="flex items-center gap-2">
            <CuelyLogo size="sm" showGlow className="group-hover:scale-105" />
            <h1 className="font-bold text-lg font-sans text-foreground">{businessName}</h1>
          </Link>
        </div>
      </div>

      <div className="flex-1 flex justify-center max-w-md mx-4">
          {queues.length > 1 ? (
            <>
              {/* Desktop Tabs */}
              <nav className="hidden sm:flex items-center gap-1 bg-muted rounded-xl p-1">
                {queues.map((queue) => (
                  <button
                    key={queue.id}
                    onClick={() => onQueueSelect(queue.id)}
                    className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all duration-200 ${
                      activeQueueId === queue.id
                        ? "bg-surface text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5"
                    }`}
                  >
                    {queue.name}
                  </button>
                ))}
              </nav>
              
              {/* Mobile Select */}
              <select 
                className="sm:hidden block w-full bg-surface border border-border text-foreground rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                value={activeQueueId || ""}
                onChange={(e) => onQueueSelect(e.target.value)}
              >
                {queues.map(queue => (
                  <option key={queue.id} value={queue.id}>{queue.name}</option>
                ))}
              </select>
            </>
          ) : queues.length === 1 ? (
            <span className="text-sm font-bold text-foreground bg-muted px-4 py-1.5 rounded-xl">
              {queues[0].name}
            </span>
          ) : null}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          <Link 
            href="/dashboard/activity" 
            className="text-sm font-medium text-muted-foreground hover:text-foreground px-3 py-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors hidden sm:block"
          >
            Activity Log
          </Link>
          
          <Link 
            href="/dashboard/reports" 
            className="text-sm font-bold text-accent hover:text-accent/90 px-3 py-2 rounded-lg bg-accent/10 border border-accent/20 transition-all hidden sm:block"
          >
            📊 Admin Reports
          </Link>

          <Link 
            href="/dashboard/doctor" 
            className="text-sm font-bold text-blue-400 hover:text-blue-300 px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20 transition-all hidden sm:block"
          >
            🩺 Doctor Queues
          </Link>
          
          {toggleMute && (
            <button
              onClick={toggleMute}
              className="p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              title={isMuted ? "Unmute alerts" : "Mute alerts"}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          )}

        <ThemeToggle />
        
        <div className="h-6 w-px bg-border hidden sm:block" />
        
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-destructive transition-colors px-2 py-1.5 rounded-md"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Log out</span>
        </button>
      </div>
    </header>
  );
}
