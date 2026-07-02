'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Loader2, Bot, User, ChevronDown } from 'lucide-react';
import api from '@/lib/axios';
import { useAuth } from '@/contexts/AuthContext';
import { usePathname } from 'next/navigation';
import ReactMarkdown from 'react-markdown';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  message: string;
  created_at?: string;
}

const SUGGESTED_PROMPTS = [
  "Show my bookings",
  "Flight status",
  "How to cancel a booking?",
  "Where is my boarding pass?",
  "Refund policy"
];

export default function AIChatWidget() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Only show on passenger portal, hide on admin
  const isHidden = !user || pathname.startsWith('/admin');

  useEffect(() => {
    if (isOpen && user) {
      loadHistory();
    }
  }, [isOpen, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadHistory = async () => {
    try {
      const res = await api.get('/api/chat');
      if (res.data.messages && res.data.messages.length > 0) {
        setMessages(res.data.messages);
      } else {
        setMessages([{
          id: 'welcome',
          sender: 'ai',
          message: "Hi there! I'm your SkyTalk Assistant. How can I help you today?"
        }]);
      }
    } catch (err) {
      console.error('Failed to load chat history');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    
    const userMsg: ChatMessage = { id: Date.now().toString(), sender: 'user', message: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await api.post('/api/chat', { message: text });
      setMessages(prev => [...prev, res.data.reply]);
    } catch (err) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        sender: 'ai',
        message: 'Sorry, I am having trouble connecting right now.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (isHidden) return null;

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="bg-card border border-border shadow-2xl shadow-primary/20 rounded-2xl w-[350px] sm:w-[400px] h-[500px] mb-4 flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="bg-primary p-4 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-bold font-heading text-primary-foreground leading-tight">SkyTalk Assistant</h3>
                    <p className="text-primary-foreground/80 text-xs">Always here to help</p>
                  </div>
                </div>
                <button onClick={() => setIsOpen(false)} className="text-primary-foreground hover:bg-primary-foreground/20 p-1.5 rounded-lg transition-colors">
                  <ChevronDown className="w-5 h-5" />
                </button>
              </div>

              {/* Chat Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.sender === 'ai' && (
                      <div className="w-6 h-6 shrink-0 rounded-full bg-primary/20 flex items-center justify-center mt-1">
                        <Bot className="w-3 h-3 text-primary" />
                      </div>
                    )}
                    
                    <div className={`px-4 py-2 rounded-2xl max-w-[80%] text-sm shadow-sm ${
                      msg.sender === 'user' 
                        ? 'bg-primary text-primary-foreground rounded-tr-sm' 
                        : 'bg-muted border border-border text-foreground rounded-tl-sm'
                    }`}>
                      <div className={`prose prose-sm max-w-none prose-p:leading-relaxed ${msg.sender === 'user' ? 'prose-invert prose-a:text-primary-foreground' : 'prose-a:text-primary dark:prose-invert'}`}>
                        <ReactMarkdown>
                          {msg.message}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex gap-3 justify-start">
                    <div className="w-6 h-6 shrink-0 rounded-full bg-primary/20 flex items-center justify-center mt-1">
                      <Bot className="w-3 h-3 text-primary" />
                    </div>
                    <div className="px-4 py-3 rounded-2xl bg-muted border border-border rounded-tl-sm flex items-center gap-1 shadow-sm">
                      <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Suggested Prompts */}
              {messages.length < 3 && !isLoading && (
                <div className="p-2 bg-background border-t border-border flex gap-2 overflow-x-auto no-scrollbar shrink-0">
                  {SUGGESTED_PROMPTS.map(prompt => (
                    <button 
                      key={prompt}
                      onClick={() => sendMessage(prompt)}
                      className="shrink-0 px-3 py-1.5 bg-muted/50 hover:bg-muted border border-border rounded-full text-xs text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              )}

              {/* Input Area */}
              <div className="p-3 bg-background border-t border-border shrink-0">
                <form 
                  onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask about your bookings..."
                    className="flex-1 bg-muted border border-border rounded-full px-4 py-2 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    disabled={isLoading}
                  />
                  <button 
                    type="submit" 
                    disabled={!input.trim() || isLoading}
                    className="w-9 h-9 rounded-full bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:hover:bg-primary flex items-center justify-center transition-colors shrink-0 shadow-sm"
                  >
                    <Send className="w-4 h-4 text-primary-foreground ml-0.5" />
                  </button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(!isOpen)}
          className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-colors ${
            isOpen ? 'bg-muted text-muted-foreground hover:bg-muted/80 border border-border' : 'bg-primary text-primary-foreground shadow-primary/30'
          }`}
        >
          {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
        </motion.button>
      </div>
    </>
  );
}
