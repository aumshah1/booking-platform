import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { supabase } from '../database/supabase';

export const getUserProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  res.status(200).json({ user: req.user });
};

export const getUpcomingTrips = async (req: AuthRequest, res: Response): Promise<void> => {
  const user_id = req.user?.id;
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('bookings')
    .select('*, flights!inner(*)')
    .eq('user_id', user_id)
    .gt('flights.departure_time', now)
    .neq('status', 'Cancelled')
    .order('departure_time', { foreignTable: 'flights', ascending: true })
    .limit(5);

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  // Map to dashboard expected format
  const mapped = data.map(b => ({
    id: b.id,
    flightNumber: b.flights.flight_number,
    origin: b.flights.origin_airport,
    destination: b.flights.destination_airport,
    departureTime: b.flights.departure_time,
    arrivalTime: b.flights.arrival_time,
    status: b.status,
    gate: 'TBD', // mock gate
    seat: b.seat_number
  }));

  res.status(200).json({ data: mapped });
};

export const getRecentBookings = async (req: AuthRequest, res: Response): Promise<void> => {
  const user_id = req.user?.id;

  const { data, error } = await supabase
    .from('bookings')
    .select('*, flights(*)')
    .eq('user_id', user_id)
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  const mapped = data.map(b => ({
    id: b.id,
    date: b.created_at,
    route: `${b.flights.origin_airport.split(' ')[0]} to ${b.flights.destination_airport.split(' ')[0]}`,
    amount: b.total_amount,
    status: b.status
  }));

  res.status(200).json({ data: mapped });
};

export const getNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  const user_id = req.user?.id;

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user_id)
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  const mapped = data.map(n => ({
    id: n.id,
    type: 'alert',
    message: n.message,
    time: new Date(n.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
    isRead: n.is_read
  }));

  res.status(200).json({ data: mapped });
};
