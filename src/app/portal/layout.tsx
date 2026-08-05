import type { Metadata } from "next";
import { manrope } from "@/lib/fonts";

export const metadata: Metadata = {
  title: "My Portal — Cuely",
  description: "Your queue status, appointments, visit history, ratings and bills — all in one place.",
};

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${manrope.variable} font-manrope min-h-screen bg-[#070b16] text-white`}>
      {children}
    </div>
  );
}
