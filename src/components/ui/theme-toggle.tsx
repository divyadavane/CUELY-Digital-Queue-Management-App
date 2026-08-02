'use client';

import * as React from 'react';
import { cn } from "@/lib/utils";
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();

  // Avoid hydration mismatch by not rendering the icon until mounted, or render based on theme
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-8 h-8 rounded-full" />; // Placeholder
  }

  return (
    <button
      onClick={() => setTheme(theme === 'navy' ? 'beige' : 'navy')}
      className={cn(
        "relative flex items-center justify-center gap-2 px-3 py-1.5 h-8 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/50 text-muted-foreground hover:bg-black/5 dark:hover:bg-white/10",
        className
      )}
      aria-label="Toggle Theme"
    >
      {theme === 'navy' ? (
        <>
          <Sun className="w-4 h-4" />
          <span className="text-xs uppercase tracking-wider font-medium">Beige</span>
        </>
      ) : (
        <>
          <Moon className="w-4 h-4" />
          <span className="text-xs uppercase tracking-wider font-medium">Navy</span>
        </>
      )}
    </button>
  );
}
