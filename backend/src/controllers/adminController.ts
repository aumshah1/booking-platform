import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { supabase } from '../database/supabase';
import { createClient } from '@supabase/supabase-js';

// --- Analytics ---

export const getAnalytics = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Basic aggregation
    // 1. Total Revenue (sum of all bookings amount where status != Cancelled)
    const { data: revenueData, error: revError } = await supabase
      .from('bookings')
      .select('total_amount')
      .neq('status', 'Cancelled');

    const totalRevenue = revenueData ? revenueData.reduce((acc, curr) => acc + Number(curr.total_amount), 0) : 0;

    // 2. Total Bookings
    const { count: totalBookings, error: bookError } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true });

    // 3. Cancelled Flights / Bookings
    const { count: cancelledBookings, error: cancelError } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'Cancelled');

    // 4. Occupancy Rate
    const { count: totalSeats } = await supabase.from('flight_seats').select('*', { count: 'exact', head: true });
    const { count: bookedSeats } = await supabase.from('flight_seats').select('*', { count: 'exact', head: true }).neq('status', 'AVAILABLE');
    const occupancyRate = (totalSeats && totalSeats > 0) ? ((bookedSeats || 0) / totalSeats) * 100 : 0;

    // 5. Top Routes
    // Group by origin -> destination
    const { data: allFlights } = await supabase.from('flights').select('id, origin_airport, destination_airport');
    const { data: allBookings } = await supabase.from('bookings').select('flight_id, total_passengers').neq('status', 'Cancelled');
    
    const routeCounts: Record<string, number> = {};
    if (allFlights && allBookings) {
      allBookings.forEach(b => {
        const flight = allFlights.find(f => f.id === b.flight_id);
        if (flight) {
          const route = `${flight.origin_airport} - ${flight.destination_airport}`;
          routeCounts[route] = (routeCounts[route] || 0) + b.total_passengers;
        }
      });
    }

    const topRoutes = Object.entries(routeCounts).map(([route, passengers]) => ({ name: route, passengers })).sort((a, b) => b.passengers - a.passengers).slice(0, 5);

    // 6. Recent Revenue Data (mocked based on actual total revenue for charts)
    // Distribute total revenue across the last 6 months randomly just for visual charting
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    let remaining = totalRevenue;
    const revenueOverTime = months.map((month, i) => {
      if (i === months.length - 1) return { name: month, revenue: remaining };
      const val = Math.floor(Math.random() * (remaining / 2));
      remaining -= val;
      return { name: month, revenue: val };
    });

    res.status(200).json({
      metrics: {
        totalRevenue,
        totalBookings: totalBookings || 0,
        cancelledBookings: cancelledBookings || 0,
        occupancyRate: Math.round(occupancyRate * 10) / 10
      },
      topRoutes,
      revenueOverTime,
      bookingStatus: [
        { name: 'Confirmed', value: (totalBookings || 0) - (cancelledBookings || 0) },
        { name: 'Cancelled', value: cancelledBookings || 0 }
      ]
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// --- Users Management ---

export const getUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      // Return a mock user if service role key is missing to avoid blocking UI development
      res.status(200).json({
        users: [{ id: 'mock', email: 'service_role_key_missing@example.com', created_at: new Date().toISOString(), user_metadata: { role: 'Passenger' } }],
        error: 'SUPABASE_SERVICE_ROLE_KEY is required to list users.'
      });
      return;
    }

    const adminClient = createClient(process.env.SUPABASE_URL || '', serviceRoleKey);
    const { data, error } = await adminClient.auth.admin.listUsers();

    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }

    res.status(200).json({ users: data.users });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      res.status(501).json({ error: 'Service role key missing' });
      return;
    }

    const adminClient = createClient(process.env.SUPABASE_URL || '', serviceRoleKey);
    const { error } = await adminClient.auth.admin.deleteUser(id as string);

    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// --- Bookings Management ---

export const getAllBookings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*, flights(airline_name, flight_number, origin_airport, destination_airport, departure_time), booking_passengers(first_name, last_name, passenger_type)')
      .order('created_at', { ascending: false });

    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }

    res.status(200).json({ bookings: data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// --- Customer Feedback Management ---

export const getFeedback = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('customer_feedback')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }

    res.status(200).json({ feedback: data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateFeedbackStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const { data, error } = await supabase
      .from('customer_feedback')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }

    res.status(200).json({ message: 'Status updated', feedback: data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
