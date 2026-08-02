'use client';

import React, { useState, useEffect } from 'react';
import { ChevronDown, Check, ArrowRight, Play, Users, Clock, Shield, Sparkles, Smartphone, BarChart3, Settings } from 'lucide-react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { LandingChatWidget } from '@/components/landing/LandingChatWidget';
import { AnimatedBackground } from '@/components/ui/AnimatedBackground';
import { TextReveal } from '@/components/ui/cascade-text';
import { StatsSection } from "@/components/ui/stat-counter";
import { FeaturesGrid } from "@/components/landing/FeaturesGrid";
import { StepsSection } from "@/components/landing/StepsSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { FaqSection } from "@/components/landing/FaqSection";

export default function CuelyLandingV2() {
  const [scrolled, setScrolled] = useState(false);
  const [demoStatus, setDemoStatus] = useState('WAITING');
  const [tokenNumber, setTokenNumber] = useState('A-102');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const statuses = ['WAITING', 'CALLED', 'SERVED'];
    let currentIndex = 0;
    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % statuses.length;
      setDemoStatus(statuses[currentIndex]);
      if (currentIndex === 0) {
        setTokenNumber(`A-${Math.floor(Math.random() * 900 + 100)}`);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleDemoJoin = () => {
    setDemoStatus('WAITING');
    setTokenNumber(`B-${Math.floor(Math.random() * 900 + 100)}`);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-300 overflow-x-hidden font-sans">
      <AnimatedBackground isInterior={false} />
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes shine {
          0% { left: -100%; }
          20% { left: 100%; }
          100% { left: 100%; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .text-gradient {
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-image: var(--accent-gradient);
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .shine-btn {
          position: relative;
          overflow: hidden;
        }
        .shine-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 50%;
          height: 100%;
          background: linear-gradient(to right, transparent, rgba(255,255,255,0.3), transparent);
          transform: skewX(-20deg);
          animation: shine 3s infinite;
        }
        .fade-in-up {
          animation: fadeInUp 0.8s ease-out forwards;
        }
        .glass-panel {
          background: var(--glass-bg);
          backdrop-filter: blur(12px);
          border: 1px solid var(--glass-border);
          box-shadow: 0 8px 30px var(--shadow-color);
        }
      `}} />

      {/* Navbar */}
      <Navbar scrolled={scrolled} />

      {/* Hero Section */}
      <div className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden min-h-[90vh] flex items-center">
        {/* Floating background orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[100px] animate-blob-drift-1 pointer-events-none"></div>
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-[100px] animate-blob-drift-2 pointer-events-none"></div>
        <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-cyan-500/20 rounded-full blur-[100px] animate-blob-drift-3 pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-6 relative z-10 w-full">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            
            {/* Hero Content */}
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[var(--badge-bg)] border border-[var(--badge-border)] text-sm font-semibold text-[var(--badge-text)] mb-6 shadow-sm hero-seq">
                <Sparkles className="w-4 h-4" />
                <span>Cuely 2.0 is here</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6 text-[var(--text-primary)] heading hero-seq hero-seq-1">
                Manage queues with an <br/>
                <TextReveal text="unfair advantage." className="text-gradient animate-gradient-shift" duration={400} hoverColor="#8b5cf6" />
              </h1>
              <p className="text-lg md:text-xl text-[var(--text-secondary)] mb-8 max-w-lg leading-relaxed hero-seq hero-seq-2">
                The premium queue management platform that turns waiting into an experience. No apps to download, just seamless flow.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 hero-seq hero-seq-3">
                <button className="shine-btn bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] px-8 py-4 rounded-full text-base font-bold hover:scale-[1.03] active:scale-[0.98] hover:shadow-xl hover:shadow-[var(--btn-primary-bg)]/20 transition-all flex items-center justify-center gap-2 shadow-lg duration-200">
                  Get Started <ArrowRight className="w-4 h-4" />
                </button>
                <button className="premium-glass text-[var(--text-primary)] px-8 py-4 rounded-full text-base font-medium hover:bg-[var(--border-color)] hover:scale-[1.03] active:scale-[0.98] transition-all flex items-center justify-center gap-2 duration-200">
                  <Play className="w-4 h-4 fill-current" /> See Pricing
                </button>
              </div>
              
              <div className="mt-10 flex items-center gap-4 text-sm text-[var(--text-muted)] hero-seq hero-seq-4">
                <div className="flex -space-x-2">
                  {[1,2,3,4].map(i => (
                    <div key={i} className={`w-8 h-8 rounded-full border-2 border-[var(--bg-primary)] bg-[var(--bg-secondary)] flex items-center justify-center text-xs overflow-hidden`}>
                      <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="Avatar" />
                    </div>
                  ))}
                </div>
                <div>Join <span className="text-[var(--text-primary)] font-semibold">10,000+</span> businesses</div>
              </div>
            </div>

            {/* Hero Interactive Mockup */}
            <div className="relative lg:ml-auto w-full max-w-md mx-auto hero-seq hero-seq-5">
              <div className="animate-float">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-violet-500 blur-3xl opacity-20 rounded-full scale-90 mt-10"></div>
                
                <div className="relative premium-glass rounded-[2.5rem] p-4 premium-shadow">
                  {/* Phone screen */}
                  <div className="bg-[var(--bg-card-inner)] rounded-[1.8rem] overflow-hidden border border-[var(--border-color)] h-[600px] flex flex-col relative text-[var(--text-primary)] shadow-inner">
                  {/* Top bar notch */}
                  <div className="h-6 w-full flex justify-center absolute top-2 z-20">
                    <div className="w-1/3 h-5 bg-[var(--border-color)] rounded-full"></div>
                  </div>
                  
                  {/* App Content */}
                  <div className="p-6 pt-12 flex-1 flex flex-col">
                    <div className="flex justify-between items-center mb-8">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center font-bold text-xs text-white">C</div>
                      <Settings className="w-5 h-5 text-[var(--text-muted)]" />
                    </div>
                    
                    <h3 className="text-xl font-semibold mb-1 text-[var(--text-primary)]">Dr. Smith's Clinic</h3>
                    <p className="text-sm text-[var(--text-secondary)] mb-8">Your digital queue ticket</p>
                    
                    <div className="glass-panel rounded-2xl p-6 text-center flex-1 flex flex-col items-center justify-center relative overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <p className="text-sm text-[var(--text-muted)] mb-2 font-semibold tracking-wider">YOUR NUMBER</p>
                      <h2 className="text-6xl font-extrabold mb-4 tracking-tighter text-[var(--text-primary)]">{tokenNumber}</h2>
                      
                      <div className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-widest transition-colors ${
                        demoStatus === 'WAITING' ? 'bg-[var(--status-waiting-bg)] text-[var(--status-waiting-text)] border border-[var(--status-waiting-border)]' : 
                        demoStatus === 'CALLED' ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 animate-pulse' : 
                        'bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 animate-pulse-glow'
                      }`}>
                        {demoStatus}
                      </div>
                      
                      {demoStatus === 'WAITING' && (
                        <div className="mt-8 text-sm text-[var(--text-secondary)]">
                          Estimated wait: <span className="text-[var(--text-primary)] font-semibold">12 mins</span>
                        </div>
                      )}
                      {demoStatus === 'CALLED' && (
                        <div className="mt-8 text-sm text-emerald-600 dark:text-emerald-400 font-semibold">
                          Please proceed to Room 3
                        </div>
                      )}
                    </div>
                    
                    <button 
                      onClick={handleDemoJoin}
                      className="mt-6 w-full bg-[var(--border-color)] hover:bg-[var(--glass-bg)] text-[var(--text-primary)] py-3 rounded-xl font-semibold transition-colors border border-[var(--border-color)]"
                    >
                      Join Another Queue
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* Stats Logo Strip */}
      <div 
        className="border-y border-[var(--border-color)] bg-[var(--stat-strip-bg)] py-8 overflow-hidden relative"
        style={{ WebkitMaskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)', maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)' }}
      >
        <div className="flex w-max animate-marquee-infinite hover:animation-play-state-paused">
          {[1, 2].map((_, idx) => (
            <div key={idx} className="flex gap-16 md:gap-32 items-center px-8 md:px-16 shrink-0">
              <span className="text-xl font-bold text-[var(--text-muted)] opacity-60 hover:opacity-100 transition-opacity">Acme Corp</span>
              <span className="text-xl font-bold text-[var(--text-muted)] opacity-60 hover:opacity-100 transition-opacity">GlobalHealth</span>
              <span className="text-xl font-bold text-[var(--text-muted)] opacity-60 hover:opacity-100 transition-opacity">NovaRetail</span>
              <span className="text-xl font-bold text-[var(--text-muted)] opacity-60 hover:opacity-100 transition-opacity">Stark Ind.</span>
              <span className="text-xl font-bold text-[var(--text-muted)] opacity-60 hover:opacity-100 transition-opacity">Wayne Ent.</span>
              <span className="text-xl font-bold text-[var(--text-muted)] opacity-60 hover:opacity-100 transition-opacity">Initech</span>
              <span className="text-xl font-bold text-[var(--text-muted)] opacity-60 hover:opacity-100 transition-opacity">Soylent</span>
              <span className="text-xl font-bold text-[var(--text-muted)] opacity-60 hover:opacity-100 transition-opacity">Umbrella</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stats Bar */}
      <StatsSection />

      {/* Features Grid */}
      <div id="features" className="py-24 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-[var(--text-primary)]">Everything you need to manage flow.</h2>
            <p className="text-[var(--text-secondary)] max-w-2xl mx-auto text-lg">
              Enterprise-grade features without the enterprise complexity.
            </p>
          </div>
          
          <FeaturesGrid />
        </div>
      </div>

      {/* How it Works */}
      <StepsSection />

      {/* Testimonials */}
      <TestimonialsSection />

      {/* FAQ Accordion */}
      <FaqSection />

      {/* Final CTA */}
      <div className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-indigo-900/10"></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-15 mix-blend-overlay"></div>
        
        <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
          <h2 className="text-4xl md:text-6xl font-bold mb-8 text-[var(--text-primary)]">Start reclaiming your time.</h2>
          <p className="text-xl text-[var(--text-secondary)] mb-10 max-w-2xl mx-auto">
            Join thousands of businesses providing a world-class waiting experience. Setup takes less than 5 minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="shine-btn bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] px-8 py-4 rounded-full text-lg font-bold hover:scale-[1.03] active:scale-[0.98] transition-all hover:shadow-xl hover:shadow-[var(--btn-primary-bg)]/20 shadow-lg">
              Get Started for Free
            </button>
            <button className="premium-glass text-[var(--text-primary)] px-8 py-4 rounded-full text-lg font-medium hover:bg-[var(--border-color)] hover:scale-[1.03] active:scale-[0.98] transition-all">
              Talk to Sales
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[var(--footer-bg)] py-12 border-t border-[var(--border-color)] text-[var(--text-secondary)] text-sm transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
          <div className="col-span-2 lg:col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center font-bold text-white text-lg">C</div>
              <span className="text-xl font-bold tracking-tight text-[var(--text-primary)]">Cuely</span>
            </div>
            <p className="max-w-xs text-[var(--text-secondary)]">
              Manage queues with an unfair advantage. Built for modern businesses that care about their customers' time.
            </p>
          </div>
          <div>
            <h4 className="text-[var(--text-primary)] font-semibold mb-4">Product</h4>
            <ul className="space-y-3">
              <li><a href="#features" className="hover:text-[var(--text-primary)] transition-colors">Features</a></li>
              <li><a href="#" className="hover:text-[var(--text-primary)] transition-colors">Pricing</a></li>
              <li><a href="#" className="hover:text-[var(--text-primary)] transition-colors">Case Studies</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-[var(--text-primary)] font-semibold mb-4">Company</h4>
            <ul className="space-y-3">
              <li><a href="#" className="hover:text-[var(--text-primary)] transition-colors">About</a></li>
              <li><a href="#" className="hover:text-[var(--text-primary)] transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-[var(--text-primary)] transition-colors">Careers</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-[var(--text-primary)] font-semibold mb-4">Legal</h4>
            <ul className="space-y-3">
              <li><a href="#" className="hover:text-[var(--text-primary)] transition-colors">Privacy</a></li>
              <li><a href="#" className="hover:text-[var(--text-primary)] transition-colors">Terms</a></li>
              <li><a href="#" className="hover:text-[var(--text-primary)] transition-colors">Security</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 pt-8 border-t border-[var(--border-color)] flex flex-col md:flex-row items-center justify-between">
          <p>© 2026 Cuely Inc. All rights reserved.</p>
          <div className="flex gap-4 mt-4 md:mt-0">
            {/* Social Icons Placeholders */}
            <div className="w-8 h-8 rounded-full bg-[var(--border-color)] hover:opacity-80 flex items-center justify-center cursor-pointer transition-opacity"></div>
            <div className="w-8 h-8 rounded-full bg-[var(--border-color)] hover:opacity-80 flex items-center justify-center cursor-pointer transition-opacity"></div>
            <div className="w-8 h-8 rounded-full bg-[var(--border-color)] hover:opacity-80 flex items-center justify-center cursor-pointer transition-opacity"></div>
          </div>
        </div>
      </footer>
      <LandingChatWidget />
    </div>
  );
}
