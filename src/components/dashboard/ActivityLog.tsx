"use client";

import { Activity, UserPlus, Check, UserX, ArrowUp, RotateCcw, Pause, Play, Undo2, ChevronLeft } from "lucide-react";
import Link from "next/link";

interface LogEntry {
  id: string;
  action: string;
  createdAt: string;
  queueName: string;
  tokenNumber: number | null;
  adminId: string;
}

interface ActivityLogProps {
  logs: LogEntry[];
}

export function ActivityLog({ logs }: ActivityLogProps) {
  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getActionDetails = (action: string) => {
    switch (action) {
      case "call_next": return { label: "Called Next", icon: <Activity className="w-4 h-4 text-accent" /> };
      case "mark_served": return { label: "Marked Served", icon: <Check className="w-4 h-4 text-green-500" /> };
      case "mark_no_show": return { label: "Marked No Show", icon: <UserX className="w-4 h-4 text-destructive" /> };
      case "manual_entry": return { label: "Walk-in Added", icon: <UserPlus className="w-4 h-4 text-blue-500" /> };
      case "bump_priority": return { label: "Priority Bumped", icon: <ArrowUp className="w-4 h-4 text-accent" /> };
      case "recall": return { label: "Ticket Recalled", icon: <RotateCcw className="w-4 h-4 text-orange-500" /> };
      case "pause_queue": return { label: "Queue Paused", icon: <Pause className="w-4 h-4 text-orange-500" /> };
      case "resume_queue": return { label: "Queue Resumed", icon: <Play className="w-4 h-4 text-green-500" /> };
      case "undo_action": return { label: "Action Undone", icon: <Undo2 className="w-4 h-4 text-muted-foreground" /> };
      default: return { label: action, icon: <Activity className="w-4 h-4 text-muted-foreground" /> };
    }
  };

  if (logs.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-3xl p-12 text-center premium-shadow">
        <p className="text-muted-foreground">No activity recorded today.</p>
        <Link href="/dashboard" className="mt-4 inline-block text-accent hover:underline font-bold">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-3xl overflow-hidden premium-shadow">
      <div className="p-4 border-b border-border bg-muted flex items-center justify-between">
        <h2 className="font-bold text-foreground">Today's Log</h2>
        <Link href="/dashboard" className="flex items-center gap-1 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="w-4 h-4" />
          Dashboard
        </Link>
      </div>
      <div className="divide-y divide-border">
        {logs.map(log => {
          const { label, icon } = getActionDetails(log.action);
          return (
            <div key={log.id} className="p-4 flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center shrink-0 premium-shadow">
                  {icon}
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    {label} {log.tokenNumber ? <span className="font-bold">#{log.tokenNumber}</span> : ""}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Queue: {log.queueName} • Admin: {log.adminId.substring(0, 8)}
                  </p>
                </div>
              </div>
              <div className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                {formatTime(log.createdAt)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
