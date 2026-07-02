import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import { createBooking, changeSeat } from '../src/controllers/bookingController';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { supabase } from '../src/database/supabase';

// Mock Supabase
jest.mock('../src/database/supabase', () => ({
  supabase: {
    from: jest.fn(),
  }
}));

const mockAuth = (req: any, res: Response, next: NextFunction) => {
  req.user = { id: 'mock-user-123' };
  next();
};

const app = express();
app.use(express.json());
app.post('/api/bookings', mockAuth, createBooking as any);
app.patch('/api/bookings/:id/seat', mockAuth, changeSeat as any);

describe('Booking & Seat Change Concurrency', () => {
  let mockSeatsDB: Record<string, any>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // In-memory mock database of seats to simulate optimistic locking atomic updates
    mockSeatsDB = {
      '12A': { id: 'seat-12a', flight_id: 'flight-1', seat_number: '12A', status: 'AVAILABLE' },
      '14B': { id: 'seat-14b', flight_id: 'flight-1', seat_number: '14B', status: 'AVAILABLE' }
    };

    const mockFrom = jest.fn((table: string) => {
      let queryContext: any = { eq: {}, in: {} };

      const chain = {
        select: jest.fn<any>().mockReturnThis(),
        eq: jest.fn<any>((col: string, val: any) => { queryContext.eq[col] = val; return chain; }),
        in: jest.fn<any>((col: string, vals: any[]) => { queryContext.in[col] = vals; return chain; }),
        single: jest.fn<any>().mockImplementation(async () => {
          if (table === 'flights') return { data: { id: 'flight-1', flight_number: 'FL123', base_price: 100 }, error: null };
          if (table === 'bookings') return { data: { id: 'booking-1', flight_id: 'flight-1', flights: {} }, error: null };
          if (table === 'booking_passengers') return { data: { id: 'pax-1', booking_id: 'booking-1', seat_number: '12A', first_name: 'John' }, error: null };
          
          if (table === 'flight_seats') {
             const sNum = queryContext.eq['seat_number'];
             if (sNum && mockSeatsDB[sNum] && mockSeatsDB[sNum].status === 'RESERVED') {
                 return { data: mockSeatsDB[sNum], error: null };
             }
             return { data: null, error: new Error("Seat not found or not reserved") };
          }
          return { data: {}, error: null };
        }),
        update: jest.fn<any>((updateData: any) => {
          let updateChain: any = {
            eq: jest.fn<any>((col: string, val: any) => {
              queryContext.eq[col] = val;
              return updateChain;
            }),
            in: jest.fn<any>((col: string, vals: any[]) => {
              queryContext.in[col] = vals;
              return updateChain;
            }),
            select: jest.fn<any>(() => {
              return {
                single: jest.fn<any>().mockImplementation(async () => {
                  const sNum = queryContext.eq['seat_number'];
                  const reqStatus = queryContext.eq['status']; 
                  
                  if (sNum && mockSeatsDB[sNum]) {
                    if (mockSeatsDB[sNum].status === reqStatus) {
                       mockSeatsDB[sNum].status = updateData.status;
                       return { data: mockSeatsDB[sNum], error: null };
                    } else {
                       return { data: null, error: { message: "No rows updated" } };
                    }
                  }
                  return { data: null, error: { message: "Not found" } };
                }),
                then: (cb: any) => {
                  // for `.select()` without `.single()` used in `createBooking` update
                  const reqStatus = queryContext.eq['status']; 
                  const updated = [];
                  const vals = queryContext.in['seat_number'] || [];
                  for (const sNum of vals) {
                    if (mockSeatsDB[sNum] && mockSeatsDB[sNum].status === reqStatus) {
                      mockSeatsDB[sNum].status = updateData.status;
                      updated.push(mockSeatsDB[sNum]);
                    }
                  }
                  cb({ data: updated, error: null });
                }
              }
            })
          };
          
          if (table !== 'flight_seats') {
             return {
               eq: jest.fn<any>().mockReturnThis(),
               in: jest.fn<any>().mockReturnThis(),
               select: jest.fn<any>().mockReturnThis(),
               single: jest.fn<any>().mockReturnThis()
             };
          }
          return updateChain;
        }),
        insert: jest.fn<any>(() => ({
          select: jest.fn<any>(() => ({
            single: jest.fn<any>().mockResolvedValue({ data: { id: 'new-id' }, error: null }),
            then: (cb: any) => cb({ data: [{ id: 'new-id' }], error: null })
          }))
        })),
        delete: jest.fn<any>().mockReturnThis()
      };
      return chain;
    });

    (supabase.from as jest.Mock).mockImplementation(mockFrom as any);
  });

  it('createBooking - Should prevent double booking of the same seat by two concurrent requests', async () => {
    const payload = {
      flight_id: 'flight-1',
      total_amount: 100,
      passengers: [
        {
          passenger_type: 'ADULT',
          title: 'Mr',
          first_name: 'John',
          last_name: 'Doe',
          gender: 'Male',
          date_of_birth: '1990-01-01',
          nationality: 'US',
          passport_number: 'P12345',
          seat_number: '12A' // TARGET SEAT
        }
      ]
    };

    const [res1, res2] = await Promise.all([
      request(app).post('/api/bookings').send(payload),
      request(app).post('/api/bookings').send(payload)
    ]);

    const statuses = [res1.status, res2.status];
    if (res1.status === 500) console.log(res1.body);
    if (res2.status === 500) console.log(res2.body);
    expect(statuses).toContain(201); // One success
    expect(statuses).toContain(409); // One conflict

    const conflictRes = res1.status === 409 ? res1 : res2;
    expect(conflictRes.body.code).toBe('SEAT_ALREADY_BOOKED');
  });

  it('changeSeat - Should prevent double booking of the same seat by two concurrent requests', async () => {
    // Both requests hit the change seat endpoint targeting 14B at exactly the same time
    const [res1, res2] = await Promise.all([
      request(app)
        .patch('/api/bookings/booking-1/seat')
        .send({ passengerId: 'pax-1', newSeat: '14B' }),
      request(app)
        .patch('/api/bookings/booking-1/seat')
        .send({ passengerId: 'pax-1', newSeat: '14B' })
    ]);

    const statuses = [res1.status, res2.status];
    expect(statuses).toContain(200); // One success
    expect(statuses).toContain(409); // One conflict
    
    const conflictRes = res1.status === 409 ? res1 : res2;
    expect(conflictRes.body.code).toBe('SEAT_ALREADY_BOOKED');
  });
});
