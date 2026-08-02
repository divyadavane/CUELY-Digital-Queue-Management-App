"use client";

import React, { useState } from "react";

export function FaqSection() {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const faqs = [
    { q: "Do customers need to download an app?", a: "No! Cuely works entirely through the browser. Customers simply scan a QR code or click a link to join the queue, check their status, and receive SMS updates." },
    { q: "How long does setup take?", a: "Less than 5 minutes. You can create your first queue, customize your branding, and start accepting customers immediately." },
    { q: "Can I manage multiple departments?", a: "Yes. Our enterprise plan supports unlimited queues and departments, allowing you to route customers dynamically based on their needs." },
    { q: "Is Cuely HIPAA compliant?", a: "Yes, our healthcare offering includes a BAA and full HIPAA compliance, ensuring patient data is always encrypted and protected." },
  ];

  return (
    <div id="faq" className="py-24 bg-[var(--stat-strip-bg)] border-y border-[var(--border-color)] relative">
      <div className="max-w-3xl mx-auto px-6">
        <h2 className="text-3xl md:text-5xl font-bold mb-12 text-center text-[var(--text-primary)]">Got questions?</h2>
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div 
              key={i} 
              className={`premium-glass rounded-xl overflow-hidden transition-all duration-300 ${
                expandedFaq === i ? "border-blue-500/30 shadow-[0_4px_20px_rgba(59,130,246,0.1)]" : "border-transparent"
              }`}
            >
              <button 
                onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                className={`w-full px-6 py-5 flex items-center justify-between font-bold text-left transition-colors ${
                  expandedFaq === i ? "text-blue-500" : "text-[var(--text-primary)] hover:bg-[var(--border-color)]"
                }`}
              >
                {faq.q}
                <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all duration-300 ${
                  expandedFaq === i ? "rotate-[135deg] border-blue-500 bg-blue-500/10" : "border-[var(--border-color)]"
                }`}>
                  <div className={`w-3 h-px absolute transition-colors duration-300 ${expandedFaq === i ? 'bg-blue-500' : 'bg-[var(--text-primary)]'}`}></div>
                  <div className={`w-px h-3 absolute transition-colors duration-300 ${expandedFaq === i ? 'bg-blue-500' : 'bg-[var(--text-primary)]'}`}></div>
                </div>
              </button>
              <div 
                className={`px-6 overflow-hidden transition-all duration-500 ease-in-out ${
                  expandedFaq === i ? "max-h-[200px] pb-5 opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <p className="text-[var(--text-secondary)] leading-relaxed">{faq.a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
