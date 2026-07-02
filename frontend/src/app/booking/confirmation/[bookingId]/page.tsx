'use client';

import { useState, useEffect, use } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plane, CheckCircle2, Loader2, MoreVertical, XCircle, CalendarClock, Armchair, Ticket } from 'lucide-react';
import api from '@/lib/axios';
import { motion } from 'framer-motion';
import QRCode from 'react-qr-code';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuGroup,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from '@/components/ui/input';

export default function ConfirmationPage({ params }: { params: Promise<{ bookingId: string }> }) {
  const { bookingId } = use(params);
  
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Dialog states
  const [seatDialogOpen, setSeatDialogOpen] = useState(false);
  const [seatChangePassengerId, setSeatChangePassengerId] = useState('');
  const [newSeat, setNewSeat] = useState('');
  
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [alternativeFlights, setAlternativeFlights] = useState<any[]>([]);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const res = await api.get(`/api/bookings/${bookingId}`);
        setBooking(res.data.data);
        
        if (res.data.data.status === 'Confirmed') {
          setTimeout(() => {
            confetti({
              particleCount: 150,
              spread: 70,
              origin: { y: 0.6 },
              colors: ['#3b82f6', '#10b981', '#8b5cf6']
            });
          }, 500);
        }
      } catch (error) {
        console.error('Failed to fetch booking', error);
        setError('Booking not found');
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [bookingId]);

  const handleCancelBooking = async () => {
    try {
      setBooking((prev: any) => ({ ...prev, status: 'Cancelled' }));
      setCancelDialogOpen(false);
      toast.success('Booking cancelled successfully');
      await api.patch(`/api/bookings/${bookingId}/cancel`);
    } catch (err) {
      toast.error('Failed to cancel booking');
      setBooking((prev: any) => ({ ...prev, status: 'Confirmed' }));
    }
  };

  const handleChangeSeat = async () => {
    if (!newSeat || !seatChangePassengerId) return;
    
    try {
      await api.patch(`/api/bookings/${bookingId}/seat`, { 
        passengerId: seatChangePassengerId, 
        newSeat 
      });
      
      setBooking((prev: any) => ({
        ...prev,
        booking_passengers: prev.booking_passengers.map((p: any) => 
          p.id === seatChangePassengerId ? { ...p, seat_number: newSeat } : p
        )
      }));
      
      setSeatDialogOpen(false);
      toast.success(`Seat changed to ${newSeat}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.response?.data?.error || 'Failed to change seat');
    }
  };

  const handleOpenReschedule = async () => {
    setRescheduleDialogOpen(true);
    try {
      const res = await api.get(`/api/flights/search?origin=${booking.flights.origin_airport}&destination=${booking.flights.destination_airport}`);
      setAlternativeFlights(res.data.data.filter((f: any) => f.id !== booking.flight_id));
    } catch (err) {
      toast.error('Failed to load alternative flights');
    }
  };

  const handleReschedule = async (newFlightId: string, newFlight: any) => {
    const oldFlight = booking.flights;
    try {
      setBooking((prev: any) => ({ ...prev, flight_id: newFlightId, flights: newFlight, status: 'Confirmed' }));
      setRescheduleDialogOpen(false);
      toast.success(`Rescheduled to flight ${newFlight.flight_number}. Please re-assign seats.`);
      await api.patch(`/api/bookings/${bookingId}/reschedule`, { newFlightId });
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to reschedule');
      setBooking((prev: any) => ({ ...prev, flight_id: oldFlight.id, flights: oldFlight }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <p className="text-xl text-destructive">{error}</p>
      </div>
    );
  }

  const { flights: flight, booking_passengers } = booking;
  const isCancelled = booking.status === 'Cancelled';

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
        <Navbar />
        
        <main className="relative pt-32 px-4 pb-12 flex justify-center min-h-screen">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-600/10 rounded-full blur-[120px] -z-10 pointer-events-none" />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, type: 'spring' }}
            className="w-full max-w-3xl"
          >
            
            <div className="text-center mb-8">
              <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full ${isCancelled ? 'bg-destructive/20 border-destructive/30' : 'bg-emerald-500/20 border-emerald-500/30'} border-4 mb-4 shadow-lg`}>
                {isCancelled ? <XCircle className="w-10 h-10 text-destructive" /> : <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />}
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-foreground mb-2 font-heading">
                {isCancelled ? 'Booking Cancelled' : 'Booking Confirmed!'}
              </h1>
              <p className="text-muted-foreground">
                {isCancelled ? 'Your trip has been cancelled. Refunds will be processed within 5-7 business days.' : `Your trip is all set. Reference: ${booking.pnr}`}
              </p>
            </div>

            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2 font-heading"><Ticket className="text-primary" /> Boarding Passes</h2>
              {!isCancelled && (
                <DropdownMenu>
                  <DropdownMenuTrigger className="py-2 px-4 bg-primary/20 hover:bg-primary/30 border border-primary/30 text-primary rounded-lg font-medium transition-colors flex items-center gap-2">
                    <MoreVertical className="w-4 h-4" /> Manage Booking
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 bg-card border-border text-card-foreground">
                    <DropdownMenuGroup>
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-border" />
                      <DropdownMenuItem onClick={() => setSeatDialogOpen(true)} className="hover:bg-muted focus:bg-muted cursor-pointer">
                        <Armchair className="w-4 h-4 mr-2" /> Change Seat
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleOpenReschedule} className="hover:bg-muted focus:bg-muted cursor-pointer">
                        <CalendarClock className="w-4 h-4 mr-2" /> Reschedule Flight
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator className="bg-border" />
                    <DropdownMenuGroup>
                      <DropdownMenuItem onClick={() => setCancelDialogOpen(true)} className="text-destructive hover:bg-destructive/20 focus:bg-destructive/20 cursor-pointer">
                        <XCircle className="w-4 h-4 mr-2" /> Cancel Booking
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            <div className="space-y-6">
              {booking_passengers.map((pax: any, idx: number) => {
                const qrData = JSON.stringify({ pnr: booking.pnr, ticket: pax.ticket_number, flight: flight.flight_number });
                return (
                  <Card key={pax.id} className={`bg-card border-border text-card-foreground shadow-2xl overflow-hidden relative transition-all ${isCancelled ? 'opacity-70 grayscale' : ''}`}>
                    
                    {/* Cutouts for ticket effect */}
                    <div className="absolute left-[-16px] top-[140px] w-8 h-8 bg-background rounded-full z-10 border-r border-border"></div>
                    <div className="absolute right-[-16px] top-[140px] w-8 h-8 bg-background rounded-full z-10 border-l border-border"></div>
                    <div className="absolute left-4 right-4 top-[156px] h-[1px] border-b border-dashed border-border"></div>

                    <CardContent className="p-0">
                      {/* Header Section */}
                      <div className="p-6 bg-primary/20">
                        <div className="flex justify-between items-center mb-4">
                          <div className="flex items-center gap-2">
                            <Plane className="w-5 h-5 text-primary" />
                            <span className="font-bold text-md tracking-wider font-heading">{flight.airline_name?.toUpperCase()}</span>
                          </div>
                          <div className="flex gap-2">
                            <Badge className="bg-muted text-muted-foreground border-border">{pax.passenger_type}</Badge>
                            <Badge className="bg-primary/20 text-primary border-primary/20">{isCancelled ? 'CANCELLED' : 'ECONOMY'}</Badge>
                          </div>
                        </div>

                        <div className="flex justify-between items-end">
                          <div>
                            <p className="text-3xl font-bold mb-1 font-mono">{flight.origin_airport?.split(' ')[0]}</p>
                            <p className="text-xs text-primary/80">{new Date(flight.departure_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                          </div>
                          
                          <div className="flex flex-col items-center flex-1 px-8 pb-1">
                            <Plane className="w-5 h-5 text-primary/50 mb-1" />
                            <div className="h-[2px] w-full bg-primary/20 relative"></div>
                          </div>

                          <div className="text-right">
                            <p className="text-3xl font-bold mb-1 font-mono">{flight.destination_airport?.split(' ')[0]}</p>
                            <p className="text-xs text-primary/80">{new Date(flight.arrival_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                          </div>
                        </div>
                      </div>

                      {/* Body Section */}
                      <div className="p-6 pt-10 flex flex-col md:flex-row gap-6 items-center md:items-start justify-between">
                        
                        <div className="grid grid-cols-2 gap-y-4 gap-x-8 w-full">
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Passenger</p>
                            <p className="font-bold text-md">{pax.first_name} {pax.last_name}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Flight</p>
                            <p className="font-bold text-md text-primary">{flight.flight_number}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Date</p>
                            <p className="font-bold text-md">{new Date(flight.departure_time).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Seat</p>
                            <p className="font-bold text-md text-emerald-600 dark:text-emerald-400">{pax.seat_number || 'INFANT'}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">PNR</p>
                            <p className="font-bold text-md font-mono">{booking.pnr}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Boarding Time</p>
                            <p className="font-bold text-md text-amber-500">
                              {new Date(new Date(flight.departure_time).getTime() - 45 * 60000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </p>
                          </div>
                        </div>

                        {/* QR Code */}
                        <div className="shrink-0 p-3 bg-white rounded-xl shadow-inner">
                          <QRCode value={qrData} size={100} level="L" bgColor="#ffffff" fgColor="#050510" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="mt-8 flex justify-center">
              <button onClick={() => window.print()} className="py-3 px-8 bg-muted hover:bg-muted/80 border border-border text-foreground rounded-xl font-bold transition-colors">
                Download All Tickets
              </button>
            </div>
            
          </motion.div>
        </main>
      </div>

      {/* Change Seat Dialog */}
      <Dialog open={seatDialogOpen} onOpenChange={setSeatDialogOpen}>
        <DialogContent className="bg-card border-border text-card-foreground sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Change Seat</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Select passenger and enter new seat.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Select value={seatChangePassengerId} onValueChange={(val) => setSeatChangePassengerId(val || '')}>
              <SelectTrigger className="bg-background border-border text-foreground focus:ring-primary">
                <SelectValue placeholder="Select Passenger" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border text-card-foreground">
                {booking_passengers.filter((p: any) => p.passenger_type !== 'INFANT').map((p: any) => (
                  <SelectItem key={p.id} value={p.id} className="focus:bg-muted">
                    {p.first_name} {p.last_name} (Current: {p.seat_number})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input 
              placeholder="e.g. 14B" 
              value={newSeat} 
              onChange={(e) => setNewSeat(e.target.value)}
              className="bg-background border-border text-foreground focus:border-primary"
            />
          </div>
          <DialogFooter>
            <button onClick={() => setSeatDialogOpen(false)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
            <button onClick={handleChangeSeat} className="px-4 py-2 text-sm bg-primary hover:bg-primary/90 text-primary-foreground rounded-md transition-colors">Save changes</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Booking Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent className="bg-card border-border text-card-foreground sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-destructive">Cancel Entire Booking</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Are you sure you want to cancel this entire booking? All {booking_passengers?.length} passengers will lose their seats. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <button onClick={() => setCancelDialogOpen(false)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">Keep Booking</button>
            <button onClick={handleCancelBooking} className="px-4 py-2 text-sm bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-md transition-colors">Yes, Cancel All</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reschedule Dialog */}
      <Dialog open={rescheduleDialogOpen} onOpenChange={setRescheduleDialogOpen}>
        <DialogContent className="bg-card border-border text-card-foreground sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Reschedule Flight</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Select an alternative flight for this route.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[300px] overflow-y-auto pr-2">
            {alternativeFlights.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No alternative flights available for this route.</p>
            ) : (
              alternativeFlights.map(altFlight => (
                <div key={altFlight.id} className="flex items-center justify-between p-3 border border-border rounded-lg hover:border-primary/50 transition-colors bg-muted/20">
                  <div>
                    <p className="font-medium text-sm">{altFlight.flight_number} • {new Date(altFlight.departure_time).toLocaleDateString()}</p>
                    <p className="text-xs text-muted-foreground">{new Date(altFlight.departure_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(altFlight.arrival_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                  </div>
                  <button 
                    onClick={() => handleReschedule(altFlight.id, altFlight)}
                    className="px-3 py-1 bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground rounded text-xs transition-colors"
                  >
                    Select
                  </button>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

    </ProtectedRoute>
  );
}
