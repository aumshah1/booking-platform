'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, ChevronDown, Phone, Video, MoreVertical } from 'lucide-react';
import api from '@/lib/axios';
import { useAuth } from '@/contexts/AuthContext';

// ─── Types ─────────────────────────────────────────────────────────────────
interface Msg {
  id: string;
  from: 'bot' | 'user';
  text: string;
  time: string;
  quickReplies?: string[];
}

const WA_NUMBER = '918980647309';
const WA_LINK = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent('Hi BlueWings! I need help with my booking 🛫')}`;

// ─── Helpers ────────────────────────────────────────────────────────────────
const now = () =>
  new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

const botMsg = (text: string, quickReplies?: string[]): Msg => ({
  id: crypto.randomUUID(),
  from: 'bot',
  text,
  time: now(),
  quickReplies,
});

const userMsg = (text: string): Msg => ({
  id: crypto.randomUUID(),
  from: 'user',
  text,
  time: now(),
});

// ─── Welcome message ─────────────────────────────────────────────────────────
const WELCOME: Msg = botMsg(
  `👋 Hello! Welcome to *BlueWings Connect* official WhatsApp Support.\n\nI'm your AI assistant. How can I help you today?`,
  [
    '1️⃣ Search Flights',
    '2️⃣ My Bookings',
    '3️⃣ Flight Status',
    '4️⃣ Cancel Booking',
    '5️⃣ Boarding Pass',
    '🎧 Talk to Agent',
  ]
);

