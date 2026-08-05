'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';
import { FAQ_DATA } from '@/lib/landing-data';
import { RevealOnScroll } from '@/components/ui/RevealOnScroll';
import { GradientText } from '@/components/ui/GradientText';
import { CuelyLogo } from '@/components/ui/CuelyLogo';

export function FaqSection() {
  const [openId, setOpenId] = useState<string | null>('1');

  const toggleItem = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <section id="faq" className="py-24 relative overflow-hidden bg-[var(--bg-secondary)] border-y border-[var(--border-color)]">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <RevealOnScroll className="text-center mb-16">
          <div className="inline-flex items-center gap-2.5 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs font-semibold text-blue-400 mb-4 shadow-sm">
            <CuelyLogo size="xs" showGlow />
            <span>Got Questions?</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Frequently Asked <GradientText>Questions</GradientText>
          </h2>
          <p className="mt-4 text-lg text-[var(--text-secondary)]">
            Everything you need to know about setting up Cuely in your organization.
          </p>
        </RevealOnScroll>

        <RevealOnScroll stagger className="space-y-4">
          {FAQ_DATA.map((faq) => {
            const isOpen = openId === faq.id;
            return (
              <div
                key={faq.id}
                className="overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] backdrop-blur-md transition-colors duration-200"
              >
                <button
                  onClick={() => toggleItem(faq.id)}
                  className="flex w-full items-center justify-between p-6 text-left cursor-pointer"
                  data-cursor="hover"
                >
                  <span className="text-lg font-bold text-white pr-4">
                    {faq.question}
                  </span>
                  <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/5 text-white border border-white/10"
                  >
                    {isOpen ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  </motion.div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <div className="px-6 pb-6 pt-0 text-sm text-[var(--text-secondary)] leading-relaxed border-t border-white/5 mt-2 pt-4">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </RevealOnScroll>
      </div>
    </section>
  );
}
