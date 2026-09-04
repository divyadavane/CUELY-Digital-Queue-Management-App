'use client';

import React from 'react';
import Link from 'next/link';
import { Globe, Share2, Mail, MessageSquare } from 'lucide-react';
import { LANDING_CONFIG, FOOTER_COLUMNS } from '@/lib/landing-data';
import { CuelyLogo } from '@/components/ui/CuelyLogo';

export function FooterSection() {
  return (
    <footer className="bg-[var(--footer-bg)] border-t border-[var(--border-color)] text-[var(--text-secondary)] pt-16 pb-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-[var(--border-color)]">
          {/* Brand Info */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-3 group mb-4">
              <CuelyLogo size="md" showGlow className="group-hover:scale-105" />
              <span className="text-2xl font-black tracking-tight text-[var(--text-primary)] font-sans">
                {LANDING_CONFIG.brandName}
              </span>
            </Link>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed max-w-sm">
              {LANDING_CONFIG.brandTagline}. Streamline visitor arrivals, automate ticket dispatch, and reduce wait times.
            </p>

            {/* Social Icons */}
            <div className="flex items-center gap-3 mt-6">
              {[
                { icon: Globe, href: '#', label: 'Website' },
                { icon: Share2, href: '#', label: 'Social' },
                { icon: MessageSquare, href: '#', label: 'Community' },
                { icon: Mail, href: '#', label: 'Contact' },
              ].map((social, i) => (
                <a
                  key={i}
                  href={social.href}
                  aria-label={social.label}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-blue-500/30 transition-colors shadow-sm"
                  data-cursor="hover"
                >
                  <social.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Navigation Columns */}
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-bold uppercase tracking-wider text-[var(--text-primary)] mb-4">
                {col.title}
              </h4>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                      data-cursor="hover"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Copyright & Status */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--text-muted)]">
          <p>© {new Date().getFullYear()} {LANDING_CONFIG.brandName} Inc. All rights reserved.</p>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[var(--text-secondary)]">All Systems Operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
