"use client";

import { LoginForm } from "@/components/auth/LoginForm";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function LoginPage() {
  return (
    <main className="min-h-screen relative overflow-hidden flex items-center justify-center bg-background transition-colors duration-300">
      {/* Theme Toggle Positioned Top Right */}
      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      <div className="relative z-10 w-full px-4 max-w-md mx-auto">
        <LoginForm />
      </div>
    </main>
  );
}
