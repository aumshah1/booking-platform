'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, Plane, Users, CalendarDays, MessageSquare, LogOut, Loader2, PlaneTakeoff } from 'lucide-react';
import { useEffect, useState } from 'react';

const sidebarLinks = [
  { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/flights', icon: Plane, label: 'Flights' },
  { href: '/admin/bookings', icon: CalendarDays, label: 'Bookings' },
  { href: '/admin/users', icon: Users, label: 'Users' },
  { href: '/admin/feedback', icon: MessageSquare, label: 'Feedback' }
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient && (!user || user.user_metadata?.role !== 'Admin') && pathname !== '/admin/login') {
      router.push('/admin/login');
    }
  }, [isClient, user, pathname, router]);

  if (!isClient) return null;

  if (!user || user.user_metadata?.role !== 'Admin') {
    if (pathname !== '/admin/login') {
      return (
        <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center transition-colors duration-300">
          <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
          <p className="text-muted-foreground">Redirecting to Admin Login...</p>
        </div>
      );
    }
  }

  // If on login page, don't show the layout sidebar
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    await logout();
    router.push('/admin/login');
  };

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden transition-colors duration-300">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card/80 backdrop-blur-xl flex flex-col z-20">
        <div className="p-6 border-b border-border flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-lg shadow-primary/30">
            <PlaneTakeoff className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight font-heading text-foreground">
            Blue<span className="text-primary drop-shadow-sm">Wings</span>
          </span>
        </div>
        
        <nav className="flex-1 py-6 px-4 space-y-2">
          {sidebarLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link 
                key={link.href} 
                href={link.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                <span className="font-medium">{link.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout Admin</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-background relative">
        {/* Subtle Background Glow */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none z-0" />
        
        {/* Top Header */}
        <header className="h-16 border-b border-border bg-card/50 backdrop-blur-md flex items-center justify-between px-8 z-10 sticky top-0">
          <h1 className="text-xl font-semibold font-heading text-foreground">
            {sidebarLinks.find(l => l.href === pathname)?.label || 'Dashboard'}
          </h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-muted/50 px-4 py-1.5 rounded-full border border-border">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                <Users className="w-3 h-3 text-primary" />
              </div>
              <div className="text-sm text-muted-foreground">
                <span className="text-foreground font-medium">{user?.email}</span>
              </div>
            </div>
          </div>
        </header>
        
        {/* Scrollable Page Content */}
        <div className="flex-1 overflow-auto p-8 selection:bg-primary/30 z-10 relative">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
