"use client";
import React from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun, ArrowRight, Target, Users, Zap } from 'lucide-react';
import Image from 'next/image';

interface NavLink { label: string; href: string; }
interface HeroProps { titleLine1: string; titleLine2Gradient: string; subtitle: string; }
interface PortfolioPageProps {
  logo?: { initials: string; name: string };
  navLinks?: NavLink[];
  resume?: { label: string; onClick?: () => void };
  hero?: HeroProps;
}

const defaultData = {
  logo: { initials: 'C', name: 'Cuely' },
  navLinks: [ { label: 'Benefits', href: '#benefits' }, { label: 'Process', href: '#process' }, { label: 'FAQ', href: '#faq' } ],
  resume: { label: 'Dashboard Login', onClick: undefined },
  hero: { 
    titleLine1: 'Manage queues with an', 
    titleLine2Gradient: 'unfair advantage', 
    subtitle: 'Clinics and salons operate in distinct spheres, with their own set of priorities and communication channels. Bridging the gap involves breaking down the wait time.', 
  },
};

const MovingBackground = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  return (
    <div 
      className="absolute inset-0 z-0 opacity-40 transition-colors duration-1000"
      style={{
        background: isDark 
          ? 'radial-gradient(circle at 50% 50%, #1e3a8a 0%, transparent 50%), radial-gradient(circle at 80% 20%, #3b82f6 0%, transparent 40%)'
          : 'radial-gradient(circle at 50% 50%, #d4d4aa 0%, transparent 50%), radial-gradient(circle at 80% 20%, #e5e5cc 0%, transparent 40%)',
        filter: 'blur(60px)',
        animation: 'float 10s ease-in-out infinite'
      }}
    />
  );
};

export const PortfolioPage: React.FC<PortfolioPageProps> = ({
  logo = defaultData.logo,
  navLinks = defaultData.navLinks,
  resume = defaultData.resume,
  hero = defaultData.hero,
}) => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  return (
    <div className="text-foreground inter-font min-h-screen relative overflow-x-hidden transition-colors duration-300">
      
      {/* Moving Background */}
      {mounted && <MovingBackground />}
      
      {/* NAVBAR */}
      <nav className="w-full px-6 py-6 absolute top-0 z-50">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
              <div className="flex items-center space-x-2">
                  <span className="inter-font text-xl font-bold tracking-tight text-foreground">{logo.name}</span>
              </div>
              <div className="hidden md:flex items-center space-x-10">
                  {navLinks.map(link => (
                      <a key={link.label} href={link.href} className="text-muted hover:text-foreground transition-colors text-xs font-semibold uppercase tracking-wider">{link.label}</a>
                  ))}
              </div>
              <div className="flex items-center space-x-6">
                {mounted && (
                  <button
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    className="text-muted hover:text-foreground transition-colors"
                    aria-label="Toggle theme"
                  >
                    {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                  </button>
                )}
                <button onClick={resume.onClick} className="bg-foreground text-background px-5 py-2.5 rounded text-sm font-semibold hover:opacity-90 transition-opacity">
                  {resume.label}
                </button>
              </div>
          </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative w-full min-h-screen flex items-center pt-24 pb-12 px-6">
        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="flex flex-col items-start z-10">
            <h1 className="text-5xl md:text-7xl font-bold leading-[1.1] tracking-tight mb-6 text-foreground">
              {hero.titleLine1} <br/>
              <span className="text-primary italic font-serif tracking-normal pr-2">{hero.titleLine2Gradient}</span>
            </h1>
            <p className="text-muted text-lg max-w-lg mb-10 leading-relaxed">
              {hero.subtitle}
            </p>
            <div className="flex items-center space-x-4">
              <button className="bg-foreground text-background px-6 py-3 rounded text-sm font-semibold hover:opacity-90 transition-opacity flex items-center">
                Get started <ArrowRight size={16} className="ml-2" />
              </button>
              <button className="border border-border text-foreground px-6 py-3 rounded text-sm font-semibold hover:bg-white/5 transition-colors">
                Learn more
              </button>
            </div>
          </div>

          {/* Right Content - Abstract empty space for the moving background to show through */}
          <div className="relative h-[600px] w-full hidden lg:block z-0">
          </div>
        </div>
      </section>

      {/* TRUSTED BY STRIP */}
      <div className="w-full border-t border-border/50 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between opacity-50 grayscale gap-8">
            <span className="text-xs font-bold uppercase tracking-widest text-muted">Trusted By</span>
            <div className="flex items-center space-x-12 overflow-x-auto w-full md:w-auto">
                <span className="font-serif text-xl font-bold">Canada</span>
                <span className="font-sans text-xl font-bold tracking-tighter">DECATHLON</span>
                <span className="font-sans text-xl font-bold text-red-500">HUAWEI</span>
                <span className="font-serif text-xl font-bold italic">IBM</span>
                <span className="font-sans text-xl font-bold tracking-widest">SME</span>
                <span className="font-sans text-xl font-bold lowercase">accenture</span>
            </div>
        </div>
      </div>

      {/* BENEFITS SECTION */}
      <section id="benefits" className="w-full py-24 px-6 border-t border-border/50">
        <div className="max-w-7xl mx-auto">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 border-b border-border/50 pb-16">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-muted mb-4 block">Benefits / 01</span>
              <h2 className="text-4xl md:text-5xl font-bold text-foreground">Why Cuely</h2>
              <p className="text-muted mt-4 max-w-lg">
                Companies and customers often operate in distinct spheres, with its own set of priorities, challenges, and communication channels.
              </p>
            </div>
            <button className="mt-8 md:mt-0 border border-border text-foreground px-6 py-3 rounded text-sm font-semibold hover:bg-white/5 transition-colors flex items-center">
              Get started <ArrowRight size={16} className="ml-2" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-x border-border/50">
            {/* Benefit 1 */}
            <div className="p-10 border-b md:border-b-0 md:border-r border-border/50">
              <Target className="text-primary mb-6" size={24} />
              <h3 className="text-lg font-bold text-foreground mb-3">No App Downloads</h3>
              <p className="text-sm text-muted leading-relaxed">
                Lorem Ipsum is simply dummy text of the printing and typesetting industry.
              </p>
            </div>
            {/* Benefit 2 */}
            <div className="p-10 border-b md:border-b-0 md:border-r border-border/50">
              <Users className="text-primary mb-6" size={24} />
              <h3 className="text-lg font-bold text-foreground mb-3">Highly experienced team</h3>
              <p className="text-sm text-muted leading-relaxed">
                Lorem Ipsum is simply dummy text of the printing and typesetting industry.
              </p>
            </div>
            {/* Benefit 3 */}
            <div className="p-10">
              <Zap className="text-primary mb-6" size={24} />
              <h3 className="text-lg font-bold text-foreground mb-3">Fast & efficient process</h3>
              <p className="text-sm text-muted leading-relaxed">
                Lorem Ipsum is simply dummy text of the printing and typesetting industry.
              </p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export { defaultData };
