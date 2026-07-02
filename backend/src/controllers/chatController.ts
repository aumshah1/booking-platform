import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { supabase } from '../database/supabase';

// Helper to get or create a chat session
const getSessionId = async (userId: string) => {
  const { data: existing } = await supabase
    .from('chat_sessions')
    .select('id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (existing) return existing.id;

  const { data: newSession } = await supabase
    .from('chat_sessions')
    .insert([{ user_id: userId }])
    .select('id')
    .single();

  return newSession?.id;
};

export const getChatHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const sessionId = await getSessionId(userId);
    if (!sessionId) {
      res.status(200).json({ messages: [] });
      return;
    }

    const { data: messages, error } = await supabase
      .from('chat_messages')
      .select('id, sender, message, created_at')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }

    res.status(200).json({ messages: messages || [] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// Intelligent Mock Engine
const generateAIResponse = async (userMessage: string, userId: string): Promise<string> => {
  const msg = userMessage.toLowerCase();
  
  // 1. Show bookings
  if (msg.includes('my booking') || msg.includes('show booking') || msg.includes('where is my booking')) {
    const { data: bookings } = await supabase
      .from('bookings')
      .select('pnr, status, flights(airline_name, flight_number, destination_airport)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(3);
      
    if (!bookings || bookings.length === 0) {
      return "You don't have any recent bookings with us right now. Would you like to book a new flight?";
    }
    let response = "Here are your recent bookings:\n\n";
    bookings.forEach((b: any) => {
      response += `- **${b.pnr}**: ${b.flights?.airline_name} flight ${b.flights?.flight_number} to ${b.flights?.destination_airport} (${b.status})\n`;
    });
    return response;
  }

  // 2. Flight status
  if (msg.includes('flight status') || msg.includes('is my flight on time') || msg.includes('delay')) {
    const { data: bookings } = await supabase
      .from('bookings')
      .select('pnr, flights(flight_number, status, departure_time)')
      .eq('user_id', userId)
      .eq('status', 'Confirmed')
      .order('created_at', { ascending: false })
      .limit(1);

    if (bookings && bookings.length > 0) {
      const flight: any = bookings[0].flights;
      return `Your upcoming flight **${flight?.flight_number}** is currently **${flight?.status}**. It is scheduled to depart at ${new Date(flight?.departure_time).toLocaleString()}.`;
    }
    return "I couldn't find an upcoming confirmed flight. Please provide your flight number if you're checking for someone else.";
  }

  // 3. Cancel booking
  if (msg.includes('cancel') && msg.includes('booking')) {
    return "To cancel a booking, please head over to the **Trips** page. Click 'View Booking' on the trip you wish to cancel, and you will find a cancel button at the bottom of the itinerary. Please review our Refund Policy first!";
  }

  // 4. Change seat / Reschedule
  if (msg.includes('change seat') || msg.includes('reschedule')) {
    return "You can change your seat or reschedule your flight from your **Boarding Passes** view. Just click the 'Manage Booking' menu in the top right of your ticket.";
  }

  // 5. Boarding pass
  if (msg.includes('boarding pass') || msg.includes('ticket')) {
    return "Your boarding passes are generated immediately after booking. You can view, download, or print them from the **Trips** page by clicking on your confirmed booking.";
  }

  // 6. Refund Policy
  if (msg.includes('refund policy') || msg.includes('refund')) {
    return "### Refund Policy\n- Cancellations made **24 hours** before departure are eligible for a full refund to the original payment method.\n- Cancellations made within 24 hours of departure are subject to a **₹1000 cancellation fee**.\n- No-shows are **non-refundable**.";
  }
  
  // 7. General / Support FAQs
  if (msg.includes('baggage') || msg.includes('luggage')) {
    return "Economy class includes 1 carry-on bag and 1 checked bag up to 50lbs. Premium and Business class passengers get 2 checked bags.";
  }

  return "I'm a beta AI assistant! I can currently help you with checking your **bookings**, **flight status**, **cancellations**, and answering **refund policy** FAQs. How can I assist you today?";
};

export const sendMessage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { message } = req.body;

    if (!userId || !message) {
      res.status(400).json({ error: 'Missing user or message' });
      return;
    }

    const sessionId = await getSessionId(userId);
    if (!sessionId) {
      res.status(500).json({ error: 'Could not create chat session' });
      return;
    }

    // 1. Save user message
    await supabase.from('chat_messages').insert([{
      session_id: sessionId,
      sender: 'user',
      message
    }]);

    // 2. Generate AI response
    const aiResponse = await generateAIResponse(message, userId);

    // 3. Save AI message
    const { data: savedAiMsg } = await supabase.from('chat_messages').insert([{
      session_id: sessionId,
      sender: 'ai',
      message: aiResponse
    }]).select('id, sender, message, created_at').single();

    res.status(200).json({ reply: savedAiMsg });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
