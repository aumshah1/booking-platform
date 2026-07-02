import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { supabase } from '../database/supabase';
import crypto from 'crypto';

const generatePNR = () => crypto.randomBytes(3).toString('hex').toUpperCase();
const generateTicketNumber = () => Math.floor(1000000000000 + Math.random() * 9000000000000).toString();

export const createBooking = async (req: AuthRequest, res: Response): Promise<void> => {
  const { flight_id, passengers, total_amount } = req.body;
  const user_id = req.user?.id;

  if (!user_id) return { res: res.status(401).json({ error: 'Unauthorized' }) } as any;

  if (!passengers || !Array.isArray(passengers) || passengers.length === 0) {
    return { res: res.status(400).json({ error: 'Passengers are required' }) } as any;
  }

  const adults = passengers.filter(p => p.passenger_type === 'ADULT').length;
  const children = passengers.filter(p => p.passenger_type === 'CHILD').length;
  const infants = passengers.filter(p => p.passenger_type === 'INFANT').length;

  if (adults === 0) return { res: res.status(400).json({ error: 'At least one Adult is required' }) } as any;
  if (infants > adults) return { res: res.status(400).json({ error: 'Number of infants cannot exceed adults' }) } as any;
  if (passengers.length > 9) return { res: res.status(400).json({ error: 'Maximum 9 passengers allowed per booking' }) } as any;

  // Validate seats availability (excluding infants who don't need a seat)
  const seatRequiringPassengers = passengers.filter(p => p.passenger_type !== 'INFANT');
  const seatNumbers = seatRequiringPassengers.map(p => p.seat_number).filter(Boolean) as string[];
  
  if (seatNumbers.length !== new Set(seatNumbers).size) {
     return { res: res.status(400).json({ error: 'Duplicate seats selected' }) } as any;
  }

  // Check flight capacity
  const { data: flight, error: flightError } = await supabase.from('flights').select('flight_number').eq('id', flight_id).single();
  if (flightError || !flight) {
    return { res: res.status(400).json({ error: 'Flight not found' }) } as any;
  }

  // ----------------------------------------------------
  // CONCURRENCY-SAFE SEAT RESERVATION (Optimistic Locking)
  // ----------------------------------------------------
  
  // Step 1: Attempt to atomically reserve all requested seats
  let reservedSeats: any[] = [];
  
  if (seatNumbers.length > 0) {
    const { data: updatedSeats, error: reserveError } = await supabase
      .from('flight_seats')
      .update({ status: 'RESERVED' }) // Temporarily reserve
      .eq('flight_id', flight_id)
      .eq('status', 'AVAILABLE') // Only update if currently available
      .in('seat_number', seatNumbers)
      .select();

    if (reserveError) {
      return { res: res.status(500).json({ error: 'Failed to verify seats' }) } as any;
    }

    reservedSeats = updatedSeats || [];

    // Check if ALL requested seats were successfully reserved
    if (reservedSeats.length !== seatNumbers.length) {
      // Conflict! Some seats were already taken. Rollback any we managed to reserve.
      if (reservedSeats.length > 0) {
        await supabase
          .from('flight_seats')
          .update({ status: 'AVAILABLE' })
          .in('id', reservedSeats.map((s: any) => s.id));
      }
      
      const reservedNumbers = reservedSeats.map((s: any) => s.seat_number);
      const unavailableSeats = seatNumbers.filter(sn => !reservedNumbers.includes(sn));
      
      return { 
        res: res.status(409).json({ 
          success: false,
          code: 'SEAT_ALREADY_BOOKED',
          message: `Seats ${unavailableSeats.join(', ')} are no longer available. Please choose another seat.` 
        }) 
      } as any;
    }
  }

  // Generate PNR
  const pnr = generatePNR();

  // Create Booking
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .insert([{
      user_id,
      flight_id,
      pnr,
      total_passengers: passengers.length,
      adults,
      children,
      infants,
      status: 'Confirmed',
      total_amount
    }])
    .select()
    .single();

  if (bookingError || !booking) {
    // Rollback reserved seats
    if (reservedSeats.length > 0) {
      await supabase.from('flight_seats').update({ status: 'AVAILABLE' }).in('id', reservedSeats.map(s => s.id));
    }
    return { res: res.status(500).json({ error: 'Failed to create booking: ' + bookingError?.message }) } as any;
  }

  // Create booking_passengers
  const insertPassengers = passengers.map(p => ({
    booking_id: booking.id,
    passenger_type: p.passenger_type,
    title: p.title,
    first_name: p.first_name,
    last_name: p.last_name,
    gender: p.gender,
    date_of_birth: p.date_of_birth,
    nationality: p.nationality,
    passport_number: p.passport_number,
    seat_number: p.passenger_type === 'INFANT' ? null : p.seat_number,
    meal_preference: p.meal_preference,
    special_assistance: p.special_assistance,
    ticket_number: generateTicketNumber()
  }));

  const { data: createdPassengers, error: passError } = await supabase
    .from('booking_passengers')
    .insert(insertPassengers)
    .select();

  if (passError) {
    // Rollback reserved seats and the created booking
    if (reservedSeats.length > 0) {
      await supabase.from('flight_seats').update({ status: 'AVAILABLE' }).in('id', reservedSeats.map(s => s.id));
    }
    await supabase.from('bookings').delete().eq('id', booking.id);
    return { res: res.status(500).json({ error: 'Failed to add passengers: ' + passError.message }) } as any;
  }

  // Update flight_seats to BOOKED and link to booking_passenger_id
  if (createdPassengers && reservedSeats.length > 0) {
    for (const pax of createdPassengers) {
      if (pax.seat_number) {
        await supabase
          .from('flight_seats')
          .update({ status: 'BOOKED', booking_id: booking.id, booking_passenger_id: pax.id })
          .eq('flight_id', flight_id)
          .eq('seat_number', pax.seat_number);
      }
    }
  }



  // Send Booking Success Notification
  await supabase.from('notifications').insert([{
    user_id,
    title: 'Booking Confirmed!',
    message: `Your booking for flight ${flight.flight_number || flight_id} is confirmed. PNR: ${pnr}`
  }]);

  res.status(201).json({ data: { ...booking, passengers: createdPassengers } });
};

