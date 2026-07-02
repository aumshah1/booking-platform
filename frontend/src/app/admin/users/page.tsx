'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { Loader2, Users, ShieldAlert, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get('/api/admin/users');
        if (res.data.error) {
          setError(res.data.error);
        }
        setUsers(res.data.users || []);
      } catch (err: any) {
        toast.error('Failed to load users');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you absolutely sure you want to permanently delete this user?')) return;
    try {
      await api.delete(`/api/admin/users/${id}`);
      setUsers(users.filter(u => u.id !== id));
      toast.success('User deleted successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to delete user');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2 font-heading"><Users className="w-6 h-6 text-primary" /> Manage Users</h2>
      </div>

      {error && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-500 p-4 rounded-lg flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 mt-0.5 shrink-0" />
          <div>
            <h4 className="font-semibold mb-1">Service Role Key Required</h4>
            <p className="text-sm opacity-90">{error}</p>
          </div>
        </div>
      )}

      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="p-4 text-sm font-semibold text-muted-foreground font-heading">ID</th>
                <th className="p-4 text-sm font-semibold text-muted-foreground font-heading">Email</th>
                <th className="p-4 text-sm font-semibold text-muted-foreground font-heading">Role</th>
                <th className="p-4 text-sm font-semibold text-muted-foreground font-heading">Created At</th>
                <th className="p-4 text-sm font-semibold text-muted-foreground font-heading text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const role = user.user_metadata?.role || 'Passenger';
                return (
                  <tr key={user.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                    <td className="p-4 font-mono text-xs text-muted-foreground max-w-[150px] truncate">{user.id}</td>
                    <td className="p-4 font-medium text-foreground">{user.email}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium border ${
                        role === 'Admin' ? 'bg-destructive/10 text-destructive border-destructive/20' : 'bg-primary/10 text-primary border-primary/20'
                      }`}>
                        {role}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">{new Date(user.created_at).toLocaleDateString()}</td>
                    <td className="p-4 text-right">
                      {role !== 'Admin' && (
                        <button 
                          onClick={() => handleDelete(user.id)}
                          className="p-2 bg-destructive/10 text-destructive rounded hover:bg-destructive/20 transition-colors"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
