"use client";

import { useAuth } from "@/hooks/useAuth";
import { Database } from "@/types/database";
import { CuelyLogo } from "@/components/ui/CuelyLogo";

type Queue = Database["public"]["Tables"]["queues"]["Row"];

interface TopBarProps {
  businessName: string;
  queues: Queue[];
  selectedQueue: Queue | null;
  onSelectQueue: (queue: Queue) => void;
}

export default function TopBar({ businessName, queues, selectedQueue, onSelectQueue }: TopBarProps) {
  const { user, signOut } = useAuth();

  return (
    <header className="bg-navy-900 text-text-on-navy shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Logo + Business Name */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <CuelyLogo size="sm" showGlow />
              <span className="text-lg font-bold tracking-tight">Cuely</span>
            </div>
            <div className="hidden sm:block w-px h-8 bg-navy-700" />
            <span className="hidden sm:block text-text-muted-on-navy font-medium">
              {businessName}
            </span>
          </div>

          {/* Center: Queue Tabs */}
          {queues.length > 1 && (
            <nav className="flex items-center gap-1 bg-navy-800 rounded-lg p-1">
              {queues.map((queue) => (
                <button
                  key={queue.id}
                  onClick={() => onSelectQueue(queue)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    selectedQueue?.id === queue.id
                      ? "bg-accent text-white shadow-md"
                      : "text-text-muted-on-navy hover:text-white hover:bg-navy-700"
                  }`}
                >
                  {queue.name}
                </button>
              ))}
            </nav>
          )}

          {/* Right: User + Logout */}
          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-sm text-text-muted-on-navy">
              {user?.email}
            </span>
            <button
              onClick={signOut}
              className="px-3 py-2 text-sm text-text-muted-on-navy hover:text-white hover:bg-navy-800 rounded-lg transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
