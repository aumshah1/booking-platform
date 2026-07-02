'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { Plane, ChevronRight, Loader2, ArrowLeft, CheckCircle2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';

export default function AddFlightPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form State
  const [flightDetails, setFlightDetails] = useState({
    airline_name: 'BlueWings Airlines',
    flight_number: 'BW-999',
    origin_airport: 'JFK',
    destination_airport: 'LHR',
    departure_time: '',
    arrival_time: '',
    base_price: '500'
  });

  const [aircraftDetails, setAircraftDetails] = useState({
    aircraft_code: 'A320N',
    aircraft_name: 'Airbus A320neo',
    model: 'A320neo',
    layout_type: 'NARROW_BODY'
  });

  const [cabinConfig, setCabinConfig] = useState([
    { class: 'BUSINESS', layout: '2-2', rows: 4, priceModifier: 250 },
    { class: 'PREMIUM_ECONOMY', layout: '3-3', rows: 6, priceModifier: 100 },
    { class: 'ECONOMY', layout: '3-3', rows: 20, priceModifier: 0 }
  ]);

  // Preview State (frontend generation logic to mirror backend)
  const generatePreview = () => {
    const seats: any[] = [];
    let currentRow = 1;
    for (const cabin of cabinConfig) {
      const blocks = cabin.layout.split('-').map(Number);
      const cols = blocks.reduce((a, b) => a + b, 0);
      for (let r = 0; r < cabin.rows; r++) {
        let seatIndex = 0;
        let blockIndex = 0;
        let seatsInBlock = 0;
        for (let s = 0; s < cols; s++) {
          const isWindow = s === 0 || s === cols - 1;
          const isAisleLeft = seatsInBlock === 0 && blockIndex > 0;
          const isAisleRight = seatsInBlock === blocks[blockIndex] - 1 && blockIndex < blocks.length - 1;
          const isAisle = isAisleLeft || isAisleRight;
          
          seats.push({
            row: currentRow,
            col: s,
            class: cabin.class,
            isWindow,
            isAisle,
            isMiddle: !isWindow && !isAisle,
            isExit: r === 0 && cabin.class !== 'BUSINESS',
            isExtra: r === 0,
            gapRight: isAisleRight
          });
          
          seatsInBlock++;
          if (seatsInBlock >= blocks[blockIndex]) {
            seatsInBlock = 0;
            blockIndex++;
          }
        }
        currentRow++;
      }
    }
    return seats;
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await api.post('/api/flights', {
        flightDetails,
        aircraftDetails,
        cabinConfiguration: cabinConfig
      });
      toast.success('Flight created successfully with dynamic seat map!');
      router.push('/admin/flights');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create flight');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <button onClick={() => router.push('/admin/flights')} className="p-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors border border-border">
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <h2 className="text-2xl font-bold flex items-center gap-2 font-heading">Add New Flight</h2>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2 mb-8 bg-card p-4 rounded-xl border border-border shadow-sm">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step >= s ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted text-muted-foreground'}`}>
              {step > s ? <CheckCircle2 className="w-5 h-5" /> : s}
            </div>
            <span className={`text-sm font-medium ${step >= s ? 'text-foreground' : 'text-muted-foreground'}`}>
              {s === 1 ? 'Flight Info' : s === 2 ? 'Cabin Config' : 'Review & Publish'}
            </span>
            {s < 3 && <ChevronRight className="w-4 h-4 text-muted-foreground mx-2" />}
          </div>
        ))}
      </div>

      {/* Step 1: Flight Details */}
      {step === 1 && (
        <div className="bg-card border border-border rounded-xl p-6 space-y-6 shadow-sm">
          <h3 className="text-lg font-semibold text-foreground border-b border-border pb-4 font-heading">Flight Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Airline Name</label>
              <Input value={flightDetails.airline_name} onChange={e => setFlightDetails({...flightDetails, airline_name: e.target.value})} className="bg-background border-border text-foreground focus:border-primary" />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Flight Number</label>
              <Input value={flightDetails.flight_number} onChange={e => setFlightDetails({...flightDetails, flight_number: e.target.value})} className="bg-background border-border text-foreground focus:border-primary" />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Origin Airport (Code)</label>
              <Input value={flightDetails.origin_airport} onChange={e => setFlightDetails({...flightDetails, origin_airport: e.target.value})} className="bg-background border-border text-foreground focus:border-primary" />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Destination Airport (Code)</label>
              <Input value={flightDetails.destination_airport} onChange={e => setFlightDetails({...flightDetails, destination_airport: e.target.value})} className="bg-background border-border text-foreground focus:border-primary" />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Departure Time</label>
              <Input type="datetime-local" value={flightDetails.departure_time} onChange={e => setFlightDetails({...flightDetails, departure_time: e.target.value})} className="bg-background border-border text-foreground focus:border-primary [color-scheme:dark] dark:[color-scheme:dark]" />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Arrival Time</label>
              <Input type="datetime-local" value={flightDetails.arrival_time} onChange={e => setFlightDetails({...flightDetails, arrival_time: e.target.value})} className="bg-background border-border text-foreground focus:border-primary [color-scheme:dark] dark:[color-scheme:dark]" />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Base Price (USD)</label>
              <Input type="number" value={flightDetails.base_price} onChange={e => setFlightDetails({...flightDetails, base_price: e.target.value})} className="bg-background border-border text-foreground focus:border-primary" />
            </div>
          </div>
          <div className="flex justify-end pt-4">
            <button onClick={() => setStep(2)} className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded-lg font-medium transition-colors shadow-sm">Next Step</button>
          </div>
        </div>
      )}

      {/* Step 2: Aircraft & Cabin */}
      {step === 2 && (
        <div className="bg-card border border-border rounded-xl p-6 space-y-6 shadow-sm">
          <h3 className="text-lg font-semibold text-foreground border-b border-border pb-4 font-heading">Aircraft & Cabin Setup</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Aircraft Model</label>
              <Input value={aircraftDetails.aircraft_name} onChange={e => setAircraftDetails({...aircraftDetails, aircraft_name: e.target.value})} className="bg-background border-border text-foreground focus:border-primary" />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Layout Type</label>
              <select value={aircraftDetails.layout_type} onChange={e => setAircraftDetails({...aircraftDetails, layout_type: e.target.value})} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none">
                <option value="NARROW_BODY">Narrow Body (Single Aisle)</option>
                <option value="WIDE_BODY">Wide Body (Twin Aisle)</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium text-muted-foreground">Cabin Sections (Ordered Front to Back)</h4>
            {cabinConfig.map((cabin, idx) => (
              <div key={idx} className="flex flex-wrap md:flex-nowrap items-end gap-4 p-4 bg-muted/30 border border-border rounded-lg">
                <div className="w-full md:w-1/4 space-y-2">
                  <label className="text-xs text-muted-foreground">Class</label>
                  <select value={cabin.class} onChange={e => { const nc = [...cabinConfig]; nc[idx].class = e.target.value; setCabinConfig(nc); }} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:border-primary outline-none">
                    <option value="BUSINESS">Business</option>
                    <option value="PREMIUM_ECONOMY">Premium Economy</option>
                    <option value="ECONOMY">Economy</option>
                  </select>
                </div>
                <div className="w-full md:w-1/4 space-y-2">
                  <label className="text-xs text-muted-foreground">Layout (e.g. 3-3, 2-4-2)</label>
                  <Input value={cabin.layout} onChange={e => { const nc = [...cabinConfig]; nc[idx].layout = e.target.value; setCabinConfig(nc); }} className="bg-background border-border focus:border-primary text-foreground" />
                </div>
                <div className="w-full md:w-1/4 space-y-2">
                  <label className="text-xs text-muted-foreground">Rows</label>
                  <Input type="number" value={cabin.rows} onChange={e => { const nc = [...cabinConfig]; nc[idx].rows = parseInt(e.target.value)||0; setCabinConfig(nc); }} className="bg-background border-border focus:border-primary text-foreground" />
                </div>
                <div className="w-full md:w-1/4 space-y-2">
                  <label className="text-xs text-muted-foreground">Price Modifier (+)</label>
                  <Input type="number" value={cabin.priceModifier} onChange={e => { const nc = [...cabinConfig]; nc[idx].priceModifier = parseInt(e.target.value)||0; setCabinConfig(nc); }} className="bg-background border-border focus:border-primary text-foreground" />
                </div>
                <button onClick={() => setCabinConfig(cabinConfig.filter((_, i) => i !== idx))} className="mb-1 p-2 text-destructive hover:bg-destructive/10 rounded-lg">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
            <button onClick={() => setCabinConfig([...cabinConfig, { class: 'ECONOMY', layout: '3-3', rows: 5, priceModifier: 0 }])} className="text-sm font-medium text-primary hover:text-primary/80">
              + Add Cabin Section
            </button>
          </div>

          <div className="flex justify-between pt-4">
            <button onClick={() => setStep(1)} className="px-6 py-2 rounded-lg font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors border border-transparent hover:border-border">Back</button>
            <button onClick={() => setStep(3)} className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded-lg font-medium transition-colors shadow-sm">Preview Seat Map</button>
          </div>
        </div>
      )}

      {/* Step 3: Review & Publish */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-foreground border-b border-border pb-4 mb-4 font-heading">Cockpit & Cabin Live Preview</h3>
            
            <div className="flex justify-center my-8">
              <div className="bg-background border-2 border-border/50 rounded-[100px] p-8 pb-20 max-w-sm w-full relative shadow-inner">
                {/* Cockpit */}
                <div className="w-full h-24 bg-gradient-to-b from-muted to-transparent border-b-2 border-border/30 rounded-t-full mb-8 flex items-center justify-center relative overflow-hidden">
                  <Plane className="w-8 h-8 text-muted-foreground/50 absolute top-4" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground/30 tracking-[0.2em]">{aircraftDetails.aircraft_code}</div>
                </div>

                {/* Seat Map */}
                <div className="space-y-2">
                  {Object.entries(
                    generatePreview().reduce((acc, seat) => {
                      acc[seat.row] = acc[seat.row] || [];
                      acc[seat.row].push(seat);
                      return acc;
                    }, {} as Record<number, any[]>)
                  ).map(([rowStr, rowSeats]: any) => (
                    <div key={rowStr} className="flex justify-center gap-1">
                      {rowSeats.map((seat: any, i: number) => (
                        <div key={i} className="flex items-center">
                          <div className={`w-8 h-8 rounded flex items-center justify-center text-[10px] font-medium border ${
                            seat.class === 'BUSINESS' ? 'bg-primary/20 border-primary/40 text-primary' :
                            seat.class === 'PREMIUM_ECONOMY' ? 'bg-blue-600/20 border-blue-500/40 text-blue-400 dark:text-blue-300' :
                            'bg-muted border-border text-muted-foreground'
                          }`}>
                            {seat.isExit && <span className="w-1 h-1 rounded-full bg-destructive absolute top-0.5 right-0.5"></span>}
                          </div>
                          {seat.gapRight && <div className="w-6 shrink-0" />} {/* Aisle */}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4 mt-8 border-t border-border">
              <button onClick={() => setStep(2)} className="px-6 py-2 rounded-lg font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors border border-transparent hover:border-border">Back to Edit</button>
              <button 
                onClick={handleSubmit} 
                disabled={loading}
                className="bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-700 dark:hover:bg-emerald-600 text-white px-8 py-2 rounded-lg font-bold transition-colors flex items-center gap-2 shadow-sm hover:shadow-md"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plane className="w-5 h-5" />}
                {loading ? 'Generating Layout...' : 'Publish Flight & Generate Seats'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
