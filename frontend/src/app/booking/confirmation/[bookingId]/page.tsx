'use client';

import { useState, useEffect, use } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plane, CheckCircle2, Loader2, MoreVertical, XCircle, CalendarClock, Armchair, Ticket, Download } from 'lucide-react';
import api from '@/lib/axios';
import { motion } from 'framer-motion';
import QRCode from 'react-qr-code';
import QRCodeLib from 'qrcode';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';
import { formatFlightTime, formatFlightDate } from '@/lib/dateUtils';
import jsPDF from 'jspdf';

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

  const handleDownloadPDF = async () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();  // 841.89
    const pageH = doc.internal.pageSize.getHeight(); // 595.28
    const margin = 40;
    const cardW  = pageW - margin * 2;

    for (let idx = 0; idx < booking_passengers.length; idx++) {
      const pax = booking_passengers[idx];
      if (idx > 0) doc.addPage();

      const originCode = (flight.origin_airport || '').split(' ')[0];
      const destCode   = (flight.destination_airport || '').split(' ')[0];

      // ── Generate real QR code data URL ────────────────────────────────────
      const qrPayload = JSON.stringify({
        pnr:    booking.pnr,
        ticket: pax.ticket_number || '',
        flight: flight.flight_number,
        pax:    `${pax.first_name} ${pax.last_name}`,
        from:   originCode,
        to:     destCode,
        date:   new Date(flight.departure_time).toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata' }),
        seat:   pax.seat_number || 'N/A',
      });
      const qrDataUrl = await QRCodeLib.toDataURL(qrPayload, {
        width: 300,
        margin: 2,
        color: { dark: '#0F1737', light: '#FFFFFF' },
        errorCorrectionLevel: 'M',
      });

      // ── Page background ─────────────────────────────────────────────────
      doc.setFillColor(240, 244, 255);
      doc.rect(0, 0, pageW, pageH, 'F');

      // ── Card (white, rounded) ────────────────────────────────────────────
      const cardY = 32;
      const cardH = pageH - 64;
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(210, 220, 240);
      doc.setLineWidth(0.5);
      doc.roundedRect(margin, cardY, cardW, cardH, 12, 12, 'FD');

      // ── Header band ─────────────────────────────────────────────────
      const hdrH = 140;
      // Dark navy fill - top rounded corners only
      doc.setFillColor(15, 23, 55);
      doc.roundedRect(margin, cardY, cardW, hdrH, 12, 12, 'F');
      doc.rect(margin, cardY + hdrH - 14, cardW, 14, 'F'); // square off bottom

      // ── Airline name + plane icon row ───────────────────────────────
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(255, 255, 255);
      doc.text('✈  ' + (flight.airline_name || 'AIRLINE').toUpperCase(), margin + 22, cardY + 26);

      // Badges: passenger type + class (top right)
      const badgeBg: [number,number,number] = [35, 48, 100];
      const badgeTxt: [number,number,number] = [180, 200, 255];
      const badgeY = cardY + 14;
      const badge1X = margin + cardW - 210;
      const badge2X = margin + cardW - 110;
      // badge 1 (passenger type)
      doc.setFillColor(...badgeBg);
      doc.roundedRect(badge1X, badgeY, 88, 20, 6, 6, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(...badgeTxt);
      doc.text((pax.passenger_type || 'ADULT').toUpperCase(), badge1X + 44, badgeY + 13, { align: 'center' });
      // badge 2 (class)
      doc.setFillColor(...badgeBg);
      doc.roundedRect(badge2X, badgeY, 88, 20, 6, 6, 'F');
      doc.text('ECONOMY', badge2X + 44, badgeY + 13, { align: 'center' });

      // ── Route row: BIG airport codes ────────────────────────────────
      const routeY = cardY + 80;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(48);
      doc.setTextColor(255, 255, 255);
      doc.text(originCode, margin + 28, routeY);
      doc.text(destCode, margin + cardW - 28, routeY, { align: 'right' });

      // Flight line with plane
      const lineStartX = margin + 110;
      const lineEndX   = margin + cardW - 110;
      const lineY      = routeY - 18;
      doc.setDrawColor(59, 100, 220);
      doc.setLineWidth(1.2);
      doc.line(lineStartX, lineY, lineEndX, lineY);
      doc.setFontSize(15);
      doc.setTextColor(100, 140, 255);
      doc.text('✈', (lineStartX + lineEndX) / 2, lineY - 3, { align: 'center' });

      // Times under airport codes
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(160, 185, 230);
      const depTime = new Date(flight.departure_time).toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' });
      const arrTime = new Date(flight.arrival_time).toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' });
      doc.text(`${depTime} IST`, margin + 28, routeY + 14);
      doc.text(`${arrTime} IST`, margin + cardW - 28, routeY + 14, { align: 'right' });

      // ── Dashed separator with circular notches ─────────────────────────
      const sepY = cardY + hdrH + 16;
      doc.setDrawColor(180, 200, 230);
      doc.setLineWidth(0.7);
      doc.setLineDashPattern([5, 5], 0);
      doc.line(margin + 22, sepY, margin + cardW - 22, sepY);
      doc.setLineDashPattern([], 0);
      // notch circles (cut-out effect)
      doc.setFillColor(240, 244, 255);
      doc.circle(margin, sepY, 14, 'F');
      doc.circle(margin + cardW, sepY, 14, 'F');

      // ── Body: passenger info grid + real QR ───────────────────────────
      // Fixed small QR size
      const qrSize  = 120;
      const bodyH   = cardY + cardH - sepY - 28; // available body height
      const qrX     = margin + cardW - qrSize - 28;
      const qrY2    = sepY + (bodyH - qrSize) / 2 - 10; // vertically centered

      // Dashed vertical divider before QR
      doc.setDrawColor(180, 200, 230);
      doc.setLineWidth(0.7);
      doc.setLineDashPattern([5, 5], 0);
      doc.line(qrX - 16, sepY + 8, qrX - 16, cardY + cardH - 14);
      doc.setLineDashPattern([], 0);

      // ── Embed the REAL QR image ───────────────────────────────────────
      doc.addImage(qrDataUrl, 'PNG', qrX, qrY2, qrSize, qrSize);
      // QR label below
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(140, 160, 200);
      doc.text('SCAN TO VERIFY', qrX + qrSize / 2, qrY2 + qrSize + 11, { align: 'center' });

      // ── Field grid (left of QR) ──────────────────────────────────────
      const fieldAreaW = qrX - margin - 48;
      const colW       = fieldAreaW / 2;
      const col1X      = margin + 28;
      const col2X      = col1X + colW;

      const lc: [number,number,number] = [140, 160, 200];
      const vc: [number,number,number] = [15,  23,  55];
      const ac: [number,number,number] = [59,  130, 246];
      const gc: [number,number,number] = [5,   150, 105];
      const am: [number,number,number] = [217, 119, 6];

      const field = (label: string, value: string, x: number, y: number, color: [number,number,number] = vc) => {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(...lc);
        doc.text(label, x, y);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12.5);
        doc.setTextColor(...color);
        doc.text(value || '—', x, y + 15);
      };

      const boardingTime = new Date(new Date(flight.departure_time).getTime() - 45 * 60000)
        .toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' });

      const row1Y = sepY + 30;
      field('PASSENGER',       `${pax.first_name} ${pax.last_name}`, col1X, row1Y);
      field('FLIGHT',          flight.flight_number || '',            col2X, row1Y, ac);

      const row2Y = row1Y + 50;
      field('DATE',            new Date(flight.departure_time).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric', timeZone:'Asia/Kolkata' }), col1X, row2Y);
      field('SEAT',            pax.seat_number || 'INFANT',           col2X, row2Y, gc);

      const row3Y = row2Y + 50;
      field('PNR',             booking.pnr || '',                     col1X, row3Y);
      field('BOARDING TIME',   `${boardingTime} IST`,                 col2X, row3Y, am);

      const row4Y = row3Y + 50;
      if (pax.ticket_number) {
        field('TICKET NO',     pax.ticket_number,                     col1X, row4Y);
      }
      field('STATUS',          (booking.status || 'CONFIRMED').toUpperCase(), col2X, row4Y, gc);

      // ── Footer strip ────────────────────────────────────────────────
      const footerY = cardY + cardH - 28;
      doc.setFillColor(240, 244, 255);
      doc.roundedRect(margin, footerY - 4, cardW, 28, 0, 0, 'F');
      // round only bottom corners
      doc.roundedRect(margin, footerY - 4, cardW, 32, 12, 12, 'F');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(140, 160, 200);
      doc.text(
        `This is an e-ticket. Please carry a valid photo ID.  •  Passenger ${idx + 1} of ${booking_passengers.length}  •  Issued: ${new Date().toLocaleDateString('en-GB')}`,
        margin + cardW / 2,
        footerY + 14,
        { align: 'center' }
      );
    }

    doc.save(`Boarding_Pass_${booking.pnr || bookingId}.pdf`);
    toast.success('PDF downloaded successfully!');
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
                            <p className="text-xs text-primary/80">{formatFlightTime(flight.departure_time)}</p>
                          </div>
                          
                          <div className="flex flex-col items-center flex-1 px-8 pb-1">
                            <Plane className="w-5 h-5 text-primary/50 mb-1" />
                            <div className="h-[2px] w-full bg-primary/20 relative"></div>
                          </div>

                          <div className="text-right">
                            <p className="text-3xl font-bold mb-1 font-mono">{flight.destination_airport?.split(' ')[0]}</p>
                            <p className="text-xs text-primary/80">{formatFlightTime(flight.arrival_time)}</p>
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
                            <p className="font-bold text-md">{formatFlightDate(flight.departure_time)}</p>
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
                              {formatFlightTime(new Date(flight.departure_time).getTime() - 45 * 60000)}
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
              <button 
                onClick={handleDownloadPDF} 
                className="py-3 px-8 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-bold transition-all shadow-lg hover:shadow-primary/30 flex items-center gap-2"
              >
                <Download className="w-5 h-5" />
                Download All Tickets (PDF)
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
                    <p className="font-medium text-sm">{altFlight.flight_number} • {formatFlightDate(altFlight.departure_time)}</p>
                    <p className="text-xs text-muted-foreground">{formatFlightTime(altFlight.departure_time)} - {formatFlightTime(altFlight.arrival_time)}</p>
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
