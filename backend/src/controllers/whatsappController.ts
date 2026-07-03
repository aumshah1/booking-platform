import { Request, Response } from 'express';
import twilio from 'twilio';
import { supabase } from '../database/supabase';

const MessagingResponse = twilio.twiml.MessagingResponse;

// ── State machine states ────────────────────────────────────────────────────
type ConvState =
  | 'IDLE'
  | 'SEARCH_ORIGIN'
  | 'SEARCH_DEST'
  | 'SEARCH_DATE'
  | 'CANCEL_CONFIRM'
  | 'SEAT_PNR'
  | 'SEAT_NEW';

interface WaSession {
  state: ConvState;
  context: Record<string, any>;
}

// ── Helpers ─────────────────────────────────────────────────────────────────
const getSession = async (phone: string): Promise<WaSession> => {
  const { data } = await supabase
    .from('wa_sessions')
    .select('state, context')
    .eq('phone_number', phone)
    .single();

  return data || { state: 'IDLE', context: {} };
};

const saveSession = async (phone: string, state: ConvState, context: Record<string, any>) => {
  await supabase.from('wa_sessions').upsert(
    { phone_number: phone, state, context, updated_at: new Date().toISOString() },
    { onConflict: 'phone_number' }
  );
};

const resetSession = (phone: string) => saveSession(phone, 'IDLE', {});

const formatFlightList = (flights: any[]) => {
  if (!flights || flights.length === 0) return '❌ No flights found for those details.';
  return flights
    .slice(0, 5)
    .map((f: any, i: number) => {
      const dep = new Date(f.departure_time).toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit',
      });
      return `${i + 1}️⃣ *${f.flight_number}* — ${f.source} → ${f.destination}\n   ⏰ ${dep} IST | 💺 ${f.available_seats} seats | ₹${f.price}`;
    })
    .join('\n\n');
};

const getBookingByPnr = async (pnr: string) => {
  const { data } = await supabase
    .from('bookings')
    .select('*, flights(*), booking_passengers(*)')
    .eq('pnr', pnr.toUpperCase())
    .single();
  return data;
};

const mainMenu = () =>
  `✈️ *Welcome to BlueWings Connect!*\n\nHow can I help you today? Reply with a number:\n\n1️⃣ Search & Book Flights\n2️⃣ My Booking Status\n3️⃣ Get Boarding Pass Info\n4️⃣ Cancel a Booking\n5️⃣ Change Seat\n0️⃣ Talk to Agent\n\n_Type your PNR directly to check any booking._`;

