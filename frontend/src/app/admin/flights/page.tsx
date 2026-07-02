'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { Loader2, Plus, Plane, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { formatFlightDateTime } from '@/lib/dateUtils';

export default function AdminFlightsPage() {
  const [flights, setFlights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFlights = async () => {
      try {
        const res = await api.get('/api/flights/search');
        setFlights(res.data.data || []);
      } catch (err) {
        toast.error('Failed to load flights');
      } finally {
        setLoading(false);
      }
    };
    fetchFlights();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this flight?')) return;
    try {
      await api.delete(`/api/flights/${id}`);
      setFlights(flights.filter(f => f.id !== id));
      toast.success('Flight deleted successfully');
    } catch (err) {
      toast.error('Failed to delete flight');
    }
  };

  const handleEdit = async (flight: any) => {
    const newStatus = prompt('Enter new status (SCHEDULED, BOARDING, DELAYED, CANCELLED, COMPLETED):', flight.status);
    if (newStatus && newStatus !== flight.status) {
      try {
        await api.put(`/api/flights/${flight.id}`, { status: newStatus.toUpperCase() });
        setFlights(flights.map(f => f.id === flight.id ? { ...f, status: newStatus.toUpperCase() } : f));
        toast.success('Flight status updated');
      } catch (err) {
        toast.error('Failed to update flight');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2 font-heading"><Plane className="w-6 h-6 text-primary" /> Manage Flights</h2>
        <Link 
          href="/admin/flights/add"
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Flight
        </Link>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="p-4 text-sm font-semibold text-muted-foreground font-heading">Airline</th>
                <th className="p-4 text-sm font-semibold text-muted-foreground font-heading">Flight No.</th>
                <th className="p-4 text-sm font-semibold text-muted-foreground font-heading">Route</th>
                <th className="p-4 text-sm font-semibold text-muted-foreground font-heading">Departure</th>
                <th className="p-4 text-sm font-semibold text-muted-foreground font-heading">Price</th>
                <th className="p-4 text-sm font-semibold text-muted-foreground font-heading">Seats</th>
                <th className="p-4 text-sm font-semibold text-muted-foreground font-heading">Status</th>
                <th className="p-4 text-sm font-semibold text-muted-foreground font-heading text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {flights.map((flight) => (
                <tr key={flight.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                  <td className="p-4 font-medium text-foreground">{flight.airline_name}</td>
                  <td className="p-4 text-muted-foreground font-mono">{flight.flight_number}</td>
                  <td className="p-4 text-muted-foreground">{flight.origin_airport} → {flight.destination_airport}</td>
                  <td className="p-4 text-sm text-muted-foreground">{formatFlightDateTime(flight.departure_time)}</td>
                  <td className="p-4 text-emerald-600 dark:text-emerald-400 font-medium">₹{flight.base_price}</td>
                  <td className="p-4 text-muted-foreground">{flight.aircrafts?.total_seats || 'N/A'}</td>
                  <td className="p-4 text-muted-foreground">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${flight.status === 'SCHEDULED' ? 'bg-primary/10 text-primary' : flight.status === 'CANCELLED' ? 'bg-destructive/10 text-destructive' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'}`}>
                      {flight.status || 'SCHEDULED'}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button onClick={() => handleEdit(flight)} className="p-2 bg-primary/10 text-primary rounded hover:bg-primary/20 transition-colors">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(flight.id)} className="p-2 bg-destructive/10 text-destructive rounded hover:bg-destructive/20 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
