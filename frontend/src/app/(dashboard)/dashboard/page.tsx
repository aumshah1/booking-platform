'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Plane, CalendarDays, Bell, UserCircle, CreditCard, Search, ArrowRight, Activity } from 'lucide-react';
import api from '@/lib/axios';
import { motion } from 'framer-motion';

export default function DashboardPage() {
  const { user } = useAuth();
  
  const [upcomingTrips, setUpcomingTrips] = useState<any[]>([]);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [tripsRes, bookingsRes, notifsRes] = await Promise.all([
          api.get('/api/dashboard/upcoming-trips'),
          api.get('/api/dashboard/recent-bookings'),
          api.get('/api/dashboard/notifications'),
        ]);

        setUpcomingTrips(tripsRes.data.data);
        setRecentBookings(bookingsRes.data.data);
        setNotifications(notifsRes.data.data);
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 transition-colors duration-300">
        <Navbar />
        
        <main className="relative flex flex-col items-center pt-28 px-4 pb-12 overflow-hidden min-h-screen">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] -z-10 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary/20 rounded-full blur-[100px] -z-10 pointer-events-none" />

          <div className="w-full max-w-6xl space-y-8 z-10">
            
            {/* Welcome Section */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between"
            >
              <div>
                <h1 className="text-4xl font-bold tracking-tight text-foreground mb-2 font-heading">
                  Welcome back, <span className="text-primary">{user?.email?.split('@')[0]}</span>!
                </h1>
                <p className="text-muted-foreground">Manage your flights, bookings, and account details here.</p>
              </div>
              <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20 px-4 py-1.5 text-sm rounded-full">
                {user?.user_metadata?.role || 'Passenger'} Account
              </Badge>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Main Content Area: Upcoming Trips & Recent Bookings */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Upcoming Trips Card */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
                  <Card className="bg-card border-border text-card-foreground shadow-sm hover:shadow-md transition-all overflow-hidden">
                    <CardHeader className="border-b border-border bg-muted/30">
                      <CardTitle className="flex items-center gap-2 font-heading">
                        <Plane className="text-primary w-5 h-5" />
                        Upcoming Trips
                      </CardTitle>
                      <CardDescription>Your next scheduled flights</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                      {loading ? (
                        <div className="p-6 space-y-4">
                          <Skeleton className="h-24 w-full bg-muted rounded-xl" />
                        </div>
                      ) : upcomingTrips.length > 0 ? (
                        <div className="divide-y divide-border">
                          {upcomingTrips.map((trip) => (
                            <div key={trip.id} className="p-6 hover:bg-muted/50 transition-colors">
                              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div>
                                  <div className="flex items-center gap-3 mb-2">
                                    <Badge variant="outline" className="text-primary border-primary/30">{trip.flightNumber}</Badge>
                                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                                      <CalendarDays className="w-4 h-4" /> 
                                      {new Date(trip.departureTime).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-4 text-lg font-medium">
                                    <span>{trip.origin}</span>
                                    <ArrowRight className="w-5 h-5 text-muted-foreground" />
                                    <span>{trip.destination}</span>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm text-muted-foreground mb-1">Status</p>
                                  <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/30">{trip.status}</Badge>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-8 text-center text-muted-foreground">
                          <p>No upcoming trips found.</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Recent Bookings Card */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
                  <Card className="bg-card border-border text-card-foreground shadow-sm hover:shadow-md transition-all">
                    <CardHeader className="border-b border-border bg-muted/30">
                      <CardTitle className="flex items-center gap-2 font-heading">
                        <Activity className="text-primary w-5 h-5" />
                        Recent Bookings
                      </CardTitle>
                      <CardDescription>Your latest transactions</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                      {loading ? (
                        <div className="space-y-4">
                          <Skeleton className="h-12 w-full bg-muted rounded-lg" />
                          <Skeleton className="h-12 w-full bg-muted rounded-lg" />
                        </div>
                      ) : recentBookings.length > 0 ? (
                        <div className="space-y-4">
                          {recentBookings.map((booking) => (
                            <div key={booking.id} className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border border-border hover:border-primary/30 transition-colors">
                              <div className="flex items-center gap-4">
                                <div className="p-2 bg-primary/10 rounded-full text-primary">
                                  <CreditCard className="w-5 h-5" />
                                </div>
                                <div>
                                  <p className="font-medium">{booking.route}</p>
                                  <p className="text-xs text-muted-foreground">{new Date(booking.date).toLocaleDateString()}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-medium">${booking.amount.toFixed(2)}</p>
                                <span className="text-xs text-emerald-600 dark:text-emerald-400">{booking.status}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center text-muted-foreground py-4">No recent bookings.</div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>

              </div>

              {/* Sidebar: Quick Actions & Notifications */}
              <div className="space-y-6">
                
                {/* Quick Actions */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
                  <Card className="bg-card border-border text-card-foreground shadow-sm hover:shadow-md transition-all">
                    <CardHeader>
                      <CardTitle className="font-heading">Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <button onClick={() => window.location.href = '/flights'} className="w-full flex items-center gap-3 p-3 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-colors">
                        <Search className="w-5 h-5" />
                        <span className="font-medium">Search Flights</span>
                      </button>
                      <button onClick={() => window.location.href = '/trips'} className="w-full flex items-center gap-3 p-3 rounded-lg bg-muted hover:bg-muted/80 border border-border text-foreground transition-colors">
                        <CalendarDays className="w-5 h-5 text-muted-foreground" />
                        <span className="font-medium">My Bookings</span>
                      </button>
                      <button className="w-full flex items-center gap-3 p-3 rounded-lg bg-muted hover:bg-muted/80 border border-border text-foreground transition-colors">
                        <UserCircle className="w-5 h-5 text-muted-foreground" />
                        <span className="font-medium">Profile Settings</span>
                      </button>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Notifications */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }}>
                  <Card className="bg-card border-border text-card-foreground shadow-sm hover:shadow-md transition-all">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 font-heading">
                        <Bell className="text-amber-500 w-5 h-5" />
                        Notifications
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {loading ? (
                        <div className="space-y-4">
                          <Skeleton className="h-16 w-full bg-muted rounded-lg" />
                          <Skeleton className="h-16 w-full bg-muted rounded-lg" />
                        </div>
                      ) : notifications.length > 0 ? (
                        <div className="space-y-3">
                          {notifications.map((notif) => (
                            <div key={notif.id} className="p-3 rounded-lg bg-muted/50 border border-border">
                              <p className="text-sm font-medium">{notif.message}</p>
                              <p className="text-xs text-muted-foreground mt-2">{new Date(notif.timestamp).toLocaleString()}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-sm text-center">You're all caught up!</p>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>

              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
