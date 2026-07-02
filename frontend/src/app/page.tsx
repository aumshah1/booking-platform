'use client';

import { motion } from 'framer-motion';
import { Plane, CalendarDays, ShieldCheck, Sparkles, ArrowRight } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 transition-colors duration-300 flex flex-col">
      <Navbar />
      
      <main className="relative flex-1 flex flex-col items-center overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] md:w-[800px] md:h-[800px] bg-primary/20 rounded-full blur-[120px] -z-10 pointer-events-none opacity-60" />
        <div className="absolute top-0 right-0 w-[400px] h-[400px] md:w-[500px] md:h-[500px] bg-blue-500/20 rounded-full blur-[100px] -z-10 pointer-events-none opacity-50" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] md:w-[500px] md:h-[500px] bg-purple-500/20 rounded-full blur-[100px] -z-10 pointer-events-none opacity-50" />

        <div className="container mx-auto px-4 z-10 flex flex-col items-center justify-center text-center pt-32 pb-20 flex-1">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="space-y-6 max-w-4xl"
          >
            <motion.div
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               transition={{ delay: 0.2, duration: 0.5 }}
               className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium mb-4 backdrop-blur-sm shadow-sm"
            >
              <Sparkles className="w-4 h-4" />
              <span>Premium Airline Booking System</span>
            </motion.div>
            
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight font-heading text-foreground leading-[1.1]">
              Elevate Your Journey with <br className="hidden md:block"/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-500 drop-shadow-sm">
                BlueWings Connect
              </span>
            </h1>
            
            <p className="max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground mt-6 leading-relaxed">
              Experience the next generation of air travel. Seamless booking, intelligent conversational assistance, and premium service tailored just for you.
            </p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-12"
            >
              <Link href="/flights" className="w-full sm:w-auto px-8 py-4 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-full shadow-lg shadow-primary/25 transition-all flex items-center justify-center gap-2 group text-lg">
                Book a Flight
                <Plane className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/trips" className="w-full sm:w-auto px-8 py-4 bg-card hover:bg-muted border border-border text-foreground font-semibold rounded-full shadow-sm transition-all flex items-center justify-center gap-2 text-lg">
                Manage Trips
                <CalendarDays className="w-5 h-5 text-muted-foreground" />
              </Link>
            </motion.div>
          </motion.div>
        </div>

        {/* Features Section */}
        <div className="w-full bg-card/50 border-t border-border backdrop-blur-xl py-20 mt-auto z-10">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="flex flex-col items-center text-center p-6 rounded-2xl bg-background border border-border shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                  <Plane className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-bold font-heading mb-3">Global Destinations</h3>
                <p className="text-muted-foreground">Access a worldwide network of premium flights with competitive pricing and flexible scheduling.</p>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="flex flex-col items-center text-center p-6 rounded-2xl bg-background border border-border shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-14 h-14 rounded-full bg-blue-500/10 flex items-center justify-center mb-6">
                  <ShieldCheck className="w-7 h-7 text-blue-500" />
                </div>
                <h3 className="text-xl font-bold font-heading mb-3">Secure Booking</h3>
                <p className="text-muted-foreground">Enterprise-grade security ensures your personal data and payment information is always protected.</p>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="flex flex-col items-center text-center p-6 rounded-2xl bg-background border border-border shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-14 h-14 rounded-full bg-purple-500/10 flex items-center justify-center mb-6">
                  <Sparkles className="w-7 h-7 text-purple-500" />
                </div>
                <h3 className="text-xl font-bold font-heading mb-3">AI Travel Assistant</h3>
                <p className="text-muted-foreground">Our intelligent SkyTalk assistant is always ready to help you manage your journey effortlessly.</p>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Popular Destinations Section */}
        <div className="w-full bg-background py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold font-heading mb-4 text-foreground">Explore Popular Destinations</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Discover top-rated locations around the globe with our exclusive flight offers.</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { name: "Paris, France", image: "🗼", price: "From $499", color: "bg-blue-500/10 text-blue-500" },
                { name: "Tokyo, Japan", image: "🗻", price: "From $699", color: "bg-emerald-500/10 text-emerald-500" },
                { name: "New York, USA", image: "🗽", price: "From $299", color: "bg-purple-500/10 text-purple-500" },
                { name: "Dubai, UAE", image: "🐪", price: "From $549", color: "bg-amber-500/10 text-amber-500" },
              ].map((dest, i) => (
                <motion.div 
                  key={dest.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="group relative overflow-hidden rounded-3xl bg-card border border-border shadow-sm hover:shadow-xl transition-all cursor-pointer"
                >
                  <div className="aspect-[4/3] flex items-center justify-center bg-muted/30 group-hover:bg-muted/50 transition-colors">
                    <span className="text-6xl">{dest.image}</span>
                  </div>
                  <div className="p-6">
                    <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mb-3 ${dest.color}`}>
                      Popular
                    </div>
                    <h3 className="text-xl font-bold font-heading mb-1 text-foreground">{dest.name}</h3>
                    <p className="text-muted-foreground mb-4">{dest.price}</p>
                    <Link href="/flights" className="inline-flex items-center text-primary font-medium group-hover:underline">
                      View flights <ArrowRight className="w-4 h-4 ml-1" />
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
