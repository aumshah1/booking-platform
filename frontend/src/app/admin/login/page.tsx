'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Loader2, ShieldAlert } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import api from '@/lib/axios';

export default function AdminLoginPage() {
  const { setSessionData } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/auth/login', { email, password });
      
      // Let layout handle checking if role === 'Admin'
      await setSessionData(res.data.session, res.data.user);
      
      router.push('/admin/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid credentials or you do not have Admin privileges.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Admin specific background effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-destructive/10 rounded-full blur-[120px] -z-10 pointer-events-none" />

      <Card className="w-full max-w-md bg-card border-border text-card-foreground shadow-2xl relative border-t-destructive border-t-4">
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-destructive p-3 rounded-full border-4 border-background shadow-lg">
          <ShieldAlert className="w-6 h-6 text-destructive-foreground" />
        </div>
        <CardHeader className="space-y-1 mt-4">
          <CardTitle className="text-2xl font-bold tracking-tight text-center font-heading">Admin Portal</CardTitle>
          <CardDescription className="text-muted-foreground text-center">
            Restricted access. Please sign in with your administrator credentials.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/30 text-destructive text-sm rounded-md text-center">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">Admin Email</Label>
              <Input 
                id="email" 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@phononsky.com" 
                className="bg-background border-border text-foreground focus:border-destructive focus:ring-1 focus:ring-destructive transition-all"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground">Password</Label>
              <Input 
                id="password" 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-background border-border text-foreground focus:border-destructive focus:ring-1 focus:ring-destructive transition-all"
              />
            </div>
          </CardContent>
          <CardFooter>
            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-2.5 px-4 bg-destructive hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed text-destructive-foreground rounded-lg font-medium transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Authenticating...' : 'Secure Login'}
            </button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
