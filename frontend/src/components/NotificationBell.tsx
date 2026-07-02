'use client';

import { useState, useEffect } from 'react';
import { Bell, Check, Trash2, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/axios';
import { toast } from 'sonner';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"

export interface Notification {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/api/notifications');
      const data = res.data.data;
      setNotifications(data);
      setUnreadCount(data.filter((n: Notification) => !n.is_read).length);
    } catch (err: any) {
      console.error('Failed to fetch notifications:', err?.response?.data || err.message);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // In a real app with Supabase, we would subscribe to realtime inserts here.
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (id: string) => {
    try {
      // Optimistic UI update
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      await api.patch(`/api/notifications/${id}/read`);
    } catch (err) {
      // Revert if failed
      fetchNotifications();
    }
  };

  const markAllAsRead = async () => {
    try {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      
      await api.patch('/api/notifications/read-all');
      toast.success('All notifications marked as read');
    } catch (err) {
      fetchNotifications();
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger className="relative p-2 rounded-full hover:bg-white/10 transition-colors focus:outline-none">
          <motion.div
            animate={unreadCount > 0 ? { rotate: [0, -10, 10, -10, 10, 0] } : {}}
            transition={{ duration: 0.5, delay: 1, repeat: unreadCount > 0 ? Infinity : 0, repeatDelay: 5 }}
          >
            <Bell className="w-6 h-6 text-muted-foreground hover:text-foreground transition-colors" />
          </motion.div>
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute top-1 right-1 w-4 h-4 bg-destructive rounded-full flex items-center justify-center text-[10px] font-bold text-destructive-foreground shadow-sm"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </motion.div>
            )}
          </AnimatePresence>
      </PopoverTrigger>
      
      <PopoverContent align="end" className="w-80 sm:w-96 p-0 bg-popover/95 backdrop-blur-xl border-border text-popover-foreground shadow-2xl rounded-xl z-50">
        <div className="flex items-center justify-between p-4 border-b border-border bg-muted/50">
          <h3 className="font-bold text-lg font-heading">Notifications</h3>
          {unreadCount > 0 && (
            <button 
              onClick={markAllAsRead}
              className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
            >
              <Check className="w-3 h-3" /> Mark all as read
            </button>
          )}
        </div>
        
        <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Bell className="w-12 h-12 mb-3 opacity-20" />
              <p>No notifications yet</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.map((notif) => (
                <div 
                  key={notif.id}
                  onClick={() => !notif.is_read && markAsRead(notif.id)}
                  className={`p-4 border-b border-border transition-all cursor-pointer ${
                    notif.is_read ? 'opacity-70 hover:bg-muted/50' : 'bg-primary/5 hover:bg-primary/10'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h4 className={`text-sm font-semibold flex items-center gap-2 ${!notif.is_read ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {notif.title}
                      {!notif.is_read && <span className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]"></span>}
                    </h4>
                    <span className="text-[10px] text-muted-foreground/70 flex items-center gap-1 shrink-0">
                      <Clock className="w-3 h-3" /> {formatTime(notif.created_at)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                    {notif.message}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
