import { Request, Response } from 'express';
import { supabase } from '../database/supabase';

function generateSeatMap(cabins: any[], flightId: string, aircraftId: string) {
  const seats: any[] = [];
  let currentRowNum = 1;
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  for (const cabin of cabins) {
    const layoutBlocks = cabin.layout.split('-').map(Number);
    const seatsPerRow = layoutBlocks.reduce((a: number, b: number) => a + b, 0);

    for (let r = 0; r < cabin.rows; r++) {
      let currentSeatIndex = 0;
      let blockIndex = 0;
      let seatsInCurrentBlock = 0;

      for (let s = 0; s < seatsPerRow; s++) {
        const isWindow = s === 0 || s === seatsPerRow - 1;
        const isAisleLeft = seatsInCurrentBlock === 0 && blockIndex > 0;
        const isAisleRight = seatsInCurrentBlock === layoutBlocks[blockIndex] - 1 && blockIndex < layoutBlocks.length - 1;
        const isAisle = isAisleLeft || isAisleRight;
        const isMiddle = !isWindow && !isAisle;
        
        // Mark first row of Economy/Premium as exit row (simplified logic)
        const isExitRow = r === 0 && cabin.class !== 'BUSINESS';
        const isExtraLegroom = r === 0;

        seats.push({
          flight_id: flightId,
          aircraft_id: aircraftId,
          seat_number: `${currentRowNum}${alphabet[s]}`,
          row_number: currentRowNum,
          seat_label: alphabet[s],
          cabin_class: cabin.class,
          seat_type: isExitRow ? 'EXIT_ROW' : isExtraLegroom ? 'EXTRA_LEGROOM' : isWindow ? 'WINDOW' : isAisle ? 'AISLE' : 'MIDDLE',
          status: 'AVAILABLE',
          price_modifier: cabin.priceModifier || 0,
          is_window: isWindow,
          is_aisle: isAisle,
          is_middle: isMiddle,
          is_exit_row: isExitRow,
          is_extra_legroom: isExtraLegroom,
          x_position: s,
          y_position: currentRowNum
        });

        seatsInCurrentBlock++;
        if (seatsInCurrentBlock >= layoutBlocks[blockIndex]) {
          seatsInCurrentBlock = 0;
          blockIndex++;
        }
      }
      currentRowNum++;
    }
  }
  return seats;
}

export const createFlight = async (req: Request, res: Response): Promise<void> => {
  try {
    const { flightDetails, aircraftDetails, cabinConfiguration } = req.body;
    
    const { airline_name, flight_number, origin_airport, destination_airport, departure_time, arrival_time, base_price } = flightDetails;
    const { aircraft_code, aircraft_name, model, layout_type } = aircraftDetails;

    // 1. Create Aircraft
    let totalRows = 0;
    let totalSeats = 0;
    cabinConfiguration.forEach((c: any) => {
      totalRows += c.rows;
      const seatsPerRow = c.layout.split('-').map(Number).reduce((a: number, b: number) => a + b, 0);
      totalSeats += (c.rows * seatsPerRow);
    });

    const { data: aircraftData, error: aircraftError } = await supabase.from('aircrafts').insert([{
      aircraft_code,
      aircraft_name,
      model,
      airline_name,
      total_rows: totalRows,
      total_seats: totalSeats,
      layout_type,
      cabin_configuration_json: cabinConfiguration
    }]).select();

    if (aircraftError || !aircraftData) throw new Error(`Aircraft Error: ${aircraftError?.message}`);
    const aircraftId = aircraftData[0].id;

    // 2. Create Flight
    const depDate = new Date(departure_time);
    const arrDate = new Date(arrival_time);
    const durationMinutes = Math.floor((arrDate.getTime() - depDate.getTime()) / 60000);

    const { data: flightData, error: flightError } = await supabase.from('flights').insert([{
      flight_number,
      airline_name,
      aircraft_id: aircraftId,
      origin_airport,
      destination_airport,
      departure_time,
      arrival_time,
      duration_minutes: durationMinutes > 0 ? durationMinutes : 120,
      base_price,
      status: 'SCHEDULED'
    }]).select();

    if (flightError || !flightData) throw new Error(`Flight Error: ${flightError?.message}`);
    const flightId = flightData[0].id;

    // 3. Generate and Insert Seats
    const seatsToInsert = generateSeatMap(cabinConfiguration, flightId, aircraftId);
    
    // Chunk insert to avoid request too large errors
    const chunkSize = 100;
    for (let i = 0; i < seatsToInsert.length; i += chunkSize) {
      const chunk = seatsToInsert.slice(i, i + chunkSize);
      const { error: seatError } = await supabase.from('flight_seats').insert(chunk);
      if (seatError) throw new Error(`Seat Insert Error: ${seatError.message}`);
    }

    res.status(201).json({ flight: flightData[0], seats_generated: seatsToInsert.length });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const updateFlight = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const updates = req.body;
  const { data, error } = await supabase.from('flights').update(updates).eq('id', id).select();
  if (error) {
    res.status(400).json({ error: error.message });
    return;
  }
  res.status(200).json({ data: data[0] });
};

export const deleteFlight = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { error } = await supabase.from('flights').delete().eq('id', id);
  if (error) {
    res.status(400).json({ error: error.message });
    return;
  }
  res.status(200).json({ message: 'Flight deleted successfully' });
};

