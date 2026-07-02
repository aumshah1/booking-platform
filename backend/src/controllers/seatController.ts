import { Request, Response } from 'express';
import { supabase } from '../database/supabase';
import { AuthRequest } from '../middlewares/authMiddleware';

export const getSeats = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  // We simply fetch seats because they are generated at flight creation time now.
  const { data: seats, error: fetchError } = await supabase
    .from('flight_seats')
    .select('*')
    .eq('flight_id', id)
    .order('row_number', { ascending: true })
    .order('x_position', { ascending: true });

  if (fetchError) {
    res.status(500).json({ error: fetchError.message });
    return;
  }

  res.status(200).json({ data: seats || [] });
};

// Admin blocking API
export const adminUpdateSeatStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  const { seatId } = req.params;
  const { status } = req.body; // 'BLOCKED' or 'AVAILABLE'
  
  const { error } = await supabase
    .from('flight_seats')
    .update({ status })
    .eq('id', seatId);

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.status(200).json({ message: `Seat updated to ${status}` });
};
