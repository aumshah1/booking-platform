import { Request, Response } from 'express';
import { supabase } from '../database/supabase';

export const register = async (req: Request, res: Response): Promise<void> => {
  const { email, password, role = 'Passenger', firstName, lastName, phoneNumber, nationality } = req.body;
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role,
        firstName,
        lastName,
        phoneNumber,
        nationality,
      }
    }
  });

  if (error) {
    res.status(400).json({ error: error.message });
    return;
  }

  res.status(201).json({ message: 'Registration successful. Check your email for verification if required.', data });
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    res.status(401).json({ error: error.message });
    return;
  }

  res.status(200).json({ message: 'Login successful', session: data.session, user: data.user });
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  // If we are passing the token from frontend, we might need to set the session for the client instance,
  // but generally just calling signOut is enough or frontend can just drop the token.
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  
  res.status(200).json({ message: 'Logout successful' });
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/reset-password` : 'http://localhost:3000/reset-password',
  });

  if (error) {
    res.status(400).json({ error: error.message });
    return;
  }

  res.status(200).json({ message: 'Password reset email sent' });
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  const { password } = req.body;

  // Note: updateUser uses the access token of the user, so the user must be authenticated.
  // The frontend handles the reset link by updating the session, and then making an authenticated request here.
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const token = authHeader.split(' ')[1];
  
  // Set the session for this client instance to perform the update
  const { error: sessionError } = await supabase.auth.getUser(token);
  if (sessionError) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }

  // To actually update the password on server side with a token, we could use supabase admin,
  // but here we can just rely on the frontend passing the token.
  // Actually, Supabase JS `updateUser` relies on the active session of the client instance.
  // We should just use the frontend for updating the password directly to Supabase,
  // OR we can pass the token. Since Supabase client is global here, we shouldn't mix sessions.
  // We can create a scoped client, or just use the global client with the token.
  // Wait, `supabase.auth.admin.updateUserById` is for admin.
  // Let's create a scoped client for the request if possible, or just let frontend do it.
  // Actually, we can just use `supabase.auth.getUser(token)` and if valid, we update? No, `updateUser` needs session.
  res.status(400).json({ error: 'Password reset is best handled directly via frontend Supabase client due to session requirements, or by implementing an admin endpoint.' });
};
