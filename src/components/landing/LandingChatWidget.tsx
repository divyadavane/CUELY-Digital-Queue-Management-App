'use client';

import { useState, useRef, useEffect } from 'react';
import { useChat } from '@ai-sdk/react';
import { MessageSquare, X, Send, Bot, Activity, Users } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { createClient } from '@/lib/supabase';

export function LandingChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [sessionId] = useState(() => {
    return 'session_' + Math.random().toString(36).substring(2, 15);
  });
  
  const [input, setInput] = useState('');
  
  const { messages, append, isLoading } = useChat({
    api: '/api/agent/landing',
    body: {
      sessionId
    },
    onError: (error: any) => {
      console.error("Chat error:", error);
    }
  } as any) as any;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;
    
    append({ role: 'user', content: input });
    setInput('');
  };

  const salesQuickReplies = [
    "How does the digital queue work?",
    "What are the pricing plans?",
    "Can I use this for multiple locations?"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(scrollToBottom, 100);
    }
  }, [messages, isLoading, isOpen]);

  const handleQuickReply = (text: string) => {
    append({ role: 'user', content: text });
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex justify-end items-end">
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            key="fab"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center shadow-[0_8px_24px_-4px_rgba(37,99,235,0.6)] text-white absolute bottom-0 right-0"
            aria-label="Open support chat"
          >
            <Bot className="w-6 h-6" />
          </motion.button>
        )}
        {isOpen && (
          <motion.div
            key="panel"
            initial={{ scale: 0.9, opacity: 0, y: 20, originX: 1, originY: 1 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="w-[90vw] sm:w-[380px] h-[80vh] max-h-[560px] relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-zinc-900 to-zinc-950 shadow-[0_24px_64px_-16px_rgba(0,0,0,0.5)] origin-bottom-right"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white">
                  <Bot className="size-4 text-white" />
                </div>
                <div>
                  <span className="font-bold tracking-tight text-white">Cuely Assistant</span>
                  <p className="text-xs text-white/40">Ask about our digital queue platform</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg transition-colors text-white/60 hover:bg-white/10 hover:text-white"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 space-y-4 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              {/* Initial Welcome & Quick Replies */}
              {messages.length === 0 && (
                <div className="flex w-full justify-start">
                  <div className="flex items-end gap-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-600">
                      <Bot className="size-4 text-white" />
                    </div>
                    <div className="flex flex-col gap-3">
                      <motion.div 
                        layout
                        className="max-w-full rounded-2xl px-4 py-2.5 text-sm leading-relaxed rounded-tl-md border border-white/10 bg-zinc-800/90 text-zinc-100 backdrop-blur-sm shadow-[0_4px_12px_-2px_rgba(0,0,0,0.3)]"
                      >
                        Hello! How can I help you learn about Cuely today?
                      </motion.div>
                      
                      {messages.length === 0 && (
                        <div className="flex flex-col gap-2 mt-4">
                          <p className="text-xs font-semibold text-blue-200/70 uppercase tracking-wider mb-1">Suggested Questions</p>
                          {salesQuickReplies.map((reply, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleQuickReply(reply)}
                              className="text-left text-sm p-3 rounded-xl bg-blue-900/40 hover:bg-blue-800/60 border border-blue-500/20 text-blue-100 transition-all hover:-translate-y-0.5"
                            >
                              {reply}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Message List */}
              {messages.map((m: any) => {
                const isUser = m.role === 'user';
                return (
                  <motion.div 
                    key={m.id} 
                    initial={{ opacity: 0, y: 12, scale: 0.96, x: isUser ? 20 : -20 }}
                    animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex items-end gap-2 ${isUser ? 'flex-row-reverse' : ''}`}>
                      {!isUser && (
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-600">
                          <Bot className="size-4 text-white" />
                        </div>
                      )}
                      
                      <motion.div 
                        layout
                        className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                          isUser 
                            ? 'rounded-tr-md bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-[0_8px_24px_-4px_rgba(37,99,235,0.4)]'
                            : 'rounded-tl-md border border-white/10 bg-zinc-800/90 text-zinc-100 backdrop-blur-sm shadow-[0_4px_12px_-2px_rgba(0,0,0,0.3)]'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{m.content}</p>
                        
                        {/* Tool Calls Indicator */}
                        {m.toolInvocations && m.toolInvocations.length > 0 && (
                          <div className={`mt-2 text-xs flex flex-col gap-1 ${isUser ? 'text-white/80' : 'text-white/40'}`}>
                            {m.toolInvocations.map((tool: any) => (
                              <div key={tool.toolCallId} className="flex items-center gap-1 italic">
                                <Activity className="w-3 h-3 animate-pulse" /> checking system...
                              </div>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    </div>
                  </motion.div>
                );
              })}
              
              {/* Typing Indicator */}
              {isLoading && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
                <div className="flex w-full justify-start">
                  <div className="flex items-end gap-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-600">
                      <Bot className="size-4 text-white" />
                    </div>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="inline-flex items-center gap-1 rounded-2xl rounded-tl-md border border-white/10 bg-zinc-800/90 px-4 py-3 backdrop-blur-sm shadow-[0_4px_12px_-2px_rgba(0,0,0,0.3)]"
                    >
                      {[0, 1, 2].map((i) => (
                        <motion.span
                          key={i}
                          className="h-2 w-2 rounded-full bg-white/60"
                          animate={{ opacity: [0.4, 1, 0.4], y: [0, -4, 0] }}
                          transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
                        />
                      ))}
                    </motion.div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <div className="p-3 border-t border-white/5 shrink-0 flex flex-col gap-2">
              <a 
                href="#"
                onClick={(e) => { e.preventDefault(); alert("Redirecting to front desk staff..."); }}
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors text-center w-full block py-1 font-medium"
              >
                Talk to staff instead
              </a>
              <form onSubmit={handleSubmit} className="flex items-center gap-2 rounded-xl border border-white/10 bg-zinc-800/50 px-4 py-2 backdrop-blur-sm focus-within:border-white/20 focus-within:bg-zinc-800/70">
                <input
                  value={input}
                  onChange={handleInputChange}
                  placeholder="Ask a question..."
                  disabled={isLoading}
                  className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/30 disabled:cursor-not-allowed"
                />
                <motion.button 
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  type="submit" 
                  disabled={!input?.trim() || isLoading}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                    input?.trim() ? 'bg-blue-600 text-white hover:bg-blue-500' : 'bg-white/5 text-white/30'
                  }`}
                >
                  <Send className="size-4" />
                </motion.button>
              </form>
              <div className="text-center text-[10px] text-white/40 mt-1">
                Powered by Cuely
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
