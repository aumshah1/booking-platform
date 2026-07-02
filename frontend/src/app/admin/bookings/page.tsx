'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { Loader2, Download, Search, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await api.get('/api/admin/bookings');
        setBookings(res.data.bookings || []);
        setFilteredBookings(res.data.bookings || []);
      } catch (err) {
        console.error('Failed to load bookings');
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, []);

  useEffect(() => {
    let result = bookings;
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(b => 
        b.pnr.toLowerCase().includes(q) || 
        b.flights?.airline?.toLowerCase().includes(q) ||
        b.booking_passengers?.some((p: any) => p.first_name.toLowerCase().includes(q) || p.last_name.toLowerCase().includes(q))
      );
    }
    
    if (statusFilter !== 'All') {
      result = result.filter(b => b.status === statusFilter);
    }
    
    setFilteredBookings(result);
    setCurrentPage(1); // Reset to first page
  }, [searchQuery, statusFilter, bookings]);

  const exportCSV = () => {
    const headers = ['PNR', 'Status', 'Total Passengers', 'Total Amount', 'Flight', 'Booking Date'];
    const rows = filteredBookings.map(b => [
      b.pnr,
      b.status,
      b.total_passengers,
      b.total_amount,
      `${b.flights?.airline} (${b.flights?.flight_number})`,
      new Date(b.created_at).toLocaleDateString()
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'bookings_export.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Pagination Logic
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const currentItems = filteredBookings.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    if (loading) {
      return (
        <div className="flex items-center justify-center h-full min-h-[400px]">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      );
    }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <h2 className="text-2xl font-bold">Manage Bookings</h2>
        <button 
          onClick={exportCSV}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 bg-card p-4 rounded-xl border border-border shadow-sm">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input 
            type="text" 
            placeholder="Search by PNR, Airline, or Passenger Name..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-background border-border text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-muted-foreground" />
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-background border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:border-primary min-w-[150px]"
          >
            <option value="All">All Statuses</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Pending">Pending</option>
            <option value="Cancelled">Cancelled</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="p-4 text-sm font-semibold text-muted-foreground font-heading">PNR</th>
                <th className="p-4 text-sm font-semibold text-muted-foreground font-heading">Flight Info</th>
                <th className="p-4 text-sm font-semibold text-muted-foreground font-heading">Passengers</th>
                <th className="p-4 text-sm font-semibold text-muted-foreground font-heading">Amount</th>
                <th className="p-4 text-sm font-semibold text-muted-foreground font-heading">Date</th>
                <th className="p-4 text-sm font-semibold text-muted-foreground font-heading">Status</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length > 0 ? currentItems.map((booking) => {
                const primaryPassenger = booking.booking_passengers?.[0];
                return (
                  <tr key={booking.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                    <td className="p-4 font-mono text-sm text-primary font-bold">{booking.pnr}</td>
                    <td className="p-4 text-sm">
                      <div className="font-medium text-foreground">{booking.flights?.airline}</div>
                      <div className="text-muted-foreground text-xs">{booking.flights?.origin_airport?.split(' ')[0]} → {booking.flights?.destination_airport?.split(' ')[0]}</div>
                    </td>
                    <td className="p-4 text-sm text-foreground space-y-1">
                      {booking.booking_passengers?.length > 0 
                        ? booking.booking_passengers.map((p: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-2">
                              <span>{p.first_name} {p.last_name}</span>
                              <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground font-medium">{p.passenger_type}</span>
                            </div>
                          ))
                        : <span className="text-muted-foreground">N/A</span>}
                    </td>
                    <td className="p-4 text-sm text-emerald-600 dark:text-emerald-400 font-medium">${booking.total_amount}</td>
                    <td className="p-4 text-sm text-muted-foreground">{new Date(booking.created_at).toLocaleDateString()}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium border ${
                        booking.status === 'Confirmed' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' :
                        booking.status === 'Cancelled' ? 'bg-destructive/10 text-destructive border-destructive/20' :
                        'bg-amber-500/10 text-amber-600 dark:text-amber-500 border-amber-500/20'
                      }`}>
                        {booking.status}
                      </span>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">No bookings found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-border flex items-center justify-between bg-muted/20">
            <div className="text-sm text-muted-foreground">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredBookings.length)} of {filteredBookings.length}
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg bg-background border border-border hover:bg-muted disabled:opacity-50 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg bg-background border border-border hover:bg-muted disabled:opacity-50 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