export const getFlight = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { data, error } = await supabase.from('flights').select('*, aircrafts(*)').eq('id', id).single();
  if (error) {
    res.status(404).json({ error: 'Flight not found' });
    return;
  }
  res.status(200).json({ data });
};

export const searchFlights = async (req: Request, res: Response): Promise<void> => {
  const { origin, destination, date, maxPrice, minSeats } = req.query;
  
  let query = supabase.from('flights').select('*, aircrafts(*)');

  // Hides flights within 6 hours
  const cutoffTime = new Date(Date.now() + 6 * 60 * 60 * 1000);
  let startDate = cutoffTime;
  let endDate: Date | null = null;

  if (origin) query = query.ilike('origin_airport', `%${origin}%`);
  if (destination) query = query.ilike('destination_airport', `%${destination}%`);

  // ── Max price filter (applied directly on DB query) ──────────────────────
  if (maxPrice) {
    const maxPriceNum = Number(maxPrice);
    if (!isNaN(maxPriceNum) && maxPriceNum > 0) {
      query = query.lte('base_price', maxPriceNum);
    }
  }
  
  if (date) {
    const searchDate = new Date(date as string);
    const nextDay = new Date(searchDate);
    nextDay.setDate(nextDay.getDate() + 1);
    
    if (searchDate > cutoffTime) {
      startDate = searchDate;
    }
    endDate = nextDay;
  }

  query = query.gte('departure_time', startDate.toISOString());
  if (endDate) {
    query = query.lt('departure_time', endDate.toISOString());
  }

  // Only return scheduled / active flights
  query = query.neq('status', 'CANCELLED');

  const { data, error } = await query;
  if (error) {
    res.status(400).json({ error: error.message });
    return;
  }

  // ── Format data: fetch available seat count per flight in parallel ────────
  const minSeatsNum = minSeats ? Number(minSeats) : 1;

  const formattedData = (await Promise.all(data.map(async (f: any) => {
    const { count } = await supabase
      .from('flight_seats')
      .select('*', { count: 'exact', head: true })
      .eq('flight_id', f.id)
      .eq('status', 'AVAILABLE');

    return {
      id: f.id,
      airline: f.airline_name,
      flight_number: f.flight_number,
      source: f.origin_airport,
      destination: f.destination_airport,
      departure_time: f.departure_time,
      arrival_time: f.arrival_time,
      price: Number(f.base_price),
      available_seats: count || 0
    };
  }))).filter((f: any) => f.available_seats >= minSeatsNum);

  res.status(200).json({ data: formattedData });
};
