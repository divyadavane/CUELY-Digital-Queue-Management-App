"use client";

interface StatsStripProps {
  servedCount: number;
  waitingCount: number;
  noShowCount: number;
  avgWaitSeconds: number;
}

function formatDuration(seconds: number): string {
  if (seconds === 0) return "—";
  const mins = Math.floor(seconds / 60);
  if (mins < 1) return `${seconds}s`;
  return `${mins}m`;
}

export default function StatsStrip({ servedCount, waitingCount, noShowCount, avgWaitSeconds }: StatsStripProps) {
  const stats = [
    {
      label: "Served Today",
      value: servedCount,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: "text-status-served",
      bg: "bg-status-served/10",
    },
    {
      label: "Waiting Now",
      value: waitingCount,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: "text-accent",
      bg: "bg-accent/10",
    },
    {
      label: "Avg. Wait",
      value: formatDuration(avgWaitSeconds),
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      color: "text-navy-900",
      bg: "bg-navy-900/10",
    },
    {
      label: "No Shows",
      value: noShowCount,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
      ),
      color: "text-status-noshow",
      bg: "bg-status-noshow/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map((stat) => (
        <div key={stat.label} className="bg-surface rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 ${stat.bg} rounded-lg flex items-center justify-center ${stat.color}`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-2xl font-bold text-text-heading">{stat.value}</p>
              <p className="text-xs text-text-muted font-medium">{stat.label}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
