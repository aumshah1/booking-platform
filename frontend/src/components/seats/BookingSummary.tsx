'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Plane, ChevronRight, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface PassengerData {
  id: string; // temp id for UI
  passenger_type: 'ADULT' | 'CHILD' | 'INFANT';
  first_name: string;
  last_name: string;
  seat_number?: string | null;
  seat_price?: number;
}

interface BookingSummaryProps {
  flight: any;
  passengers: PassengerData[];
  onProceed: () => void;
  isLoading: boolean;
  buttonLabel?: string;
  disabled?: boolean;
  // Step 1 counts when passengers array is empty
  step?: number;
  adultsCount?: number;
  childrenCount?: number;
  infantsCount?: number;
}

export default function BookingSummary({ flight, passengers, onProceed, isLoading, buttonLabel = 'Confirm Booking', disabled = false, step = 3, adultsCount = 0, childrenCount = 0, infantsCount = 0 }: BookingSummaryProps) {
  const baseFare = flight?.base_price || 0;
  
  // Calculate totals
  let totalBaseFare = 0;
  let totalSeatCharges = 0;
  let displayPassengersCount = passengers.length;
  
  if (step === 1) {
    displayPassengersCount = adultsCount + childrenCount + infantsCount;
    totalBaseFare = (adultsCount * baseFare) + (childrenCount * baseFare) + (infantsCount * (baseFare * 0.2));
  } else {
    passengers.forEach(p => {
      // Base fare: Adults and Children pay full, Infants might pay 10% or free. Let's say Infants are 20%.
      const paxBase = p.passenger_type === 'INFANT' ? (baseFare * 0.2) : baseFare;
      totalBaseFare += paxBase;
      
      if (p.seat_price) {
        // Assuming seat_price returned by DB is the total, subtract base to get extra charge
        const extraSeat = p.seat_price - paxBase;
        if (extraSeat > 0) totalSeatCharges += extraSeat;
      }
    });
  }

  const taxes = (totalBaseFare + totalSeatCharges) * 0.1; // 10% tax
  const total = totalBaseFare + totalSeatCharges + taxes;

  const validPassengers = step === 1 ? [] : passengers.filter(p => p.first_name || p.last_name);

  return (
    <Card className="bg-card border-border text-card-foreground shadow-sm hover:shadow-md transition-all sticky top-24">
      <CardContent className="p-6">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2 border-b border-border pb-4 font-heading">
          <Plane className="w-5 h-5 text-primary" /> Booking Summary
        </h3>

        <div className="space-y-4 text-sm">
          <div className="flex justify-between items-center text-muted-foreground">
            <span className="flex items-center gap-1"><Users className="w-4 h-4"/> Passengers</span>
            <span className="font-semibold text-foreground">{displayPassengersCount}</span>
          </div>
          
          <div className="space-y-2 mt-2 pl-4 border-l-2 border-border">
            {validPassengers.map((p, idx) => (
              <div key={p.id || idx} className="flex justify-between items-center text-xs text-muted-foreground">
                <span>{p.first_name} {p.last_name} ({p.passenger_type})</span>
                {p.seat_number && <span className="font-bold text-emerald-600 dark:text-emerald-400">{p.seat_number}</span>}
              </div>
            ))}
          </div>
          
          <div className="flex justify-between items-center text-muted-foreground mt-4">
            <span>Total Base Fare</span>
            <span className="font-mono text-foreground">${totalBaseFare.toFixed(2)}</span>
          </div>

          <AnimatePresence>
            {totalSeatCharges > 0 && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex justify-between items-center text-muted-foreground overflow-hidden"
              >
                <span>Seat Charges</span>
                <span className="font-mono text-amber-500">+${totalSeatCharges.toFixed(2)}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex justify-between items-center text-muted-foreground">
            <span>Taxes & Fees (10%)</span>
            <span className="font-mono text-foreground">${taxes.toFixed(2)}</span>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-border flex justify-between items-center">
          <span className="text-lg font-bold font-heading">Grand Total</span>
          <span className="text-2xl font-black text-primary font-mono">${total.toFixed(2)}</span>
        </div>

        <button 
          onClick={onProceed}
          disabled={disabled || isLoading}
          className="w-full mt-8 bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground text-primary-foreground font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
        >
          {isLoading ? 'Processing...' : buttonLabel} <ChevronRight className="w-5 h-5" />
        </button>
      </CardContent>
    </Card>
  );
}