export const getBooking = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const user_id = req.user?.id;
  if (!user_id) return { res: res.status(401).json({ error: 'Unauthorized' }) } as any;

  const { data, error } = await supabase
    .from('bookings')
    .select('*, flights (*), booking_passengers (*)')
    .eq('id', id)
    .eq('user_id', user_id)
    .single();

  if (error || !data) return { res: res.status(404).json({ error: 'Booking not found' }) } as any;
  res.status(200).json({ data });
};

export const getMyTrips = async (req: AuthRequest, res: Response): Promise<void> => {
  const user_id = req.user?.id;
  if (!user_id) return { res: res.status(401).json({ error: 'Unauthorized' }) } as any;

  const { data, error } = await supabase
    .from('bookings')
    .select('*, flights (*), booking_passengers (*)')
    .eq('user_id', user_id)
    .order('created_at', { ascending: false });

  if (error) return { res: res.status(500).json({ error: error.message }) } as any;

  const upcoming: any[] = [];
  const completed: any[] = [];
  const cancelled: any[] = [];
  const now = new Date();

  data?.forEach((booking) => {
    if (booking.status === 'Cancelled') {
      cancelled.push(booking);
      return;
    }
    const flightDate = new Date(booking.flights.departure_time);
    if (flightDate > now) upcoming.push(booking);
    else completed.push(booking);
  });

  res.status(200).json({ data: { upcoming, completed, cancelled } });
};

export const cancelBooking = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const user_id = req.user?.id;
  if (!user_id) return { res: res.status(401).json({ error: 'Unauthorized' }) } as any;

  const { data: booking, error: fetchError } = await supabase.from('bookings').select('*, flights(*), booking_passengers(*)').eq('id', id).single();
  if (fetchError || !booking) return { res: res.status(404).json({ error: 'Booking not found' }) } as any;
  if (booking.status === 'Cancelled') return { res: res.status(400).json({ error: 'Already cancelled' }) } as any;

  await supabase.from('bookings').update({ status: 'Cancelled' }).eq('id', id);
  await supabase.from('flight_seats').update({ status: 'AVAILABLE', passenger_id: null, booking_id: null, booking_passenger_id: null }).eq('booking_id', id);
  
  await supabase.from('flight_seats').update({ status: 'AVAILABLE', passenger_id: null, booking_id: null, booking_passenger_id: null }).eq('booking_id', id);

  await supabase.from('notifications').insert([{
    user_id,
    title: 'Booking Cancelled',
    message: `Your booking for ${booking.flights.airline} flight ${booking.flights.flight_number} has been cancelled.`
  }]);

  res.status(200).json({ message: 'Booking cancelled successfully' });
};

