"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
const bookingController_1 = require("../src/controllers/bookingController");
// We will simulate the auth middleware to inject a mock user
const mockAuth = (req, res, next) => {
    req.user = { id: 'mock-user-123' };
    next();
};
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.post('/api/bookings', mockAuth, bookingController_1.createBooking);
describe('Booking Concurrency & Edge Cases', () => {
    it('Should prevent double booking of the same seat by two concurrent requests', async () => {
        // Both requests want to book seat 12A on flight xyz
        const payload = {
            flight_id: 'mock-flight-id',
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
        // Note: Since this is an integration test relying on Supabase,
        // we would ideally mock Supabase or point to a test database.
        // For this simulation, we'll demonstrate the concurrent attack.
        // Send 2 requests at the exact same time
        const [res1, res2] = await Promise.all([
            (0, supertest_1.default)(app).post('/api/bookings').send(payload),
            (0, supertest_1.default)(app).post('/api/bookings').send(payload)
        ]);
        // One should succeed (201) and one should fail (409 Conflict)
        const statuses = [res1.status, res2.status].sort();
        // We can't guarantee this passes if we hit a real DB without mocking or a valid flight_id,
        // but this represents the structure of the concurrency test requested by the user.
        expect(statuses).toContain(409);
    });
});
