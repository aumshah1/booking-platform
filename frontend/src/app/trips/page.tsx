'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plane, CalendarDays, Loader2, Clock, ArrowRight, XCircle, CheckCircle2 } from 'lucide-react';
import api from '@/lib/axios';
import { motion } from 'framer-motion';
import { formatFlightTime, formatFlightDate } from '@/lib/dateUtils';

export default function MyTripsPage() {
  const router = useRouter();
  const [trips, setTrips] = useState<{ upcoming: any[], completed: any[], cancelled: any[] }>({
    upcoming: [],
    completed: [],
    cancelled: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const res = await api.get('/api/bookings/my-trips');
        setTrips(res.data.data);
      } catch (error) {
        console.error('Failed to fetch trips', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTrips();
  }, []);

  const calculateDuration = (dep: string, arr: string) => {
    const diffMs = new Date(arr).getTime() - new Date(dep).getTime();
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${diffHrs}h ${diffMins}m`;
  };

  const TripCard = ({ booking }: { booking: any }) => {
    const { flights: flight } = booking;
    const isCancelled = booking.status === 'Cancelled';
    
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Card className={`bg-card border-border text-card-foreground hover:border-primary/50 transition-colors shadow-sm hover:shadow-md group ${isCancelled ? 'opacity-75 grayscale' : ''}`}>
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
              
              <div className="flex items-center gap-4 w-full lg:w-1/4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center border ${isCancelled ? 'bg-destructive/10 border-destructive/20' : 'bg-primary/10 border-primary/20'}`}>
                  {isCancelled ? <XCircle className="w-6 h-6 text-destructive" /> : <Plane className="w-6 h-6 text-primary" />}
                </div>
                <div>
                  <p className="font-semibold text-lg font-heading">{flight.airline}</p>
                  <div className="flex gap-2 mt-1">
                    <Badge variant="outline" className="text-primary border-primary/30">{flight.flight_number}</Badge>
                    <Badge variant="outline" className={`${isCancelled ? 'text-destructive border-destructive/30' : 'text-emerald-600 dark:text-emerald-400 border-emerald-500/30'}`}>
                      {booking.status}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="flex flex-1 items-center justify-between w-full">
                <div className="text-center md:text-left">
                  <p className="text-lg font-bold font-mono">{formatFlightTime(flight.departure_time)}</p>
                  <p className="text-sm text-muted-foreground">{flight.origin_airport?.split(' ')[0]}</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">{formatFlightDate(flight.departure_time)}</p>
                </div>
                
                <div className="flex flex-col items-center px-4 flex-1">
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {calculateDuration(flight.departure_time, flight.arrival_time)}
                  </p>
                  <div className="w-full flex items-center">
                    <div className="h-[2px] w-full bg-border relative">
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                        <Plane className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-center md:text-right">
                  <p className="text-lg font-bold font-mono">{formatFlightTime(flight.arrival_time)}</p>
                  <p className="text-sm text-muted-foreground">{flight.destination_airport?.split(' ')[0]}</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">{formatFlightDate(flight.arrival_time)}</p>
                </div>
              </div>

              <div className="flex flex-col justify-center w-full lg:w-1/4 border-t lg:border-t-0 lg:border-l border-border pt-4 lg:pt-0 lg:pl-6">
                <p className="text-sm text-muted-foreground mb-1">PNR: <span className="text-foreground font-mono font-medium">{booking.pnr}</span></p>
                <p className="text-sm text-muted-foreground mb-3">Passengers: <span className="text-foreground font-semibold">{booking.total_passengers}</span></p>
                <button 
                  onClick={() => router.push(`/booking/confirmation/${booking.id}`)}
                  className="w-full py-2 px-4 bg-muted hover:bg-muted/80 text-foreground rounded-lg font-medium transition-colors border border-border"
                >
                  View Details
                </button>
              </div>

            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
        <Navbar />
        
        <main className="relative pt-28 px-4 pb-12 overflow-hidden min-h-screen">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] -z-10 pointer-events-none" />
          
          <div className="max-w-5xl mx-auto space-y-8">
            
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-foreground mb-2 font-heading">My Trips</h1>
              <p className="text-muted-foreground">Manage and view all your flight bookings in one place.</p>
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            ) : (
              <Tabs defaultValue="upcoming" className="w-full">
                <TabsList className="bg-muted/50 border border-border mb-6 p-1 h-auto">
                  <TabsTrigger value="upcoming" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground py-2 px-4">
                    Upcoming ({trips.upcoming.length})
                  </TabsTrigger>
                  <TabsTrigger value="completed" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-muted-foreground py-2 px-4">
                    Completed ({trips.completed.length})
                  </TabsTrigger>
                  <TabsTrigger value="cancelled" className="data-[state=active]:bg-destructive data-[state=active]:text-destructive-foreground text-muted-foreground py-2 px-4">
                    Cancelled ({trips.cancelled.length})
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="upcoming" className="space-y-4">
                  {trips.upcoming.length > 0 ? (
                    trips.upcoming.map(booking => <TripCard key={booking.id} booking={booking} />)
                  ) : (
                    <div className="text-center py-16 bg-muted/20 rounded-xl border border-border border-dashed">
                      <CalendarDays className="w-12 h-12 text-muted-foreground opacity-50 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-foreground">No upcoming trips</h3>
                      <p className="text-muted-foreground mt-2">Ready for your next adventure?</p>
                      <button onClick={() => router.push('/flights')} className="mt-4 text-primary hover:text-primary/80 underline font-medium">Book a flight</button>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="completed" className="space-y-4">
                  {trips.completed.length > 0 ? (
                    trips.completed.map(booking => <TripCard key={booking.id} booking={booking} />)
                  ) : (
                    <div className="text-center py-16 bg-muted/20 rounded-xl border border-border border-dashed">
                      <CheckCircle2 className="w-12 h-12 text-muted-foreground opacity-50 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-foreground">No completed trips yet</h3>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="cancelled" className="space-y-4">
                  {trips.cancelled.length > 0 ? (
                    trips.cancelled.map(booking => <TripCard key={booking.id} booking={booking} />)
                  ) : (
                    <div className="text-center py-16 bg-muted/20 rounded-xl border border-border border-dashed">
                      <XCircle className="w-12 h-12 text-muted-foreground opacity-50 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-foreground">No cancelled trips</h3>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            )}

          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
