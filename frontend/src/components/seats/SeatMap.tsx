'use client';

import React, { useState } from 'react';
import Seat, { SeatData } from './Seat';
import SeatTooltip from './SeatTooltip';
import { motion } from 'framer-motion';

interface SeatMapProps {
  seats: SeatData[];
  cabinConfig: any[]; // e.g. [{ class: 'BUSINESS', layout: '2-2' }, ...]
  selectedSeat: SeatData | null;
  onSeatSelect: (seat: SeatData) => void;
}

export default function SeatMap({ seats, cabinConfig, selectedSeat, onSeatSelect }: SeatMapProps) {
  const [hoveredSeat, setHoveredSeat] = useState<{ seat: SeatData; position: { x: number; y: number } } | null>(null);

  // Group seats by y_position or row_number
  const rows = seats.reduce((acc, seat) => {
    // Rely on y_position if available, fallback to parsing seat_number
    const rowNum = (seat as any).y_position || parseInt(seat.seat_number.match(/(\d+)/)?.[0] || '0');
    if (!acc[rowNum]) acc[rowNum] = [];
    acc[rowNum].push(seat);
    return acc;
  }, {} as Record<number, SeatData[]>);

  // Sort rows numerically
  const sortedRowNumbers = Object.keys(rows).map(Number).sort((a, b) => a - b);

  const handleMouseEnter = (seat: SeatData, e: React.MouseEvent) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    // Use window scroll to accurately place tooltip relative to document
    setHoveredSeat({
      seat,
      position: { x: rect.left + rect.width / 2, y: rect.top + window.scrollY }
    });
  };

  const handleMouseLeave = () => {
    setHoveredSeat(null);
  };

  return (
    <div className="relative p-8 bg-white/5 rounded-3xl border border-white/10 shadow-2xl overflow-x-auto">
      
      {/* Tooltip */}
      {hoveredSeat && (
        <SeatTooltip seat={hoveredSeat.seat} position={hoveredSeat.position} />
      )}

      {/* Cockpit Indicator */}
      <div className="flex flex-col items-center mb-12 opacity-50">
        <div className="w-32 h-32 border-t-4 border-l-4 border-r-4 border-white/20 rounded-t-full flex items-center justify-center">
          <span className="text-sm font-mono tracking-widest uppercase">Cockpit</span>
        </div>
      </div>

      <div className="min-w-max flex flex-col items-center gap-4">
        {sortedRowNumbers.map(rowNum => {
          // Sort by x_position if available, fallback to localeCompare
          const rowSeats = rows[rowNum].sort((a: any, b: any) => 
            (a.x_position !== undefined && b.x_position !== undefined) 
              ? a.x_position - b.x_position 
              : a.seat_number.localeCompare(b.seat_number)
          );
          
          if (rowSeats.length === 0) return null;
          
          // Determine layout for this row based on its cabin class
          const cabinClass = (rowSeats[0] as any).cabin_class || rowSeats[0].seat_class;
          const config = cabinConfig?.find(c => c.class === cabinClass);
          const layoutStr = config?.layout || '3-3';
          const chunks = layoutStr.split('-').map(Number);
          
          // Slice the row seats according to the layout chunks to insert aisles
          const renderedChunks: React.ReactNode[] = [];
          let currentIndex = 0;

          chunks.forEach((chunkSize: number, idx: number) => {
            const chunkSeats = rowSeats.slice(currentIndex, currentIndex + chunkSize);
            currentIndex += chunkSize;

            renderedChunks.push(
              <div key={`chunk-${rowNum}-${idx}`} className="flex gap-2">
                {chunkSeats.map(seat => (
                  <Seat 
                    key={seat.id} 
                    seat={seat} 
                    isSelected={selectedSeat?.id === seat.id} 
                    onSelect={onSeatSelect} 
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                  />
                ))}
              </div>
            );
          });

          return (
            <motion.div 
              key={`row-${rowNum}`} 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: rowNum * 0.02 }}
              className="flex items-center gap-8"
            >
              {/* Left Row Number */}
              <div className="w-8 text-center text-slate-500 font-mono text-sm">{rowNum}</div>
              
              <div className="flex gap-12">
                {renderedChunks}
              </div>

              {/* Right Row Number */}
              <div className="w-8 text-center text-slate-500 font-mono text-sm">{rowNum}</div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
