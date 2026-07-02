'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send, Loader2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function ContactPage() {
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      toast.success('Your message has been sent successfully. We will get back to you shortly.');
      (e.target as HTMLFormElement).reset();
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden">
      <Navbar />
      
      {/* Background Glows */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] -z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] -z-10 pointer-events-none" />

      <main className="flex-1 flex flex-col pt-32 pb-20 container mx-auto px-4 z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-bold font-heading mb-6 text-foreground">Contact Us</h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Have a question, feedback, or need assistance with your booking? Our team is here to help you around the clock.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto w-full">
          {/* Contact Information */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="space-y-8"
          >
            <div>
              <h2 className="text-2xl font-bold font-heading mb-6">Get in Touch</h2>
              <p className="text-muted-foreground mb-8">
                Whether you're looking for answers, would like to solve a problem, or just want to let us know how we did, you'll find many ways to contact us right here.
              </p>
            </div>

            <div className="space-y-6">
              <Card className="p-6 bg-card border-border shadow-sm flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <MapPin className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1">Global Headquarters</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    1 SkyWay Avenue, Terminal 4<br />
                    Aviation District, NY 10001<br />
                    United States
                  </p>
                </div>
              </Card>

              <Card className="p-6 bg-card border-border shadow-sm flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                  <Phone className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1">Phone Support</h3>
                  <p className="text-muted-foreground leading-relaxed mb-2">
                    Available 24/7 for urgent booking modifications and general inquiries.
                  </p>
                  <a href="tel:+18005550199" className="text-primary font-medium hover:underline">+1 (800) 555-0199</a>
                </div>
              </Card>

              <Card className="p-6 bg-card border-border shadow-sm flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <Mail className="w-6 h-6 text-emerald-500" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1">Email Support</h3>
                  <p className="text-muted-foreground leading-relaxed mb-2">
                    For non-urgent matters, feedback, or corporate bookings.
                  </p>
                  <a href="mailto:support@phononsky.com" className="text-primary font-medium hover:underline">support@phononsky.com</a>
                </div>
              </Card>
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <Card className="w-full bg-card border-border text-card-foreground shadow-2xl relative pt-2 overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-blue-500" />
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold font-heading mb-6">Send a Message</h3>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-foreground">First Name</Label>
                      <Input 
                        id="firstName" 
                        required
                        placeholder="John" 
                        className="bg-background border-border text-foreground focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-foreground">Last Name</Label>
                      <Input 
                        id="lastName" 
                        required
                        placeholder="Doe" 
                        className="bg-background border-border text-foreground focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-foreground">Email Address</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      required
                      placeholder="john@example.com" 
                      className="bg-background border-border text-foreground focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject" className="text-foreground">Subject</Label>
                    <Input 
                      id="subject" 
                      required
                      placeholder="How can we help?" 
                      className="bg-background border-border text-foreground focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-foreground">Message</Label>
                    <textarea 
                      id="message" 
                      required
                      rows={5}
                      placeholder="Please provide as much detail as possible..." 
                      className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus:border-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50 md:text-sm text-foreground resize-none"
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full py-3 px-4 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground rounded-lg font-medium transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 mt-4"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    {loading ? 'Sending Message...' : 'Send Message'}
                  </button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
