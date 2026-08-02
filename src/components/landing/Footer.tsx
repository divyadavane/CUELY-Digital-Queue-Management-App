"use client";

import Link from "next/link";
import { BackgroundBlobs } from "./BackgroundBlobs";

export function Footer() {
  return (
    <footer className="relative bg-background pt-24 pb-12 px-6 overflow-hidden border-t border-border/50">
      {/* Background Blobs continuing into footer */}
      <div className="absolute inset-0 opacity-50 rotate-180">
        <BackgroundBlobs />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="flex flex-col items-center text-center mb-16">
          <h2 className="text-5xl md:text-7xl font-accent text-[var(--color-accent-serif)] mb-6">
            Cuely
          </h2>
          <p className="text-muted-foreground font-sans max-w-md">
            The premium queue management system that respects your customers' time.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16 border-t border-border/50 pt-16">
          <div>
            <h4 className="font-bold text-foreground mb-4 font-sans">Product</h4>
            <ul className="space-y-3">
              <li><Link href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</Link></li>
              <li><Link href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</Link></li>
              <li><Link href="#process" className="text-sm text-muted-foreground hover:text-foreground transition-colors">How it Works</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-foreground mb-4 font-sans">Resources</h4>
            <ul className="space-y-3">
              <li><Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Documentation</Link></li>
              <li><Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Help Center</Link></li>
              <li><Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Blog</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-foreground mb-4 font-sans">Company</h4>
            <ul className="space-y-3">
              <li><Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">About</Link></li>
              <li><Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Customers</Link></li>
              <li><Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-foreground mb-4 font-sans">Legal</h4>
            <ul className="space-y-3">
              <li><Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</Link></li>
              <li><Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-border/50">
          <p className="text-sm text-muted-foreground mb-4 md:mb-0">
            © {new Date().getFullYear()} Cuely. All rights reserved.
          </p>
          <div className="flex gap-4">
            <Link href="#" className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center text-foreground hover:text-accent hover:border-accent transition-colors">
              <span className="sr-only">Twitter</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
