import { Ticket } from "@/types/database";

export type UrgencyLevel = "critical" | "high" | "moderate" | "low";

export interface UrgencyInfo {
  score: number;
  level: UrgencyLevel;
  label: string;
  badgeClass: string;
  dotClass: string;
  factors: string[];
}

/**
 * Computes a clinical urgency score (0-100) and level for a patient ticket.
 */
export function calculateUrgency(ticket: Ticket): UrgencyInfo {
  let score = 0;
  const factors: string[] = [];

  // 1. Emergency Type Category Factor
  const category = (ticket.emergency_type || "routine").toLowerCase();
  if (category === "critical" || category === "emergency" || category === "severe") {
    score += 50;
    factors.push("Emergency Category: Critical (+50)");
  } else if (category === "urgent") {
    score += 35;
    factors.push("Emergency Category: Urgent (+35)");
  } else if (category === "follow_up") {
    score += 15;
    factors.push("Category: Follow-up (+15)");
  } else {
    score += 10;
    factors.push("Category: Routine (+10)");
  }

  // 2. Wait Duration Factor (1 pt per 2 mins waiting, max 30 pts)
  const now = new Date().getTime();
  const joinedAt = new Date(ticket.joined_at).getTime();
  const minutesWaited = Math.max(0, Math.floor((now - joinedAt) / 60000));
  const waitPoints = Math.min(30, Math.floor(minutesWaited / 2));
  if (waitPoints > 0) {
    score += waitPoints;
    factors.push(`Wait Duration: ${minutesWaited}m (+${waitPoints})`);
  }

  // 3. Priority Bumps (+15 pts per priority level)
  if (ticket.priority > 0) {
    const priorityPoints = ticket.priority * 15;
    score += priorityPoints;
    factors.push(`Priority Bump: Tier ${ticket.priority} (+${priorityPoints})`);
  }

  // Determine Urgency Level
  let level: UrgencyLevel = "low";
  let label = "Low Urgency";
  let badgeClass = "bg-slate-500/15 text-slate-400 border-slate-500/30";
  let dotClass = "bg-slate-400";

  if (score >= 65 || category === "critical") {
    level = "critical";
    label = "Critical";
    badgeClass = "bg-red-500/20 text-red-400 border-red-500/40 shadow-[0_0_12px_rgba(239,68,68,0.3)] animate-pulse-ring";
    dotClass = "bg-red-500 animate-ping";
  } else if (score >= 45 || category === "urgent") {
    level = "high";
    label = "High Urgency";
    badgeClass = "bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.2)]";
    dotClass = "bg-amber-400";
  } else if (score >= 25) {
    level = "moderate";
    label = "Moderate";
    badgeClass = "bg-blue-500/20 text-blue-400 border-blue-500/30";
    dotClass = "bg-blue-400";
  }

  return {
    score: Math.min(100, score),
    level,
    label,
    badgeClass,
    dotClass,
    factors,
  };
}
