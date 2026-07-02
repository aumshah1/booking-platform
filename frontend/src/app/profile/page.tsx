'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Shield, AlertTriangle, Upload, Loader2, CheckCircle2 } from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'sonner';

export default function ProfilePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  
  // Profile Form
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [nationality, setNationality] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  
  // Security Form
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI State
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/api/profile');
        const userData = res.data.user;
        setFirstName(userData.user_metadata?.first_name || '');
        setLastName(userData.user_metadata?.last_name || '');
        setPhone(userData.user_metadata?.phone || '');
        setNationality(userData.user_metadata?.nationality || '');
        setAvatarUrl(userData.user_metadata?.avatar_url || '');
      } catch (err) {
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingProfile(true);
    try {
      await api.put('/api/profile', { firstName, lastName, phone, nationality });
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error('Failed to update profile');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    setUploadingAvatar(true);
    try {
      const res = await api.post('/api/profile/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setAvatarUrl(res.data.url);
      toast.success('Avatar uploaded successfully');
    } catch (err) {
      toast.error('Failed to upload avatar. Make sure you created the "avatars" bucket.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    setChangingPassword(true);
    try {
      await api.put('/api/profile/password', { password: newPassword });
      toast.success('Password changed successfully');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error('Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you absolutely sure you want to delete your account? This action cannot be undone.')) return;
    
    setDeletingAccount(true);
    try {
      await api.delete('/api/profile');
      toast.success('Account deleted successfully');
      // Redirect handled by auth context usually, or manually
      window.location.href = '/login';
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to delete account. Ensure Service Role Key is configured.');
    } finally {
      setDeletingAccount(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
        <Navbar />
        
        <main className="pt-32 pb-16 px-4">
          <div className="max-w-4xl mx-auto">
            
            <div className="flex flex-col md:flex-row items-center md:items-end gap-6 mb-12">
              <div className="relative group">
                <div className="w-32 h-32 rounded-full border-4 border-border overflow-hidden bg-muted flex items-center justify-center relative shadow-sm">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-16 h-16 text-muted-foreground" />
                  )}
                  {uploadingAvatar && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                    </div>
                  )}
                </div>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 p-2 bg-primary rounded-full text-primary-foreground hover:bg-primary/90 transition-colors shadow-md"
                  disabled={uploadingAvatar}
                >
                  <Upload className="w-4 h-4" />
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleAvatarUpload}
                />
              </div>
              
              <div className="text-center md:text-left">
                <h1 className="text-3xl font-bold font-heading">{firstName || 'User'} {lastName}</h1>
                <p className="text-muted-foreground">{user?.email}</p>
                <div className="flex items-center gap-2 mt-2 justify-center md:justify-start">
                  <span className="px-2 py-1 rounded bg-primary/10 text-primary text-xs font-medium border border-primary/20">
                    {user?.user_metadata?.role || 'Passenger'}
                  </span>
                </div>
              </div>
            </div>

            <Tabs defaultValue="general" className="w-full">
              <TabsList className="bg-muted border border-border mb-8 p-1 inline-flex w-full md:w-auto shadow-sm">
                <TabsTrigger value="general" className="flex-1 md:flex-none data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  General Info
                </TabsTrigger>
                <TabsTrigger value="security" className="flex-1 md:flex-none data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  Security
                </TabsTrigger>
                <TabsTrigger value="delete" className="flex-1 md:flex-none data-[state=active]:bg-destructive data-[state=active]:text-destructive-foreground text-destructive">
                  Delete Account
                </TabsTrigger>
              </TabsList>

              <TabsContent value="general">
                <Card className="bg-card border-border text-card-foreground shadow-sm">
                  <CardHeader>
                    <CardTitle className="font-heading">Personal Information</CardTitle>
                    <CardDescription className="text-muted-foreground">Update your personal details here.</CardDescription>
                  </CardHeader>
                  <form onSubmit={handleProfileUpdate}>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-sm text-muted-foreground">First Name</label>
                          <input 
                            type="text" 
                            value={firstName} 
                            onChange={(e) => setFirstName(e.target.value)}
                            className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                            placeholder="John"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm text-muted-foreground">Last Name</label>
                          <input 
                            type="text" 
                            value={lastName} 
                            onChange={(e) => setLastName(e.target.value)}
                            className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                            placeholder="Doe"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm text-muted-foreground">Phone Number</label>
                          <input 
                            type="tel" 
                            value={phone} 
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                            placeholder="+1 234 567 8900"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm text-muted-foreground">Nationality</label>
                          <input 
                            type="text" 
                            value={nationality} 
                            onChange={(e) => setNationality(e.target.value)}
                            className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                            placeholder="United States"
                          />
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="border-t border-border pt-6">
                      <button 
                        type="submit" 
                        disabled={updatingProfile}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm"
                      >
                        {updatingProfile && <Loader2 className="w-4 h-4 animate-spin" />}
                        Save Changes
                      </button>
                    </CardFooter>
                  </form>
                </Card>
              </TabsContent>

              <TabsContent value="security">
                <Card className="bg-card border-border text-card-foreground shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 font-heading"><Shield className="w-5 h-5 text-primary" /> Security Settings</CardTitle>
                    <CardDescription className="text-muted-foreground">Update your password to keep your account secure.</CardDescription>
                  </CardHeader>
                  <form onSubmit={handlePasswordChange}>
                    <CardContent className="space-y-6">
                      <div className="space-y-2 max-w-md">
                        <label className="text-sm text-muted-foreground">New Password</label>
                        <input 
                          type="password" 
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                          placeholder="••••••••"
                        />
                      </div>
                      <div className="space-y-2 max-w-md">
                        <label className="text-sm text-muted-foreground">Confirm New Password</label>
                        <input 
                          type="password" 
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                          placeholder="••••••••"
                        />
                      </div>
                    </CardContent>
                    <CardFooter className="border-t border-border pt-6">
                      <button 
                        type="submit" 
                        disabled={changingPassword || !newPassword}
                        className="bg-muted hover:bg-muted/80 text-foreground border border-border px-6 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm"
                      >
                        {changingPassword && <Loader2 className="w-4 h-4 animate-spin" />}
                        Update Password
                      </button>
                    </CardFooter>
                  </form>
                </Card>
              </TabsContent>

              <TabsContent value="delete">
                <Card className="bg-destructive/10 border-destructive/20 text-foreground shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-destructive font-heading"><AlertTriangle className="w-5 h-5" /> Delete Account</CardTitle>
                    <CardDescription className="text-muted-foreground">Once you delete your account, there is no going back. Please be certain.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-destructive/20 border border-destructive/30 rounded-lg p-4 mb-6">
                      <p className="text-sm text-destructive-foreground">
                        This action will permanently delete your account, your flight bookings, notifications, and all associated personal data from our servers.
                      </p>
                    </div>
                  </CardContent>
                  <CardFooter className="border-t border-destructive/20 pt-6">
                    <button 
                      onClick={handleDeleteAccount}
                      disabled={deletingAccount}
                      className="bg-destructive hover:bg-destructive/90 text-destructive-foreground px-6 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm"
                    >
                      {deletingAccount && <Loader2 className="w-4 h-4 animate-spin" />}
                      Delete My Account
                    </button>
                  </CardFooter>
                </Card>
              </TabsContent>

            </Tabs>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