// ─── Render WhatsApp-style formatted text ────────────────────────────────────
function WaBubbleText({ text }: { text: string }) {
  // Convert *bold*, _italic_, and \n
  const lines = text.split('\n');
  return (
    <span className="whitespace-pre-wrap text-sm leading-relaxed">
      {lines.map((line, li) => (
        <span key={li}>
          {line.split(/(\*[^*]+\*|_[^_]+_)/g).map((chunk, ci) => {
            if (chunk.startsWith('*') && chunk.endsWith('*'))
              return <strong key={ci}>{chunk.slice(1, -1)}</strong>;
            if (chunk.startsWith('_') && chunk.endsWith('_'))
              return <em key={ci}>{chunk.slice(1, -1)}</em>;
            return chunk;
          })}
          {li < lines.length - 1 && <br />}
        </span>
      ))}
    </span>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
export default function WhatsAppWidget() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [pulse, setPulse] = useState(true);
  const [showTooltip, setShowTooltip] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  // auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  // Hide tooltip after 6s
  useEffect(() => {
    const t = setTimeout(() => setShowTooltip(false), 6000);
    return () => clearTimeout(t);
  }, []);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    setPulse(false);
    setShowTooltip(false);

    // Add user bubble
    setMessages((prev) => [...prev, userMsg(text)]);
    setInput('');
    setTyping(true);

    try {
      let reply: Msg;

      if (user) {
        // Authenticated → use real backend SkyTalk API
        const res = await api.post('/api/chat', { message: text });
        const aiText: string = res.data.reply?.message || res.data.reply || "I'm sorry, I couldn't process that.";
        reply = buildSmartReply(text, aiText);
      } else {
        // Not logged in → pattern-match locally
        reply = buildLocalReply(text);
      }

      await new Promise((r) => setTimeout(r, 900 + Math.random() * 600));
      setMessages((prev) => [...prev, reply]);
    } catch {
      setMessages((prev) => [
        ...prev,
        botMsg(
          "⚠️ I'm having trouble connecting. Please try again or visit our website.",
          ['🔄 Try Again', '🌐 Open Website', '📞 Call Support']
        ),
      ]);
    } finally {
      setTyping(false);
    }
  };

  return (
    <>
      {/* ── Floating Button ─────────────────────────────────────────────── */}
      <div className="fixed bottom-24 right-4 z-50 flex flex-col items-end gap-1.5">
        {/* Tooltip */}
        <AnimatePresence>
          {showTooltip && !open && (
            <motion.div
              initial={{ opacity: 0, x: 8, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 8, scale: 0.9 }}
              className="relative bg-white dark:bg-zinc-800 shadow-xl border border-zinc-100 dark:border-zinc-700 rounded-2xl rounded-br-sm px-4 py-2.5 text-sm font-medium text-zinc-800 dark:text-white whitespace-nowrap max-w-[220px] cursor-pointer"
              onClick={() => { setOpen(true); setShowTooltip(false); }}
            >
              💬 Chat with us on WhatsApp!
              <p className="text-[11px] text-zinc-400 mt-0.5">Tap to start conversation</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Button */}
        <div className="relative">
          {pulse && (
            <>
              <span className="absolute inset-0 rounded-full bg-[#25D366] opacity-30 animate-ping" />
              <span className="absolute inset-0 rounded-full bg-[#25D366] opacity-20 animate-ping [animation-delay:0.4s]" />
            </>
          )}
          <motion.button
            onClick={() => { setOpen(true); setPulse(false); setShowTooltip(false); }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Open WhatsApp Chat"
            className="relative w-14 h-14 rounded-full shadow-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)' }}
          >
            <svg viewBox="0 0 32 32" fill="white" className="w-8 h-8">
              <path d="M16.002 3C9.373 3 4 8.373 4 15.002c0 2.185.594 4.232 1.629 5.996L4 29l8.23-1.607A11.96 11.96 0 0 0 16.002 28c6.628 0 12-5.373 12-11.998S22.63 3 16.002 3Zm6.916 16.788c-.29.812-1.685 1.55-2.31 1.608-.625.058-1.19.287-4.023-.84-3.386-1.34-5.558-4.813-5.726-5.033-.168-.219-1.38-1.835-1.38-3.502s.873-2.487 1.183-2.825c.31-.339.677-.424.903-.424.226 0 .452.002.65.01.208.01.488-.08.764.582.29.694 1.006 2.388 1.094 2.562.088.174.146.378.03.607-.116.228-.174.371-.339.574-.165.202-.347.452-.495.607-.165.172-.336.358-.145.703.192.345.849 1.398 1.82 2.264 1.25 1.114 2.304 1.46 2.65 1.627.347.167.55.14.75-.084.201-.224.858-.997 1.087-1.342.229-.344.458-.287.77-.172.31.115 1.98.935 2.32 1.104.338.169.564.253.647.392.083.14.083.817-.207 1.63Z" />
            </svg>
          </motion.button>
        </div>
        <span className="text-[10px] font-bold text-[#25D366] tracking-wider uppercase">WhatsApp</span>
      </div>

      {/* ── Chat Modal ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 60, scale: 0.95 }}
            transition={{ type: 'spring', damping: 22, stiffness: 260 }}
            className="fixed bottom-4 right-4 z-50 w-[360px] max-w-[calc(100vw-2rem)] rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            style={{ height: '580px', maxHeight: 'calc(100vh - 6rem)' }}
          >
            {/* ── Header (WhatsApp green) ────────────────────────────────── */}
            <div
              className="flex items-center gap-3 px-4 py-3 shrink-0"
              style={{ background: 'linear-gradient(135deg, #075E54 0%, #128C7E 100%)' }}
            >
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white text-lg font-bold shrink-0">
                ✈️
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm leading-tight truncate">BlueWings Connect</p>
                <p className="text-green-200 text-[11px] leading-tight">
                  {typing ? 'typing...' : '🟢 AI Support · Always online'}
                </p>
              </div>
              {/* Header actions */}
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={WA_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Open in WhatsApp app"
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                >
                  <svg viewBox="0 0 32 32" fill="white" className="w-4 h-4">
                    <path d="M16.002 3C9.373 3 4 8.373 4 15.002c0 2.185.594 4.232 1.629 5.996L4 29l8.23-1.607A11.96 11.96 0 0 0 16.002 28c6.628 0 12-5.373 12-11.998S22.63 3 16.002 3Zm6.916 16.788c-.29.812-1.685 1.55-2.31 1.608-.625.058-1.19.287-4.023-.84-3.386-1.34-5.558-4.813-5.726-5.033-.168-.219-1.38-1.835-1.38-3.502s.873-2.487 1.183-2.825c.31-.339.677-.424.903-.424.226 0 .452.002.65.01.208.01.488-.08.764.582.29.694 1.006 2.388 1.094 2.562.088.174.146.378.03.607-.116.228-.174.371-.339.574-.165.202-.347.452-.495.607-.165.172-.336.358-.145.703.192.345.849 1.398 1.82 2.264 1.25 1.114 2.304 1.46 2.65 1.627.347.167.55.14.75-.084.201-.224.858-.997 1.087-1.342.229-.344.458-.287.77-.172.31.115 1.98.935 2.32 1.104.338.169.564.253.647.392.083.14.083.817-.207 1.63Z" />
                  </svg>
                </a>
                <button
                  onClick={() => setOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* ── Messages area ──────────────────────────────────────────── */}
            <div
              className="flex-1 overflow-y-auto px-3 py-3 space-y-2"
              style={{
                background: `#E5DDD5 url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h60v60H0z' fill='%23e5ddd5'/%3E%3Cpath d='M30 30m-15 0a15 15 0 1 0 30 0a15 15 0 1 0-30 0' fill='none' stroke='%23d9d0c8' stroke-width='0.5' opacity='0.4'/%3E%3C/svg%3E")`
              }}
            >
              {/* Date stamp */}
              <div className="flex justify-center my-2">
                <span className="text-[11px] text-zinc-600 bg-white/70 px-3 py-0.5 rounded-full shadow-sm">
                  {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>

              {messages.map((msg) => (
                <div key={msg.id} className={`flex flex-col ${msg.from === 'user' ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`relative max-w-[82%] px-3 py-2 rounded-2xl shadow-sm ${
                      msg.from === 'user'
                        ? 'bg-[#DCF8C6] text-gray-800 rounded-tr-sm'
                        : 'bg-white text-gray-800 rounded-tl-sm'
                    }`}
                  >
                    <WaBubbleText text={msg.text} />
                    <p className={`text-[10px] mt-1 ${msg.from === 'user' ? 'text-right text-green-700' : 'text-zinc-400'}`}>
                      {msg.time}
                      {msg.from === 'user' && <span className="ml-1 text-blue-500">✓✓</span>}
                    </p>
                  </div>

                  {/* Quick reply chips */}
                  {msg.from === 'bot' && msg.quickReplies && (
                    <div className="flex flex-wrap gap-1.5 mt-2 max-w-[82%]">
                      {msg.quickReplies.map((qr) => (
                        <button
                          key={qr}
                          onClick={() => sendMessage(qr)}
                          className="px-3 py-1.5 bg-white hover:bg-[#075E54] hover:text-white text-[#075E54] border border-[#075E54]/30 hover:border-[#075E54] rounded-full text-xs font-medium shadow-sm transition-all duration-200 active:scale-95"
                        >
                          {qr}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Typing indicator */}
              {typing && (
                <div className="flex items-start">
                  <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                    <div className="flex gap-1 items-center h-4">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          className="w-2 h-2 rounded-full bg-zinc-400"
                          animate={{ y: [0, -4, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* ── Input area ─────────────────────────────────────────────── */}
            <div className="shrink-0 px-3 py-2 bg-[#F0F0F0] flex items-center gap-2">
              <div className="flex-1 bg-white rounded-full px-4 py-2 flex items-center gap-2 shadow-sm">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
                  placeholder="Type a message..."
                  className="flex-1 text-sm bg-transparent outline-none text-gray-800 placeholder:text-gray-400"
                />
              </div>
              <motion.button
                onClick={() => sendMessage(input)}
                whileTap={{ scale: 0.92 }}
                disabled={!input.trim() || typing}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-colors disabled:opacity-50 shrink-0"
                style={{ background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)' }}
              >
                <Send className="w-4 h-4 text-white" />
              </motion.button>
            </div>

            {/* ── Footer ─────────────────────────────────────────────────── */}
            <div className="shrink-0 py-1.5 text-center bg-[#F0F0F0] border-t border-zinc-200">
              <p className="text-[10px] text-zinc-400">
                🔒 End-to-end encrypted · Powered by{' '}
                <span className="text-[#25D366] font-semibold">WhatsApp Business</span>
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Build smart reply from backend response + inject quick replies ───────────
function buildSmartReply(userMsg: string, aiText: string): Msg {
  const msg = userMsg.toLowerCase();

  // Determine relevant quick replies based on context
  let quickReplies: string[] | undefined;

  if (msg.includes('booking') || msg.includes('pnr') || msg.includes('trip')) {
    quickReplies = ['✈️ Search Flights', '❌ Cancel Booking', '💺 Change Seat', '🏠 Main Menu'];
  } else if (msg.includes('cancel')) {
    quickReplies = ['📋 My Bookings', '📞 Talk to Agent', '🏠 Main Menu'];
  } else if (msg.includes('flight') || msg.includes('search')) {
    quickReplies = ['📋 My Bookings', '🎫 Boarding Pass', '🏠 Main Menu'];
  } else if (msg.includes('seat') || msg.includes('boarding')) {
    quickReplies = ['📋 My Bookings', '❌ Cancel Booking', '🏠 Main Menu'];
  } else {
    quickReplies = ['📋 My Bookings', '✈️ Search Flights', '🎫 Boarding Pass', '🏠 Main Menu'];
  }

  return botMsg(aiText, quickReplies);
}

// ─── Local (no-auth) pattern-matched replies ─────────────────────────────────
function buildLocalReply(input: string): Msg {
  const msg = input.toLowerCase();

  if (msg.includes('main menu') || msg.includes('menu') || msg.includes('🏠')) {
    return botMsg(
      `👋 *Main Menu*\n\nWhat would you like to do?`,
      ['1️⃣ Search Flights', '2️⃣ My Bookings', '3️⃣ Flight Status', '4️⃣ Cancel Booking', '5️⃣ Boarding Pass', '🎧 Talk to Agent']
    );
  }
  if (msg.includes('search') || msg.includes('1️⃣') || msg.includes('book')) {
    return botMsg(
      `✈️ *Search Flights*\n\nTo search and book flights, please visit our website:\n\n🌐 *bluewingsconnect.com/flights*\n\nOr log in to get full AI-powered booking assistance here!`,
      ['🌐 Open Flight Search', '📋 My Bookings', '🏠 Main Menu']
    );
  }
  if (msg.includes('booking') || msg.includes('2️⃣') || msg.includes('trip')) {
    return botMsg(
      `📋 *My Bookings*\n\nTo view your bookings, please log in to your account. Once logged in, I can fetch your booking details instantly!\n\n🔐 *Log in to see:*\n• Your PNR & booking status\n• Flight details\n• Passenger info`,
      ['🔐 Login to Website', '🏠 Main Menu']
    );
  }
  if (msg.includes('status') || msg.includes('3️⃣') || msg.includes('delay')) {
    return botMsg(
      `🕐 *Flight Status*\n\nFor live flight status updates:\n\n📱 Log in to our app for real-time tracking, or share your PNR number here and I'll help you out!\n\n_Your PNR is the 6-digit code on your booking confirmation._`,
      ['📋 My Bookings', '🌐 Open Website', '🏠 Main Menu']
    );
  }
  if (msg.includes('cancel') || msg.includes('4️⃣')) {
    return botMsg(
      `❌ *Cancel Booking*\n\n*Refund Policy:*\n• Cancelled 24hrs+ before departure → Full refund ✅\n• Cancelled within 24hrs → ₹1,000 fee applies ⚠️\n• No-shows → Non-refundable ❌\n\nTo cancel, please log in to your account or call us.`,
      ['📞 Call Support', '🌐 Open Website', '🏠 Main Menu']
    );
  }
  if (msg.includes('boarding') || msg.includes('5️⃣') || msg.includes('pass')) {
    return botMsg(
      `🎫 *Boarding Pass*\n\nYour boarding pass is available in the app after booking confirmation!\n\n📲 Download steps:\n1. Go to *My Trips*\n2. Select your booking\n3. Tap *Download PDF*\n\nYou can also show the QR code on screen at the airport.`,
      ['🌐 Go to My Trips', '📋 My Bookings', '🏠 Main Menu']
    );
  }
  if (msg.includes('agent') || msg.includes('human') || msg.includes('🎧')) {
    return botMsg(
      `🎧 *Live Agent Support*\n\nOur team is available 24/7!\n\n📞 *Phone:* +91 8980647309\n✉️ *Email:* support@bluewingsconnect.com\n⏰ *Hours:* 24 hours, 7 days a week\n\nAverage wait time: *< 2 minutes*`,
      ['📞 Call Now', '🏠 Main Menu']
    );
  }
  if (msg.includes('refund') || msg.includes('baggage') || msg.includes('luggage')) {
    return botMsg(
      `ℹ️ *Baggage Policy*\n\n🧳 *Economy Class:*\n• 1 carry-on (7kg)\n• 1 checked bag (23kg)\n\n💼 *Business Class:*\n• 2 carry-ons (14kg)\n• 2 checked bags (32kg each)\n\nExtra bags can be added during booking.`,
      ['✈️ Search Flights', '📋 My Bookings', '🏠 Main Menu']
    );
  }
  if (msg.includes('open website') || msg.includes('🌐')) {
    window.open('/', '_blank');
    return botMsg(`🌐 Opening BlueWings Connect website...`, ['🏠 Main Menu']);
  }
  if (msg.includes('call') || msg.includes('📞')) {
    window.open('tel:+918980647309');
    return botMsg(`📞 Calling our support team...\n\n+91 8980647309`, ['🏠 Main Menu']);
  }

  // Fallback
  return botMsg(
    `🤖 I understand you're asking about: *"${input}"*\n\nI can help you with flight bookings, cancellations, boarding passes, and more. What would you like to do?`,
    ['1️⃣ Search Flights', '2️⃣ My Bookings', '4️⃣ Cancel Booking', '🎧 Talk to Agent']
  );
}