export const changeSeat = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { passengerId, newSeat } = req.body; 
  const user_id = req.user?.id;
  if (!user_id) return { res: res.status(401).json({ error: 'Unauthorized' }) } as any;

  const { data: booking, error: fetchError } = await supabase.from('bookings').select('*, flights(*)').eq('id', id).single();
  if (fetchError || !booking) return { res: res.status(404).json({ error: 'Booking not found' }) } as any;

  const { data: passenger, error: passError } = await supabase.from('booking_passengers').select('*').eq('id', passengerId).eq('booking_id', id).single();
  if (passError || !passenger) return { res: res.status(404).json({ error: 'Passenger not found in booking' }) } as any;

  const oldSeat = passenger.seat_number;
  if (!oldSeat) return { res: res.status(400).json({ error: 'Passenger does not have an active seat to change' }) } as any;

  const { data: newSeatData, error: newSeatError } = await supabase
    .from('flight_seats')
    .update({ status: 'RESERVED' }) // Temporarily reserve
    .eq('flight_id', booking.flight_id)
    .eq('seat_number', newSeat)
    .eq('status', 'AVAILABLE') // Optimistic lock
    .select()
    .single();

  if (newSeatError || !newSeatData) {
    return { 
      res: res.status(409).json({ 
        success: false, 
        code: 'SEAT_ALREADY_BOOKED',
        message: 'The selected seat is no longer available. Please choose another.' 
      }) 
    } as any;
  }

  // Release old seat
  await supabase.from('flight_seats').update({ status: 'AVAILABLE', passenger_id: null, booking_id: null, booking_passenger_id: null }).eq('flight_id', booking.flight_id).eq('seat_number', oldSeat);
  
  // Finalize new seat
  await supabase.from('flight_seats').update({ status: 'BOOKED', booking_id: id, booking_passenger_id: passengerId }).eq('id', newSeatData.id);
  await supabase.from('booking_passengers').update({ seat_number: newSeat }).eq('id', passengerId);

  await supabase.from('notifications').insert([{
    user_id,
    title: 'Seat Updated',
    message: `Seat for ${passenger.first_name} on flight ${booking.flights.flight_number} has been changed to ${newSeat}.`
  }]);

  res.status(200).json({ message: 'Seat changed successfully', seat: newSeat });
};

export const rescheduleFlight = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { newFlightId } = req.body;
  const user_id = req.user?.id;

  if (!user_id) return { res: res.status(401).json({ error: 'Unauthorized' }) } as any;

  const { data: booking, error: fetchError } = await supabase.from('bookings').select('*, flights(*), booking_passengers(*)').eq('id', id).single();
  if (fetchError || !booking) return { res: res.status(404).json({ error: 'Booking not found' }) } as any;

  const seatRequiring = booking.booking_passengers.filter((p: any) => p.passenger_type !== 'INFANT').length;

  const { data: newFlight, error: nfError } = await supabase.from('flights').select('*').eq('id', newFlightId).single();
  if (nfError || !newFlight) {
    return { res: res.status(400).json({ error: 'New flight unavailable' }) } as any;
  }

  // Update booking
  await supabase.from('bookings').update({ flight_id: newFlightId }).eq('id', id);

  await supabase.from('flight_seats').update({ status: 'AVAILABLE', booking_id: null, booking_passenger_id: null }).eq('booking_id', id);
  await supabase.from('booking_passengers').update({ seat_number: null }).eq('booking_id', id);

  await supabase.from('notifications').insert([{
    user_id,
    title: 'Flight Rescheduled',
    message: `Your booking has been rescheduled to flight ${newFlight.flight_number}. Please select your seats.`
  }]);

  res.status(200).json({ message: 'Flight rescheduled successfully' });
};
