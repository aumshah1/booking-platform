'use client';

import React from 'react';
import { SeatData } from './Seat';
import { motion, AnimatePresence } from 'framer-motion';

interface SeatTooltipProps {
  seat: SeatData | null;
  position: { x: number; y: number };
}

export default function SeatTooltip({ seat, position }: SeatTooltipProps) {
  if (!seat) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        style={{ top: position.y - 120, left: position.x - 100 }}
        className="absolute z-50 w-[200px] bg-[#0a0a1a] border border-white/20 rounded-xl shadow-2xl p-4 text-white pointer-events-none"
      >
        <div className="flex justify-between items-start mb-2">
          <span className="text-xl font-bold">{seat.seat_number}</span>
          <span className="text-xs font-mono bg-blue-600/30 text-blue-400 px-2 py-1 rounded">
            ${seat.price.toFixed(2)}
          </span>
        </div>
        
        <p className="text-sm text-slate-300 mb-2">{seat.seat_class}</p>

        <div className="flex flex-wrap gap-2 mt-3">
          {seat.is_window && <span className="text-[10px] uppercase tracking-wider bg-white/10 px-2 py-1 rounded">Window</span>}
          {seat.is_aisle && <span className="text-[10px] uppercase tracking-wider bg-white/10 px-2 py-1 rounded">Aisle</span>}
          {seat.status === 'EXIT_ROW' && <span className="text-[10px] uppercase tracking-wider bg-yellow-500/20 text-yellow-500 px-2 py-1 rounded">Exit Row</span>}
          {seat.status === 'AVAILABLE' && <span className="text-[10px] uppercase tracking-wider bg-emerald-500/20 text-emerald-500 px-2 py-1 rounded">Available</span>}
          {seat.status === 'BOOKED' && <span className="text-[10px] uppercase tracking-wider bg-red-500/20 text-red-500 px-2 py-1 rounded">Occupied</span>}
          {seat.status === 'BLOCKED' && <span className="text-[10px] uppercase tracking-wider bg-slate-500/20 text-slate-300 px-2 py-1 rounded">Blocked</span>}
        </div>
        
        {/* Pointer Triangle */}
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-[#0a0a1a] border-b border-r border-white/20 rotate-45"></div>
      </motion.div>
    </AnimatePresence>
  );
}
