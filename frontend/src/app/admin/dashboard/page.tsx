'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, IndianRupee, Users, Plane, XCircle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';

export default function AdminDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.get('/api/admin/analytics');
        setData(res.data);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg">
        {error}
      </div>
    );
  }

  const { metrics, revenueOverTime, topRoutes, bookingStatus } = data;
  const PIE_COLORS = ['#3b82f6', '#ef4444'];

  return (
    <div className="space-y-6">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-border text-card-foreground shadow-sm hover:shadow-lg transition-all relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium font-heading text-muted-foreground">Total Revenue</CardTitle>
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <IndianRupee className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
          </CardHeader>
          <CardContent className="pt-4 relative z-10">
            <div className="text-3xl font-bold font-mono tracking-tight">₹{metrics.totalRevenue.toLocaleString()}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border text-card-foreground shadow-sm hover:shadow-lg transition-all relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium font-heading text-muted-foreground">Total Bookings</CardTitle>
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Plane className="w-4 h-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="pt-4 relative z-10">
            <div className="text-3xl font-bold font-mono tracking-tight">{metrics.totalBookings.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border text-card-foreground shadow-sm hover:shadow-lg transition-all relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium font-heading text-muted-foreground">Avg Occupancy</CardTitle>
            <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center">
              <Users className="w-4 h-4 text-purple-500 dark:text-purple-400" />
            </div>
          </CardHeader>
          <CardContent className="pt-4 relative z-10">
            <div className="text-3xl font-bold font-mono tracking-tight">{metrics.occupancyRate}%</div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border text-card-foreground shadow-sm hover:shadow-lg transition-all relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-destructive/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium font-heading text-muted-foreground">Cancelled</CardTitle>
            <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center">
              <XCircle className="w-4 h-4 text-destructive" />
            </div>
          </CardHeader>
          <CardContent className="pt-4 relative z-10">
            <div className="text-3xl font-bold font-mono tracking-tight">{metrics.cancelledBookings.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <Card className="bg-card border-border text-card-foreground shadow-sm lg:col-span-2 hover:shadow-md transition-all">
          <CardHeader className="bg-muted/30 border-b border-border">
            <CardTitle className="text-base font-semibold font-heading">Revenue Over Time (Mocked Forecast)</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] pt-6">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueOverTime} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)', color: 'var(--color-card-foreground)', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: 'var(--color-primary)' }}
                  formatter={(val: any) => [`₹${val}`, 'Revenue']}
                />
                <Area type="monotone" dataKey="revenue" stroke="var(--color-primary)" fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Booking Status Pie Chart */}
        <Card className="bg-card border-border text-card-foreground shadow-sm hover:shadow-md transition-all">
          <CardHeader className="bg-muted/30 border-b border-border">
            <CardTitle className="text-base font-semibold font-heading">Booking Status</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center pt-6">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={bookingStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {bookingStatus.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)', color: 'var(--color-card-foreground)', borderRadius: '8px' }} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: 'var(--color-muted-foreground)' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Routes Bar Chart */}
      <Card className="bg-card border-border text-card-foreground shadow-sm hover:shadow-md transition-all">
        <CardHeader className="bg-muted/30 border-b border-border">
          <CardTitle className="text-base font-semibold font-heading">Top Routes by Passenger Volume</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] pt-6">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topRoutes} layout="vertical" margin={{ top: 0, right: 30, left: 60, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
              <XAxis type="number" stroke="var(--color-muted-foreground)" fontSize={12} />
              <YAxis dataKey="name" type="category" stroke="var(--color-muted-foreground)" fontSize={12} width={100} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)', color: 'var(--color-card-foreground)', borderRadius: '8px' }}
                cursor={{ fill: 'var(--color-muted)' }}
              />
              <Bar dataKey="passengers" fill="var(--color-primary)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