// ── Main webhook handler ─────────────────────────────────────────────────────
export const whatsappWebhook = async (req: Request, res: Response): Promise<void> => {
  const twiml = new MessagingResponse();
  const incomingMsg = (req.body.Body || '').trim();
  const from: string = req.body.From || ''; // e.g. "whatsapp:+918980647309"
  const phone = from.replace('whatsapp:', '');

  const session = await getSession(phone);
  const msg = incomingMsg.toLowerCase();

  let reply = '';

  // ── Global shortcuts ────────────────────────────────────────────────────
  if (msg === 'menu' || msg === 'hi' || msg === 'hello' || msg === 'start' || msg === '00') {
    await resetSession(phone);
    reply = mainMenu();
    twiml.message(reply);
    res.type('text/xml').send(twiml.toString());
    return;
  }

  // ── Auto-detect PNR (6+ alphanumeric) ───────────────────────────────────
  if (/^[A-Z0-9]{6,10}$/i.test(incomingMsg) && session.state === 'IDLE') {
    const booking = await getBookingByPnr(incomingMsg);
    if (booking) {
      const flight = booking.flights;
      const paxList = booking.booking_passengers
        ?.map((p: any) => `• ${p.first_name} ${p.last_name} — Seat *${p.seat_number || 'Unassigned'}*`)
        .join('\n') || '';

      const dep = new Date(flight.departure_time).toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short',
      });

      reply =
        `✅ *Booking Found!*\n\n` +
        `📋 PNR: *${booking.pnr}*\n` +
        `✈️ ${flight.airline_name} *${flight.flight_number}*\n` +
        `🛫 ${flight.origin_airport} → ${flight.destination_airport}\n` +
        `📅 ${dep} IST\n` +
        `📊 Status: *${booking.status}*\n\n` +
        `*Passengers:*\n${paxList}\n\n` +
        `Reply:\n1️⃣ Cancel Booking\n2️⃣ Change Seat\n3️⃣ Main Menu`;

      await saveSession(phone, 'IDLE', { pnr: booking.pnr });
      twiml.message(reply);
      res.type('text/xml').send(twiml.toString());
      return;
    }
  }

  // ── State machine ────────────────────────────────────────────────────────
  switch (session.state) {
    // ── IDLE: handle menu choices ──────────────────────────────────────────
    case 'IDLE': {
      if (msg === '1' || msg.includes('search') || msg.includes('book')) {
        await saveSession(phone, 'SEARCH_ORIGIN', {});
        reply = `🛫 *Search Flights*\n\nPlease enter your *departure city or airport code*:\n_(Example: Mumbai, BOM, Delhi, DEL)_`;
      } else if (msg === '2' || msg.includes('booking') || msg.includes('status')) {
        reply = `📋 *My Bookings*\n\nPlease enter your *PNR / Booking Reference*:\n_(Example: 746980)_\n\nOr type *MENU* to go back.`;
      } else if (msg === '3' || msg.includes('boarding')) {
        reply = `🎫 *Boarding Pass*\n\nPlease enter your *PNR* and we'll show your boarding details:\n_(Example: 746980)_`;
      } else if (msg === '4' || msg.includes('cancel')) {
        await saveSession(phone, 'CANCEL_CONFIRM', {});
        reply = `❌ *Cancel Booking*\n\nPlease enter the *PNR* of the booking you want to cancel:`;
      } else if (msg === '5' || msg.includes('seat')) {
        await saveSession(phone, 'SEAT_PNR', {});
        reply = `💺 *Change Seat*\n\nPlease enter your *PNR*:`;
      } else if (msg === '0' || msg.includes('agent') || msg.includes('human')) {
        reply =
          `👤 *Live Agent*\n\n` +
          `Connecting you to our support team...\n\n` +
          `📞 Call: +91 8980647309\n` +
          `🌐 Web: bluewingsconnect.com/contact\n` +
          `⏰ Available: 24/7\n\n` +
          `Or type *MENU* to go back.`;
      } else {
        reply = mainMenu();
      }
      break;
    }

    // ── Flight Search: Origin ──────────────────────────────────────────────
    case 'SEARCH_ORIGIN': {
      await saveSession(phone, 'SEARCH_DEST', { origin: incomingMsg });
      reply = `✅ Origin: *${incomingMsg}*\n\nNow enter your *destination city or airport*:`;
      break;
    }

    // ── Flight Search: Destination ─────────────────────────────────────────
    case 'SEARCH_DEST': {
      await saveSession(phone, 'SEARCH_DATE', { ...session.context, destination: incomingMsg });
      reply = `✅ Destination: *${incomingMsg}*\n\nEnter your *travel date*:\n_(Format: YYYY-MM-DD, e.g. 2026-07-20)_\n\nOr type *ANY* to see all upcoming flights.`;
      break;
    }

    // ── Flight Search: Date → Show results ────────────────────────────────
    case 'SEARCH_DATE': {
      const { origin, destination } = session.context;
      const date = msg === 'any' ? '' : incomingMsg;

      try {
        const qs = new URLSearchParams();
        if (origin) qs.set('origin', origin);
        if (destination) qs.set('destination', destination);
        if (date) qs.set('date', date);

        const { data: flights } = await supabase
          .from('flights')
          .select('*, aircrafts(*)')
          .ilike('origin_airport', `%${origin}%`)
          .ilike('destination_airport', `%${destination}%`)
          .gte('departure_time', new Date().toISOString())
          .neq('status', 'CANCELLED')
          .order('departure_time')
          .limit(5);

        // Count available seats
        const formatted = await Promise.all((flights || []).map(async (f: any) => {
          const { count } = await supabase
            .from('flight_seats')
            .select('*', { count: 'exact', head: true })
            .eq('flight_id', f.id)
            .eq('status', 'AVAILABLE');
          return {
            flight_number: f.flight_number,
            source: f.origin_airport,
            destination: f.destination_airport,
            departure_time: f.departure_time,
            price: f.base_price,
            available_seats: count || 0,
          };
        }));

        const flightList = formatFlightList(formatted);
        reply =
          `✈️ *Available Flights*\n${origin.toUpperCase()} → ${destination.toUpperCase()}\n\n` +
          flightList +
          `\n\n📱 To book, visit our app or website:\n_bluewingsconnect.com/flights_\n\nType *MENU* to go back.`;
      } catch {
        reply = `⚠️ Couldn't search flights right now. Please try again or visit *bluewingsconnect.com/flights*`;
      }

      await resetSession(phone);
      break;
    }

    // ── Cancel Booking ─────────────────────────────────────────────────────
    case 'CANCEL_CONFIRM': {
      if (!session.context.pnr) {
        // First response: got the PNR
        const booking = await getBookingByPnr(incomingMsg);
        if (!booking) {
          reply = `❌ PNR *${incomingMsg.toUpperCase()}* not found. Please check and try again.\n\nType *MENU* to go back.`;
          await resetSession(phone);
        } else if (booking.status === 'Cancelled') {
          reply = `ℹ️ Booking *${booking.pnr}* is already cancelled.\n\nType *MENU* to go back.`;
          await resetSession(phone);
        } else {
          await saveSession(phone, 'CANCEL_CONFIRM', { pnr: booking.pnr });
          reply =
            `⚠️ *Confirm Cancellation*\n\n` +
            `PNR: *${booking.pnr}*\n` +
            `Flight: ${booking.flights?.flight_number}\n` +
            `${booking.flights?.origin_airport} → ${booking.flights?.destination_airport}\n\n` +
            `Reply *YES* to cancel or *NO* to keep your booking.`;
        }
      } else {
        // Second response: YES or NO
        if (msg === 'yes' || msg === 'y') {
          try {
            await supabase
              .from('bookings')
              .update({ status: 'Cancelled' })
              .eq('pnr', session.context.pnr);
            reply =
              `✅ *Booking Cancelled*\n\n` +
              `PNR *${session.context.pnr}* has been cancelled.\n` +
              `💰 Refunds are processed within 5–7 business days.\n\n` +
              `Type *MENU* to go back.`;
          } catch {
            reply = `⚠️ Cancellation failed. Please try again or call our support team.`;
          }
        } else {
          reply = `👍 Your booking *${session.context.pnr}* is kept. No changes made.\n\nType *MENU* to go back.`;
        }
        await resetSession(phone);
      }
      break;
    }

    // ── Seat Change: Get PNR ───────────────────────────────────────────────
    case 'SEAT_PNR': {
      const booking = await getBookingByPnr(incomingMsg);
      if (!booking) {
        reply = `❌ PNR not found. Please try again.\n\nType *MENU* to go back.`;
        await resetSession(phone);
      } else {
        const currentSeats = booking.booking_passengers
          ?.map((p: any) => `${p.first_name}: *${p.seat_number || 'Unassigned'}*`)
          .join(', ');
        await saveSession(phone, 'SEAT_NEW', { pnr: booking.pnr, bookingId: booking.id });
        reply =
          `💺 *Change Seat*\n\nBooking: *${booking.pnr}*\nCurrent seats: ${currentSeats}\n\n` +
          `For seat changes, please visit:\n📱 *bluewingsconnect.com/booking/confirmation/${booking.id}*\n\n` +
          `_(Tap "Manage Booking" → "Change Seat" on that page)_\n\nType *MENU* to go back.`;
        await resetSession(phone);
      }
      break;
    }

    default: {
      await resetSession(phone);
      reply = mainMenu();
    }
  }

  twiml.message(reply);
  res.type('text/xml').send(twiml.toString());
};

// ── Twilio webhook verification ──────────────────────────────────────────────
export const verifyWebhook = (req: Request, res: Response): void => {
  res.status(200).send('BlueWings WhatsApp Webhook Active');
};
