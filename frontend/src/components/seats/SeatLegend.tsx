'use client';

import React from 'react';

export default function SeatLegend() {
  const legendItems = [
    { color: 'bg-blue-500', label: 'Available' },
    { color: 'bg-red-500 opacity-50', label: 'Occupied' },
    { color: 'bg-emerald-500', label: 'Selected' },
    { color: 'bg-yellow-500', label: 'Exit Row' },
    { color: 'bg-slate-800', label: 'Blocked' },
  ];

  return (
    <div className="flex flex-wrap items-center justify-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10 mt-6">
      {legendItems.map((item, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <div className={`w-4 h-4 rounded-sm border-b-2 border-black/30 ${item.color}`}></div>
          <span className="text-sm text-slate-300">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
