'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, ArrowRight, Sun, Moon } from 'lucide-react';
import { LANDING_CONFIG, NAV_LINKS } from '@/lib/landing-data';
import { MagneticButton } from '@/components/ui/MagneticButton';
import { CuelyLogo } from '@/components/ui/CuelyLogo';
import { useTheme } from '@/components/theme-provider';

export function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === 'navy' ? 'beige' : 'navy');
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[var(--nav-bg)] py-3 backdrop-blur-xl border-b border-[var(--border-color)] shadow-2xl shadow-black/50'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Prominent Cuely Logo & Title */}
          <Link href="/" className="flex items-center gap-3 group cursor-pointer" data-cursor="hover">
            <CuelyLogo size="md" showGlow className="group-hover:scale-105" />
            <div className="flex flex-col">
              <span className="text-2xl font-black tracking-tight text-[var(--text-primary)] flex items-center gap-1.5 font-sans">
                {LANDING_CONFIG.brandName}
                <span className="h-2 w-2 rounded-full bg-blue-400 animate-pulse shadow-sm shadow-blue-400" />
              </span>
              <span className="text-[10px] tracking-widest text-blue-300/80 uppercase font-bold">
                Queue OS
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors duration-200"
                data-cursor="hover"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              title="Toggle Theme"
              data-cursor="hover"
            >
              {theme === 'beige' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </button>

            {/* Login */}
            <Link
              href="/login"
              className="text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-3 py-2 transition-colors cursor-pointer"
              data-cursor="hover"
            >
              Log in
            </Link>

            {/* Primary CTA */}
            <Link href={LANDING_CONFIG.primaryCtaHref}>
              <MagneticButton variant="primary">
                <span>{LANDING_CONFIG.primaryCtaText}</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </MagneticButton>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-secondary)]"
            >
              {theme === 'beige' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </button>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 rounded-lg border border-[var(--border-color)] text-[var(--text-primary)]"
            >
              {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden border-b border-[var(--border-color)] bg-[var(--nav-bg)] px-4 pt-4 pb-6 backdrop-blur-2xl">
          <div className="flex flex-col gap-4">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="text-base font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] py-1"
              >
                {link.label}
              </a>
            ))}
            <div className="pt-2 flex flex-col gap-3">
              <Link href="/login" onClick={() => setMobileOpen(false)}>
                <span className="block text-center text-sm font-semibold py-2.5 text-[var(--text-primary)] border border-white/10 rounded-xl">
                  Log in
                </span>
              </Link>
              <Link href={LANDING_CONFIG.primaryCtaHref} onClick={() => setMobileOpen(false)}>
                <button className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 text-white font-semibold text-sm flex items-center justify-center gap-2">
                  <span>{LANDING_CONFIG.primaryCtaText}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
