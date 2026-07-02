'use client';

import React from 'react';
import { motion } from 'framer-motion';

export interface SeatData {
  id: string;
  flight_id: string;
  seat_number: string;
  seat_class: string;
  price: number;
  status: 'AVAILABLE' | 'BOOKED' | 'SELECTED' | 'BLOCKED' | 'EXIT_ROW' | 'SELECTED_OTHER';
  is_window: boolean;
  is_aisle: boolean;
}

interface SeatProps {
  seat: SeatData;
  isSelected: boolean;
  onSelect: (seat: SeatData) => void;
  onMouseEnter: (seat: SeatData, e: React.MouseEvent) => void;
  onMouseLeave: () => void;
}

export default function Seat({ seat, isSelected, onSelect, onMouseEnter, onMouseLeave }: SeatProps) {
  const isAvailable = seat.status === 'AVAILABLE' || seat.status === 'EXIT_ROW';
  
  let bgColor = 'bg-blue-500'; // Available
  if (seat.status === 'BOOKED') bgColor = 'bg-red-500 opacity-50 cursor-not-allowed';
  if (seat.status === 'BLOCKED') bgColor = 'bg-slate-800 cursor-not-allowed';
  if (seat.status === 'EXIT_ROW') bgColor = 'bg-yellow-500';
  if (seat.status === 'SELECTED_OTHER') bgColor = 'bg-emerald-600/60';
  if (isSelected) bgColor = 'bg-emerald-500';

  return (
    <motion.button
      type="button"
      whileHover={isAvailable ? { scale: 1.15, y: -2 } : {}}
      whileTap={isAvailable ? { scale: 0.9 } : {}}
      onClick={() => isAvailable && onSelect(seat)}
      onMouseEnter={(e) => onMouseEnter(seat, e)}
      onMouseLeave={onMouseLeave}
      className={`w-10 h-10 md:w-12 md:h-12 rounded-t-xl rounded-b-md flex items-center justify-center font-bold text-xs md:text-sm text-white shadow-sm transition-colors border-b-4 border-black/30 ${bgColor}`}
      disabled={seat.status === 'BOOKED' || seat.status === 'BLOCKED'}
    >
      {seat.seat_number}
    </motion.button>
  );
}
