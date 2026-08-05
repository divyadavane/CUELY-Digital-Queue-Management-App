'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Menu, 
  X, 
  Sparkles, 
  Zap, 
  HelpCircle, 
  MessageSquareQuote, 
  Layers, 
  LogIn, 
  ArrowRight
} from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { CuelyLogo } from '@/components/ui/CuelyLogo';

interface NavbarProps {
  scrolled?: boolean;
}

export function Navbar({ scrolled: externalScrolled }: NavbarProps) {
  const [internalScrolled, setInternalScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setInternalScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isScrolled = externalScrolled !== undefined ? externalScrolled : internalScrolled;

  const navLinks = [
    { name: 'Features', href: '#features', icon: Zap },
    { name: 'How it works', href: '#how-it-works', icon: Layers },
    { name: 'Testimonials', href: '#testimonials', icon: MessageSquareQuote },
    { name: 'FAQ', href: '#faq', icon: HelpCircle },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300">
      <nav
        className={`w-full transition-all duration-300 ${
          isScrolled || mobileMenuOpen
            ? 'bg-[var(--nav-bg)] backdrop-blur-xl border-b border-[var(--border-color)] py-3.5 shadow-xl'
            : 'bg-transparent py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Logo & Brand */}
          <Link 
            href="/" 
            className="flex items-center gap-3 group focus:outline-none focus:ring-2 focus:ring-blue-500/50 rounded-xl p-1"
          >
            <div className="relative">
              <CuelyLogo size="sm" showGlow className="group-hover:scale-105" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[var(--bg-primary)] animate-pulse" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-bold tracking-tight text-[var(--text-primary)] group-hover:text-blue-500 transition-colors">
                  Cuely
                </span>
                <span className="text-[10px] font-semibold tracking-wider px-1.5 py-0.5 rounded-full bg-[var(--badge-bg)] text-[var(--badge-text)] border border-[var(--badge-border)] uppercase">
                  v2.0
                </span>
              </div>
              <span className="text-[10px] text-[var(--text-muted)] font-medium hidden sm:block">
                Queue Management System
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1 bg-[var(--glass-bg)] p-1.5 rounded-full border border-[var(--border-color)] backdrop-blur-md">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="px-4 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-color)] rounded-full transition-all duration-200"
              >
                {link.name}
              </a>
            ))}
          </div>

          {/* Right Section: Theme Toggle, Auth & Mobile Menu Toggle */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle Button */}
            <div className="hidden sm:flex items-center">
              <ThemeToggle className="border border-[var(--border-color)] bg-[var(--glass-bg)] hover:bg-[var(--border-color)] text-[var(--text-primary)]" />
            </div>

            {/* Desktop Login */}
            <Link
              href="/login"
              className="hidden md:flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-3.5 py-2 rounded-full hover:bg-[var(--glass-bg)] transition-all"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Log in</span>
            </Link>

            {/* Desktop CTA Button */}
            <button className="hidden sm:flex shine-btn bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] px-5 py-2 rounded-full text-xs font-extrabold tracking-wide hover:scale-[1.02] active:scale-[0.98] transition-all items-center gap-1.5 shadow-md shadow-black/5">
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden flex items-center justify-center w-10 h-10 rounded-xl bg-[var(--glass-bg)] border border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--border-color)] focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 text-blue-500 transition-transform rotate-90 duration-200" />
              ) : (
                <Menu className="w-5 h-5 transition-transform duration-200" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer / Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden px-4 pt-3 pb-6 border-t border-[var(--border-color)] mt-3 space-y-4 animate-in fade-in slide-in-from-top-4 duration-200 bg-[var(--nav-bg)] backdrop-blur-2xl">
            <div className="grid gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <a
                    key={link.name}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--glass-bg)] rounded-xl transition-all"
                  >
                    <div className="p-2 rounded-lg bg-[var(--badge-bg)] text-blue-500">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span>{link.name}</span>
                  </a>
                );
              })}
            </div>

            <div className="pt-3 border-t border-[var(--border-color)] flex flex-col gap-3">
              <div className="flex items-center justify-between px-2 py-1">
                <span className="text-xs font-medium text-[var(--text-muted)]">Appearance</span>
                <ThemeToggle className="border border-[var(--border-color)] bg-[var(--glass-bg)] text-[var(--text-primary)]" />
              </div>

              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl border border-[var(--border-color)] bg-[var(--glass-bg)] text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--border-color)] transition-colors"
              >
                <LogIn className="w-4 h-4" />
                <span>Log in to Dashboard</span>
              </Link>

              <button
                onClick={() => setMobileMenuOpen(false)}
                className="shine-btn flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-bold shadow-lg shadow-blue-500/25 hover:opacity-95 transition-opacity"
              >
                <Sparkles className="w-4 h-4" />
                <span>Get Started Free</span>
              </button>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}

export default Navbar;
