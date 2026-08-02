import { baticaSans } from "@/lib/fonts";
import { AnimatedBackground } from '@/components/ui/AnimatedBackground';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${baticaSans.variable} font-sans min-h-screen relative`}>
      <AnimatedBackground isInterior={true} />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
