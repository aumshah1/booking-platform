import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { supabase } from '../database/supabase';
import { createClient } from '@supabase/supabase-js';

// Helper to get a client authenticated as the current user
const getUserClient = (req: AuthRequest) => {
  const token = req.headers.authorization?.split(' ')[1];
  return createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_ANON_KEY || '', {
    global: { headers: { Authorization: `Bearer ${token}` } }
  });
};

export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    res.status(200).json({ user });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const { firstName, lastName, phone, nationality } = req.body;

    const response = await fetch(`${process.env.SUPABASE_URL}/auth/v1/user`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        apikey: process.env.SUPABASE_ANON_KEY || '',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        data: {
          first_name: firstName,
          last_name: lastName,
          phone,
          nationality
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      res.status(400).json({ error: data.message || 'Failed to update profile' });
      return;
    }

    res.status(200).json({ message: 'Profile updated successfully', user: data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const uploadAvatar = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const file = req.file;
    const user = req.user;

    if (!file || !user) {
      res.status(400).json({ error: 'File or user missing' });
      return;
    }

    const userClient = getUserClient(req);
    const fileExt = file.originalname.split('.').pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await userClient.storage
      .from('avatars')
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: true
      });

    if (uploadError) {
      res.status(400).json({ error: uploadError.message });
      return;
    }

    // Get public URL
    const { data: { publicUrl } } = userClient.storage
      .from('avatars')
      .getPublicUrl(fileName);

    // Update user metadata
    const token = req.headers.authorization?.split(' ')[1];
    const updateResponse = await fetch(`${process.env.SUPABASE_URL}/auth/v1/user`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        apikey: process.env.SUPABASE_ANON_KEY || '',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ data: { avatar_url: publicUrl } })
    });

    const updateData = await updateResponse.json();

    if (!updateResponse.ok) {
      res.status(400).json({ error: updateData.message || 'Failed to update user avatar' });
      return;
    }

    res.status(200).json({ message: 'Avatar uploaded successfully', url: publicUrl, user: updateData });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const { password } = req.body;

    if (!password) {
      res.status(400).json({ error: 'Password is required' });
      return;
    }

    const response = await fetch(`${process.env.SUPABASE_URL}/auth/v1/user`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        apikey: process.env.SUPABASE_ANON_KEY || '',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ password })
    });

    const data = await response.json();

    if (!response.ok) {
      res.status(400).json({ error: data.message || 'Failed to update password' });
      return;
    }

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteAccount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      res.status(501).json({ error: 'Not Implemented: Service role key is missing on the backend' });
      return;
    }

    const adminClient = createClient(process.env.SUPABASE_URL || '', serviceRoleKey);
    const { error } = await adminClient.auth.admin.deleteUser(user.id);

    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }

    res.status(200).json({ message: 'Account deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
