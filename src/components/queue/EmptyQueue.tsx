"use client";

export default function EmptyQueue() {
  return (
    <div className="bg-surface rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
      <div className="w-20 h-20 mx-auto mb-6 bg-bg rounded-2xl flex items-center justify-center">
        <svg className="w-10 h-10 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-text-heading mb-2">
        No one is waiting
      </h3>
      <p className="text-sm text-text-muted max-w-sm mx-auto">
        The queue is empty right now. New customers will appear here automatically when they scan the QR code and join.
      </p>
    </div>
  );
}
