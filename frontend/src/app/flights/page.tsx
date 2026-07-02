'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plane, CalendarDays, Search, Clock, Users, ArrowRight, IndianRupee } from 'lucide-react';
import api from '@/lib/axios';
import { motion } from 'framer-motion';
import { formatFlightTime, formatFlightDate } from '@/lib/dateUtils';

interface Flight {
  id: string;
  airline: string;
  flight_number: string;
  source: string;
  destination: string;
  departure_time: string;
  arrival_time: string;
  price: number;
  available_seats: number;
}

export default function FlightsPage() {
  const router = useRouter();
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchParams, setSearchParams] = useState({
    source: '',
    destination: '',
    date: '',
    maxPrice: '',
    minSeats: '1'
  });

  const fetchFlights = async () => {
    setLoading(true);
    try {
      // Build query string
      const params = new URLSearchParams();
      if (searchParams.source) params.append('source', searchParams.source);
      if (searchParams.destination) params.append('destination', searchParams.destination);
      if (searchParams.date) params.append('date', searchParams.date);
      if (searchParams.maxPrice) params.append('maxPrice', searchParams.maxPrice);
      if (searchParams.minSeats) params.append('minSeats', searchParams.minSeats);

      const res = await api.get(`/api/flights/search?${params.toString()}`);
      setFlights(res.data.data);
    } catch (error) {
      console.error('Failed to search flights:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlights();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchFlights();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchParams({
      ...searchParams,
      [e.target.name]: e.target.value
    });
  };

  const calculateDuration = (dep: string, arr: string) => {
    const diffMs = new Date(arr).getTime() - new Date(dep).getTime();
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${diffHrs}h ${diffMins}m`;
  };

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
      <Navbar />
      
      <main className="relative pt-28 px-4 pb-12 overflow-hidden min-h-screen">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] -z-10 pointer-events-none" />
        
        <div className="max-w-6xl mx-auto space-y-8">
          
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-4 font-heading">
              Find your next destination
            </h1>
            <p className="text-muted-foreground text-lg">Search hundreds of flights and book your journey today.</p>
          </div>

          {/* Search Form */}
          <Card className="bg-card border-border text-card-foreground shadow-2xl p-2 relative z-10">
            <CardContent className="p-4 md:p-6">
              <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
                <div className="space-y-2 lg:col-span-1">
                  <Label htmlFor="source" className="text-foreground">From</Label>
                  <Input 
                    id="source" name="source" placeholder="City or Airport" 
                    value={searchParams.source} onChange={handleChange}
                    className="bg-background border-border text-foreground focus:border-primary transition-all"
                  />
                </div>
                <div className="space-y-2 lg:col-span-1">
                  <Label htmlFor="destination" className="text-foreground">To</Label>
                  <Input 
                    id="destination" name="destination" placeholder="City or Airport" 
                    value={searchParams.destination} onChange={handleChange}
                    className="bg-background border-border text-foreground focus:border-primary transition-all"
                  />
                </div>
                <div className="space-y-2 lg:col-span-1">
                  <Label htmlFor="date" className="text-foreground">Date</Label>
                  <Input 
                    id="date" name="date" type="date" 
                    value={searchParams.date} onChange={handleChange}
                    className="bg-background border-border text-foreground focus:border-primary transition-all [color-scheme:dark] dark:[color-scheme:dark]"
                  />
                </div>
                <div className="space-y-2 lg:col-span-1">
                  <Label htmlFor="maxPrice" className="text-foreground">Max Price (₹)</Label>
                  <Input 
                    id="maxPrice" name="maxPrice" type="number" placeholder="Any"
                    value={searchParams.maxPrice} onChange={handleChange}
                    className="bg-background border-border text-foreground focus:border-primary transition-all"
                  />
                </div>
                <div className="space-y-2 lg:col-span-1">
                  <Label htmlFor="minSeats" className="text-foreground">Passengers</Label>
                  <Input 
                    id="minSeats" name="minSeats" type="number" min="1"
                    value={searchParams.minSeats} onChange={handleChange}
                    className="bg-background border-border text-foreground focus:border-primary transition-all"
                  />
                </div>
                <div className="lg:col-span-1">
                  <button type="submit" className="w-full py-2 px-4 h-10 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md">
                    <Search className="w-4 h-4" /> Search
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Results Area */}
          <div className="mt-8 space-y-4">
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2 font-heading">
              <Plane className="w-5 h-5 text-primary" /> 
              Search Results {flights.length > 0 && <span className="text-sm font-normal text-muted-foreground">({flights.length} found)</span>}
            </h2>

            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-32 w-full bg-muted/50 rounded-xl" />
                ))}
              </div>
            ) : flights.length > 0 ? (
              <div className="space-y-4">
                {flights.map((flight, index) => (
                  <motion.div 
                    key={flight.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <Card className="bg-card border-border text-card-foreground hover:border-primary/50 transition-colors shadow-sm hover:shadow-md group">
                      <CardContent className="p-6">
                        <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
                          
                          {/* Airline & Flight Number */}
                          <div className="flex items-center gap-4 w-full lg:w-1/4">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                              <Plane className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                              <p className="font-semibold text-lg font-heading">{flight.airline}</p>
                              <Badge variant="outline" className="text-primary border-primary/30 mt-1">{flight.flight_number}</Badge>
                            </div>
                          </div>

                          {/* Time & Route */}
                          <div className="flex flex-1 items-center justify-between w-full">
                            <div className="text-center md:text-left">
                              <p className="text-lg font-bold font-mono">{formatFlightTime(flight.departure_time)}</p>
                              <p className="text-sm text-muted-foreground">{flight.source}</p>
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
                              <p className="text-sm text-muted-foreground">{flight.destination}</p>
                              <p className="text-xs text-muted-foreground/70 mt-1">{formatFlightDate(flight.arrival_time)}</p>
                            </div>
                          </div>

                          {/* Price & Action */}
                          <div className="flex flex-col items-end gap-3 w-full lg:w-1/4 border-t lg:border-t-0 lg:border-l border-border pt-4 lg:pt-0 lg:pl-6">
                            <div className="text-right">
                              <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-end font-mono">
                                <IndianRupee className="w-6 h-6 text-muted-foreground" />{flight.price}
                              </p>
                              <p className="text-sm text-emerald-600 dark:text-emerald-400 flex items-center justify-end gap-1 mt-1">
                                <Users className="w-4 h-4" /> {flight.available_seats} seats left
                              </p>
                            </div>
                            <button 
                              onClick={() => router.push(`/booking/${flight.id}`)}
                              className="w-full py-2 px-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-all shadow-sm hover:shadow-md"
                            >
                              Book Now
                            </button>
                          </div>

                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-muted/20 rounded-xl border border-border border-dashed">
                <Plane className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-medium text-foreground">No flights found</h3>
                <p className="text-muted-foreground mt-2">Try adjusting your search filters</p>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
