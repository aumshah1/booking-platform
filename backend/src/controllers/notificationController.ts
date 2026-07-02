import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { supabase } from '../database/supabase';

export const getNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  const user_id = req.user?.id;
  if (!user_id) return { res: res.status(401).json({ error: 'Unauthorized' }) } as any;

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user_id)
    .order('created_at', { ascending: false })
    .limit(50); // Get latest 50 notifications

  if (error) {
    return { res: res.status(500).json({ error: error.message }) } as any;
  }

  res.status(200).json({ data });
};

export const markAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const user_id = req.user?.id;
  if (!user_id) return { res: res.status(401).json({ error: 'Unauthorized' }) } as any;

  const { data, error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id)
    .eq('user_id', user_id)
    .select()
    .single();

  if (error) {
    return { res: res.status(500).json({ error: error.message }) } as any;
  }

  res.status(200).json({ data });
};

export const markAllAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  const user_id = req.user?.id;
  if (!user_id) return { res: res.status(401).json({ error: 'Unauthorized' }) } as any;

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', user_id)
    .eq('is_read', false);

  if (error) {
    return { res: res.status(500).json({ error: error.message }) } as any;
  }

  res.status(200).json({ message: 'All notifications marked as read' });
};
