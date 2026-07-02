-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables related to flights/bookings to apply new schema
DROP TABLE IF EXISTS flight_seats CASCADE;
DROP TABLE IF EXISTS booking_passengers CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS flights CASCADE;
DROP TABLE IF EXISTS aircrafts CASCADE;
DROP TABLE IF EXISTS aircraft_layout_templates CASCADE;

-- 1) aircraft_layout_templates
CREATE TABLE aircraft_layout_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_name TEXT NOT NULL,
    aircraft_model TEXT NOT NULL,
    layout_json JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE aircraft_layout_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view templates" ON aircraft_layout_templates FOR SELECT USING (true);
CREATE POLICY "Admins can manage templates" ON aircraft_layout_templates FOR ALL USING (true);

-- 2) aircrafts
CREATE TABLE aircrafts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    aircraft_code TEXT NOT NULL,
    aircraft_name TEXT NOT NULL,
    model TEXT NOT NULL,
    airline_name TEXT NOT NULL,
    total_rows INTEGER NOT NULL,
    total_seats INTEGER NOT NULL,
    layout_type TEXT NOT NULL,
    cabin_configuration_json JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE aircrafts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view aircrafts" ON aircrafts FOR SELECT USING (true);
CREATE POLICY "Admins can manage aircrafts" ON aircrafts FOR ALL USING (true);

-- 3) flights
CREATE TABLE flights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    flight_number TEXT NOT NULL,
    airline_name TEXT NOT NULL,
    aircraft_id UUID NOT NULL REFERENCES aircrafts(id) ON DELETE CASCADE,
    origin_airport TEXT NOT NULL,
    destination_airport TEXT NOT NULL,
    departure_time TIMESTAMP WITH TIME ZONE NOT NULL,
    arrival_time TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER NOT NULL,
    base_price DECIMAL(10, 2) NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('SCHEDULED', 'BOARDING', 'DELAYED', 'CANCELLED', 'COMPLETED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE flights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access on flights" ON flights FOR SELECT USING (true);
CREATE POLICY "Backend can manage flights" ON flights FOR ALL USING (true);

-- 4) bookings
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    flight_id UUID NOT NULL REFERENCES flights(id) ON DELETE CASCADE,
    pnr TEXT NOT NULL UNIQUE,
    total_passengers INTEGER NOT NULL DEFAULT 1,
    adults INTEGER NOT NULL DEFAULT 1,
    children INTEGER NOT NULL DEFAULT 0,
    infants INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL CHECK (status IN ('Pending', 'Confirmed', 'Cancelled', 'Completed')),
    total_amount NUMERIC NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own bookings" ON bookings FOR SELECT USING (true);
CREATE POLICY "Users can insert own bookings" ON bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own bookings" ON bookings FOR UPDATE USING (true);

-- 5) booking_passengers
CREATE TABLE booking_passengers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    passenger_type TEXT NOT NULL CHECK (passenger_type IN ('ADULT', 'CHILD', 'INFANT')),
    title TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    gender TEXT NOT NULL,
    date_of_birth DATE,
    nationality TEXT,
    passport_number TEXT,
    seat_number TEXT,
    meal_preference TEXT,
    special_assistance TEXT,
    ticket_number TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE booking_passengers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Backend can manage passengers" ON booking_passengers FOR ALL USING (true);

-- 6) flight_seats
CREATE TABLE flight_seats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    flight_id UUID NOT NULL REFERENCES flights(id) ON DELETE CASCADE,
    aircraft_id UUID NOT NULL REFERENCES aircrafts(id) ON DELETE CASCADE,
    seat_number TEXT NOT NULL,
    row_number INTEGER NOT NULL,
    seat_label TEXT NOT NULL,
    cabin_class TEXT NOT NULL CHECK (cabin_class IN ('BUSINESS', 'PREMIUM_ECONOMY', 'ECONOMY')),
    seat_type TEXT NOT NULL CHECK (seat_type IN ('WINDOW', 'AISLE', 'MIDDLE', 'EXIT_ROW', 'EXTRA_LEGROOM')),
    status TEXT NOT NULL CHECK (status IN ('AVAILABLE', 'BOOKED', 'BLOCKED', 'RESERVED')),
    price_modifier DECIMAL(10, 2) NOT NULL DEFAULT 0,
    is_window BOOLEAN DEFAULT false,
    is_aisle BOOLEAN DEFAULT false,
    is_middle BOOLEAN DEFAULT false,
    is_exit_row BOOLEAN DEFAULT false,
    is_extra_legroom BOOLEAN DEFAULT false,
    x_position NUMERIC,
    y_position NUMERIC,
    passenger_id UUID REFERENCES auth.users(id),
    booking_id UUID REFERENCES bookings(id),
    booking_passenger_id UUID REFERENCES booking_passengers(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE flight_seats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view flight seats" ON flight_seats FOR SELECT USING (true);
CREATE POLICY "Backend can manage flight seats" ON flight_seats FOR ALL USING (true);

-- 7) notifications (existing)
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can insert notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;

CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (true);
CREATE POLICY "Users can insert notifications" ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (true);

-- 8) customer_feedback (existing)
CREATE TABLE IF NOT EXISTS customer_feedback (  
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),  
    user_id UUID REFERENCES auth.users(id),  
    name TEXT NOT NULL,  
    email TEXT NOT NULL,  
    subject TEXT NOT NULL,  
    message TEXT NOT NULL,  
    status TEXT NOT NULL DEFAULT 'Open',  
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()  
);  

ALTER TABLE customer_feedback ENABLE ROW LEVEL SECURITY;  
DROP POLICY IF EXISTS "Anyone can insert feedback" ON customer_feedback;
DROP POLICY IF EXISTS "Admins can manage feedback" ON customer_feedback;

CREATE POLICY "Anyone can insert feedback" ON customer_feedback FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can manage feedback" ON customer_feedback FOR ALL USING (true);

-- 9) chat_sessions
CREATE TABLE IF NOT EXISTS chat_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own chat sessions" ON chat_sessions FOR ALL USING (true);

-- 10) chat_messages
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    sender TEXT NOT NULL CHECK (sender IN ('user', 'ai')),
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own chat messages" ON chat_messages FOR ALL USING (true);
