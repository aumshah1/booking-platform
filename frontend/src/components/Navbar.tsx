'use client';

import Link from 'next/link';
import { PlaneTakeoff, LogOut, LayoutDashboard, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import NotificationBell from './NotificationBell';
import { ThemeToggle } from './ThemeToggle';

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <nav className="fixed w-full z-50 top-0 start-0 border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
        <Link href="/" className="flex items-center space-x-3 rtl:space-x-reverse group">
          <PlaneTakeoff className="h-8 w-8 text-primary group-hover:text-primary/80 transition-colors" />
          <span className="self-center text-2xl font-bold whitespace-nowrap text-foreground font-heading">BlueWings Connect</span>
        </Link>
        <div className="flex md:order-2 space-x-4 rtl:space-x-reverse items-center">
          <ThemeToggle />
          {user ? (
            <>
              <Link href="/dashboard" className="text-foreground hover:text-primary font-medium text-sm flex items-center gap-1.5 transition-colors">
                <LayoutDashboard className="w-4 h-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>
              <Link href="/profile" className="text-foreground hover:text-primary font-medium text-sm flex items-center gap-1.5 transition-colors">
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">Profile</span>
              </Link>
              <NotificationBell />
              <button onClick={handleLogout} className="text-muted-foreground hover:text-destructive font-medium text-sm flex items-center gap-1.5 transition-colors">
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </>
          ) : (
            <Link href="/login" className="text-primary-foreground bg-primary hover:bg-primary/90 focus:ring-4 focus:outline-none focus:ring-primary/50 font-medium rounded-lg text-sm px-4 py-2 text-center transition-colors shadow-lg hover:shadow-primary/30">
              Get started
            </Link>
          )}
        </div>
        <div className="items-center justify-between hidden w-full md:flex md:w-auto md:order-1" id="navbar-sticky">
          <ul className="flex flex-col p-4 md:p-0 mt-4 font-medium md:space-x-8 rtl:space-x-reverse md:flex-row md:mt-0 md:border-0 text-foreground/80">
            <li>
              <Link href="/" className="block py-2 px-3 text-primary md:p-0" aria-current="page">Home</Link>
            </li>
            <li>
              <Link href="/flights" className="block py-2 px-3 hover:text-primary rounded md:hover:bg-transparent md:p-0 transition-colors">Flights</Link>
            </li>
            <li>
              <Link href="/trips" className="block py-2 px-3 hover:text-primary rounded md:hover:bg-transparent md:p-0 transition-colors">My Trips</Link>
            </li>
            <li>
              <Link href="/services" className="block py-2 px-3 hover:text-primary rounded md:hover:bg-transparent md:p-0 transition-colors">Services</Link>
            </li>
            <li>
              <Link href="/contact" className="block py-2 px-3 hover:text-primary rounded md:hover:bg-transparent md:p-0 transition-colors">Contact</Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
