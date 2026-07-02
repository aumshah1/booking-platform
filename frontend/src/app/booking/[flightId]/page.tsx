'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, User, ChevronRight, ChevronLeft, CheckCircle2, UserPlus, Users } from 'lucide-react';
import api from '@/lib/axios';
import { motion, AnimatePresence } from 'framer-motion';

import SeatMap from '@/components/seats/SeatMap';
import SeatLegend from '@/components/seats/SeatLegend';
import BookingSummary, { PassengerData } from '@/components/seats/BookingSummary';
import { SeatData } from '@/components/seats/Seat';
import { toast } from 'sonner';

export default function BookingWizardPage({ params }: { params: Promise<{ flightId: string }> }) {
  const router = useRouter();
  const { flightId } = use(params);
  
  const [flight, setFlight] = useState<any>(null);
  const [seats, setSeats] = useState<SeatData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Wizard state
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1: Counts
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);

  // Step 2: Passenger Details
  const [passengers, setPassengers] = useState<PassengerData[]>([]);
  
  // Step 3: Seat Selection
  const [activePassengerId, setActivePassengerId] = useState<string | null>(null);

  const fetchSeatsOnly = async () => {
    try {
      const seatsRes = await api.get(`/api/flights/${flightId}/seats`);
      if (flight) {
        setSeats(seatsRes.data.data.map((s: any) => ({
          ...s,
          price: Number(flight.base_price || 0) + Number(s.price_modifier || 0),
          seat_class: s.cabin_class
        })));
      }
    } catch (err) {
      console.error('Failed to refetch seats', err);
    }
  };

  useEffect(() => {
    const fetchFlightData = async () => {
      try {
        const [flightRes, seatsRes] = await Promise.all([
          api.get(`/api/flights/${flightId}`),
          api.get(`/api/flights/${flightId}/seats`)
        ]);
        const flightData = flightRes.data.data;
        setFlight(flightData);
        setSeats(seatsRes.data.data.map((s: any) => ({
          ...s,
          price: Number(flightData.base_price || 0) + Number(s.price_modifier || 0),
          seat_class: s.cabin_class // map cabin_class to seat_class for tooltip
        })));
      } catch (err) {
        console.error('Failed to fetch flight data', err);
        setError('Flight data not found');
      } finally {
        setLoading(false);
      }
    };
    fetchFlightData();
  }, [flightId]);

  // Handle Generating Passenger Forms when leaving Step 1
  const generatePassengers = () => {
    const total = adults + children + infants;
    if (total > 9) return toast.error('Maximum 9 passengers allowed');
    if (infants > adults) return toast.error('Infants cannot exceed adults');
    
    // Retain existing passenger data if they go back and forth, just pad or slice
    let newPassengers: PassengerData[] = [];
    
    const addType = (type: 'ADULT' | 'CHILD' | 'INFANT', count: number) => {
      for (let i = 0; i < count; i++) {
        const existing = passengers.filter(p => p.passenger_type === type)[i];
        if (existing) {
          newPassengers.push(existing);
        } else {
          newPassengers.push({
            id: crypto.randomUUID(),
            passenger_type: type,
            first_name: '',
            last_name: '',
          });
        }
      }
    };

    addType('ADULT', adults);
    addType('CHILD', children);
    addType('INFANT', infants);

    setPassengers(newPassengers);
    setStep(2);
  };

  const updatePassenger = (id: string, field: string, value: string) => {
    setPassengers(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const handleSeatSelect = (seat: SeatData) => {
    if (seat.status !== 'AVAILABLE' && seat.status !== 'EXIT_ROW') return;
    if (!activePassengerId) return toast.error('Please select a passenger first');

    const activePax = passengers.find(p => p.id === activePassengerId);
    if (activePax?.passenger_type === 'INFANT') return toast.error('Infants do not require a seat');

    // Check if seat is already taken by ANOTHER passenger in this booking
    const otherPax = passengers.find(p => p.seat_number === seat.seat_number && p.id !== activePassengerId);
    if (otherPax) {
      // If they clicked a seat that belongs to another passenger in their group, just switch to that passenger
      setActivePassengerId(otherPax.id);
      return;
    }

    // Assign seat
    setPassengers(prev => prev.map(p => {
      if (p.id === activePassengerId) {
        return { ...p, seat_number: seat.seat_number, seat_price: seat.price };
      }
      return p;
    }));

    // Auto-advance to next passenger without seat
    const nextPax = passengers.find(p => p.id !== activePassengerId && p.passenger_type !== 'INFANT' && !p.seat_number);
    if (nextPax) {
      setActivePassengerId(nextPax.id);
    }
  };

  const validateStep2 = () => {
    for (const p of passengers) {
      if (!p.first_name.trim() || !p.last_name.trim()) {
        return toast.error('Please fill in all passenger names');
      }
    }
    
    // Set first adult as active for seat selection
    const firstAdult = passengers.find(p => p.passenger_type === 'ADULT');
    if (firstAdult) setActivePassengerId(firstAdult.id);
    
    setStep(3);
  };

  const handleSubmitBooking = async () => {
    // Validate all seat required passengers have seats
    const seatRequiring = passengers.filter(p => p.passenger_type !== 'INFANT');
    if (seatRequiring.some(p => !p.seat_number)) {
      return toast.error('Please assign seats for all Adults and Children');
    }

    setIsSubmitting(true);
    try {
      // Calculate total amount (mock logic, match summary)
      let totalAmount = 0;
      passengers.forEach(p => {
        const paxBase = p.passenger_type === 'INFANT' ? (flight.base_price * 0.2) : flight.base_price;
        let seatExtra = 0;
        if (p.seat_price) {
          seatExtra = Math.max(0, p.seat_price - paxBase);
        }
        totalAmount += paxBase + seatExtra;
      });
      totalAmount = totalAmount + (totalAmount * 0.1); // Tax

      const payload = {
        flight_id: flightId,
        passengers: passengers.map(p => ({
          passenger_type: p.passenger_type,
          title: 'Mr', // Mock title for now
          first_name: p.first_name,
          last_name: p.last_name,
          gender: 'Unspecified',
          date_of_birth: '1990-01-01', // Mock DOB
          nationality: 'US',
          passport_number: `PASS${Math.floor(Math.random() * 10000)}`, // Mock passport
          seat_number: p.seat_number
        })),
        total_amount: totalAmount
      };

      const res = await api.post('/api/bookings', payload);
      const booking = res.data.data;
      router.push(`/booking/confirmation/${booking.id}`);
    } catch (err: any) {
      if (err.response?.status === 409) {
        toast.error(err.response.data.message || 'One or more selected seats are no longer available. Please select new seats.', { duration: 8000 });
        // Clear all assigned seats since the booking failed
        setPassengers(prev => prev.map(p => ({ ...p, seat_number: undefined, seat_price: undefined })));
        // Refetch latest seats
        await fetchSeatsOnly();
      } else {
        toast.error(err.response?.data?.error || 'Failed to complete booking');
      }
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (error && !flight) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <p className="text-xl text-destructive">{error}</p>
      </div>
    );
  }

  // Determine seat map dynamically highlighting taken seats
  const mappedSeats = seats.map(s => {
    const isTakenByCurrentBooking = passengers.some(p => p.seat_number === s.seat_number);
    if (isTakenByCurrentBooking) {
      // Make it appear selected if it's the active passenger, or selected by another passenger in this booking
      const isActive = passengers.find(p => p.id === activePassengerId)?.seat_number === s.seat_number;
      return { ...s, status: isActive ? 'SELECTED' : 'SELECTED_OTHER' } as SeatData;
    }
    return s;
  });

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 pb-20 transition-colors duration-300">
        <Navbar />
        
        <main className="relative pt-28 px-4 pb-12 overflow-hidden min-h-screen">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] -z-10 pointer-events-none" />
          
          <div className="max-w-7xl mx-auto">
            
            <div className="flex items-center justify-center gap-4 mb-12">
              {[1, 2, 3].map(s => (
                <div key={s} className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${step >= s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                    {s}
                  </div>
                  {s < 3 && <div className={`w-12 h-1 ${step > s ? 'bg-primary' : 'bg-border'} rounded-full`} />}
                </div>
              ))}
            </div>

            <div className={`grid grid-cols-1 ${step === 1 ? 'max-w-3xl mx-auto w-full' : 'xl:grid-cols-3'} gap-8 items-start`}>
              
              <div className={step === 1 ? '' : 'xl:col-span-2'}>
                <AnimatePresence mode="wait">
                  
                  {/* STEP 1: PASSENGER COUNTS */}
                  {step === 1 && (
                    <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                      <Card className="bg-card border-border text-card-foreground shadow-sm hover:shadow-md transition-all">
                        <CardHeader className="bg-muted/30 border-b border-border">
                          <CardTitle className="text-2xl flex items-center gap-2 font-heading"><Users className="text-primary" /> Who is traveling?</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6">
                          
                          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border border-border hover:border-primary/30 transition-colors">
                            <div>
                              <p className="font-bold text-lg">Adults</p>
                              <p className="text-sm text-muted-foreground">12+ years</p>
                            </div>
                            <div className="flex items-center gap-4">
                              <button onClick={() => setAdults(Math.max(1, adults - 1))} className="w-10 h-10 bg-background border border-border rounded-full hover:bg-muted transition-colors flex items-center justify-center text-lg">-</button>
                              <span className="text-xl font-bold w-4 text-center">{adults}</span>
                              <button onClick={() => setAdults(Math.min(9, adults + 1))} className="w-10 h-10 bg-background border border-border rounded-full hover:bg-muted transition-colors flex items-center justify-center text-lg">+</button>
                            </div>
                          </div>

                          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border border-border hover:border-primary/30 transition-colors">
                            <div>
                              <p className="font-bold text-lg">Children</p>
                              <p className="text-sm text-muted-foreground">2-11 years</p>
                            </div>
                            <div className="flex items-center gap-4">
                              <button onClick={() => setChildren(Math.max(0, children - 1))} className="w-10 h-10 bg-background border border-border rounded-full hover:bg-muted transition-colors flex items-center justify-center text-lg">-</button>
                              <span className="text-xl font-bold w-4 text-center">{children}</span>
                              <button onClick={() => setChildren(Math.min(9, children + 1))} className="w-10 h-10 bg-background border border-border rounded-full hover:bg-muted transition-colors flex items-center justify-center text-lg">+</button>
                            </div>
                          </div>

                          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border border-border hover:border-primary/30 transition-colors">
                            <div>
                              <p className="font-bold text-lg">Infants</p>
                              <p className="text-sm text-muted-foreground">Under 2 years (on lap)</p>
                            </div>
                            <div className="flex items-center gap-4">
                              <button onClick={() => setInfants(Math.max(0, infants - 1))} className="w-10 h-10 bg-background border border-border rounded-full hover:bg-muted transition-colors flex items-center justify-center text-lg">-</button>
                              <span className="text-xl font-bold w-4 text-center">{infants}</span>
                              <button onClick={() => setInfants(Math.min(adults, infants + 1))} className="w-10 h-10 bg-background border border-border rounded-full hover:bg-muted transition-colors flex items-center justify-center text-lg">+</button>
                            </div>
                          </div>

                          <button onClick={generatePassengers} className="w-full mt-4 bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 rounded-xl transition-colors shadow-sm">
                            Continue
                          </button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}

                  {/* STEP 2: PASSENGER DETAILS */}
                  {step === 2 && (
                    <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-bold font-heading">Passenger Details</h2>
                        <button onClick={() => setStep(1)} className="text-muted-foreground hover:text-foreground flex items-center text-sm transition-colors"><ChevronLeft className="w-4 h-4"/> Back</button>
                      </div>

                      {passengers.map((p, idx) => (
                        <Card key={p.id} className="bg-card border-border text-card-foreground shadow-sm overflow-hidden">
                          <div className="bg-primary/10 px-6 py-3 border-b border-primary/20 flex items-center gap-2">
                            <User className="w-5 h-5 text-primary" />
                            <h3 className="font-bold font-heading">Passenger {idx + 1} <span className="text-primary text-sm font-normal">({p.passenger_type})</span></h3>
                          </div>
                          <CardContent className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label className="text-muted-foreground">First Name</Label>
                                <Input value={p.first_name} onChange={(e) => updatePassenger(p.id, 'first_name', e.target.value)} className="bg-background border-border text-foreground focus:border-primary" placeholder="First Name" />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-muted-foreground">Last Name</Label>
                                <Input value={p.last_name} onChange={(e) => updatePassenger(p.id, 'last_name', e.target.value)} className="bg-background border-border text-foreground focus:border-primary" placeholder="Last Name" />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}

                      <button onClick={validateStep2} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 rounded-xl transition-colors shadow-sm">
                        Select Seats
                      </button>
                    </motion.div>
                  )}

                  {/* STEP 3: SEAT SELECTION */}
                  {step === 3 && (
                    <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-bold font-heading">Assign Seats</h2>
                        <button onClick={() => setStep(2)} className="text-muted-foreground hover:text-foreground flex items-center text-sm transition-colors"><ChevronLeft className="w-4 h-4"/> Back</button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        
                        {/* Passenger List Sidebar */}
                        <div className="col-span-1 space-y-3">
                          {passengers.filter(p => p.passenger_type !== 'INFANT').map((p, idx) => {
                            const isActive = activePassengerId === p.id;
                            const hasSeat = !!p.seat_number;
                            
                            return (
                              <div 
                                key={p.id}
                                onClick={() => setActivePassengerId(p.id)}
                                className={`p-3 rounded-xl border cursor-pointer transition-all ${isActive ? 'bg-primary/10 border-primary shadow-sm' : 'bg-card border-border hover:border-primary/50'}`}
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className={`font-bold text-sm truncate max-w-[120px] ${isActive ? 'text-primary' : 'text-foreground'}`}>{p.first_name || `Passenger ${idx+1}`}</p>
                                    <p className="text-xs text-muted-foreground">{p.passenger_type}</p>
                                  </div>
                                  {hasSeat ? (
                                    <div className="w-8 h-8 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm border border-emerald-500/20">
                                      {p.seat_number}
                                    </div>
                                  ) : (
                                    <div className="w-4 h-4 rounded-full border border-muted-foreground"></div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                          <div className="p-4 bg-muted/50 rounded-xl text-xs text-muted-foreground border border-border">
                            * Infants travel on lap and do not require seats.
                          </div>
                        </div>

                        {/* Seat Map */}
                        <div className="col-span-3">
                            <SeatMap 
                              seats={mappedSeats} 
                              cabinConfig={flight.aircrafts?.cabin_configuration_json || []} 
                              selectedSeat={mappedSeats.find(s => s.seat_number === passengers.find(p => p.id === activePassengerId)?.seat_number) || null} 
                              onSeatSelect={handleSeatSelect} 
                            />
                          <SeatLegend />
                        </div>
                      </div>
                    </motion.div>
                  )}

                </AnimatePresence>
              </div>

              {/* Right Column: Summary Sidebar */}
              {step !== 1 && (
                <div className="xl:col-span-1">
                  <BookingSummary 
                    flight={flight} 
                    passengers={passengers}
                    onProceed={step === 3 ? handleSubmitBooking : validateStep2}
                    isLoading={isSubmitting} 
                    buttonLabel={step === 2 ? 'Select Seats' : 'Confirm & Pay'}
                    disabled={step === 3 && passengers.filter(p => p.passenger_type !== 'INFANT').some(p => !p.seat_number)}
                  />
                </div>
              )}
              
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
