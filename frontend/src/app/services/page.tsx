'use client';

import { motion } from 'framer-motion';
import { Plane, Settings, UserCheck, Briefcase, Headset, Globe } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { Card } from '@/components/ui/card';

const services = [
  {
    icon: <Plane className="w-8 h-8 text-primary" />,
    title: 'Flight Booking Assistance',
    description: 'Our premium concierge team is ready to help you find the perfect flights with the best routes and pricing.',
    bgColor: 'bg-primary/10',
  },
  {
    icon: <Settings className="w-8 h-8 text-blue-500" />,
    title: 'Booking Management',
    description: 'Easily manage, modify, or cancel your bookings online or through our dedicated support channels.',
    bgColor: 'bg-blue-500/10',
  },
  {
    icon: <UserCheck className="w-8 h-8 text-emerald-500" />,
    title: 'Check-in Support',
    description: 'Experience seamless check-in processes with priority boarding options and fast-track security clearances.',
    bgColor: 'bg-emerald-500/10',
  },
  {
    icon: <Briefcase className="w-8 h-8 text-purple-500" />,
    title: 'Baggage Services',
    description: 'Track your luggage in real-time and enjoy generous allowances across all our premium cabin classes.',
    bgColor: 'bg-purple-500/10',
  },
  {
    icon: <Headset className="w-8 h-8 text-amber-500" />,
    title: '24/7 Customer Support',
    description: 'Our award-winning customer service team is available around the clock to assist you with any inquiries.',
    bgColor: 'bg-amber-500/10',
  },
  {
    icon: <Globe className="w-8 h-8 text-indigo-500" />,
    title: 'Travel Assistance',
    description: 'From visa information to hotel bookings, our comprehensive travel assistance covers all your journey needs.',
    bgColor: 'bg-indigo-500/10',
  },
];

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden">
      <Navbar />
      
      {/* Background Glows */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] -z-10 pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] -z-10 pointer-events-none" />

      <main className="flex-1 flex flex-col pt-32 pb-20 container mx-auto px-4 z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-bold font-heading mb-6 text-foreground">Our Premium Services</h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Discover a world of convenience and luxury. From seamless bookings to 24/7 support, we ensure your journey is extraordinary from start to finish.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
            >
              <Card className="p-8 h-full bg-card border-border shadow-sm hover:shadow-xl hover:border-primary/30 transition-all duration-300 group cursor-default">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 ${service.bgColor}`}>
                  {service.icon}
                </div>
                <h3 className="text-xl font-bold font-heading mb-3 text-foreground group-hover:text-primary transition-colors">
                  {service.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {service.description}
                </p>
              </Card>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
}
