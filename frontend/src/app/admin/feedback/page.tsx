'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { Loader2, MessageSquare, CheckCircle, Mail } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminFeedbackPage() {
  const [feedback, setFeedback] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        const res = await api.get('/api/admin/feedback');
        setFeedback(res.data.feedback || []);
      } catch (err) {
        toast.error('Failed to load feedback');
      } finally {
        setLoading(false);
      }
    };
    fetchFeedback();
  }, []);

  const handleResolve = async (id: string) => {
    try {
      await api.put(`/api/admin/feedback/${id}`, { status: 'Resolved' });
      setFeedback(feedback.map(f => f.id === id ? { ...f, status: 'Resolved' } : f));
      toast.success('Feedback marked as resolved');
    } catch (err) {
      toast.error('Failed to update status');
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
        <h2 className="text-2xl font-bold flex items-center gap-2 font-heading"><MessageSquare className="w-6 h-6 text-primary" /> Customer Feedback</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {feedback.length > 0 ? feedback.map((item) => (
          <div key={item.id} className="bg-card border border-border p-6 rounded-xl flex flex-col h-full shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-semibold text-foreground font-heading">{item.subject}</h3>
                <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                  <Mail className="w-3 h-3" /> {item.email}
                </div>
              </div>
              <span className={`px-2 py-1 rounded text-xs font-medium border ${
                item.status === 'Resolved' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-600 dark:text-amber-500 border-amber-500/20'
              }`}>
                {item.status}
              </span>
            </div>
            
            <p className="text-foreground text-sm flex-1 mb-4">{item.message}</p>
            
            <div className="flex items-center justify-between mt-auto pt-4 border-t border-border">
              <span className="text-xs text-muted-foreground">{new Date(item.created_at).toLocaleDateString()}</span>
              {item.status !== 'Resolved' && (
                <button 
                  onClick={() => handleResolve(item.id)}
                  className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 text-sm font-medium flex items-center gap-1 transition-colors"
                >
                  <CheckCircle className="w-4 h-4" /> Resolve
                </button>
              )}
            </div>
          </div>
        )) : (
          <div className="col-span-full p-8 text-center text-muted-foreground border border-border border-dashed rounded-xl bg-muted/20">
            No customer feedback found.
          </div>
        )}
      </div>
    </div>
  );
}
