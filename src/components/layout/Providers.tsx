"use client";

import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/hooks/useAuth";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark">
      <AuthProvider>{children}</AuthProvider>
    </ThemeProvider>
  );
}
