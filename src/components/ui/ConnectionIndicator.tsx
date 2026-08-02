"use client";

type ConnectionStatus = "connected" | "reconnecting" | "disconnected";

interface ConnectionIndicatorProps {
  status: ConnectionStatus;
  onRefresh: () => void;
}

export default function ConnectionIndicator({ status, onRefresh }: ConnectionIndicatorProps) {
  if (status === "connected") return null;

  return (
    <div
      className={`flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium ${
        status === "reconnecting"
          ? "bg-amber-50 text-amber-700 border-b border-amber-200"
          : "bg-red-50 text-red-700 border-b border-red-200"
      }`}
    >
      {status === "reconnecting" ? (
        <>
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span>Reconnecting to live updates...</span>
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z" />
          </svg>
          <span>Connection lost</span>
        </>
      )}
      <button
        onClick={onRefresh}
        className="ml-2 px-2 py-0.5 text-xs font-semibold rounded bg-white border shadow-sm hover:bg-gray-50 transition-colors"
      >
        Refresh
      </button>
    </div>
  );
}
