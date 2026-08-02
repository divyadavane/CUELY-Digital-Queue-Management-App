"use client";

import { MessageCircle } from "lucide-react";

export function FloatingChat() {
  return (
    <button
      onClick={() => {
        // TODO: wire to support chat
        console.log("Chat clicked");
      }}
      className="fixed bottom-6 left-6 z-50 flex items-center justify-center w-12 h-12 bg-[#0B1120] text-white rounded-full shadow-lg hover:scale-105 transition-transform focus:outline-none focus:ring-2 focus:ring-primary/50"
      aria-label="Open Support Chat"
    >
      <MessageCircle className="w-5 h-5" />
    </button>
  );
}
