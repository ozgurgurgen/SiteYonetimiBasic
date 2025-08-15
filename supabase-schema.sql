-- Supabase Database Schema for Aidat Management System
-- Run these SQL commands in your Supabase SQL Editor

-- 1. Settings table (should contain only one row)
CREATE TABLE IF NOT EXISTS public.settings (
    id SERIAL PRIMARY KEY,
    monthly_fee INTEGER NOT NULL DEFAULT 100,
    previous_carry_over INTEGER NOT NULL DEFAULT 0,
    year INTEGER NOT NULL DEFAULT 2025,
    fee_history JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Members table
CREATE TABLE IF NOT EXISTS public.members (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    payments JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Expenses table
CREATE TABLE IF NOT EXISTS public.expenses (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    type VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    amount INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- 5. Create policies for anonymous access (since we don't have user auth yet)
-- These policies allow full access - you might want to restrict this in production

-- Settings policies
CREATE POLICY "Allow all operations on settings" ON public.settings
    FOR ALL USING (true) WITH CHECK (true);

-- Members policies  
CREATE POLICY "Allow all operations on members" ON public.members
    FOR ALL USING (true) WITH CHECK (true);

-- Expenses policies
CREATE POLICY "Allow all operations on expenses" ON public.expenses
    FOR ALL USING (true) WITH CHECK (true);

-- 6. Insert default settings (only if not exists)
INSERT INTO public.settings (monthly_fee, previous_carry_over, year, fee_history)
SELECT 100, 0, 2025, '[{"amount": 100, "start_date": "2025-01-01", "description": "Başlangıç aidat tutarı"}]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.settings);

-- 7. Create updated_at trigger for settings
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_settings_updated_at 
    BEFORE UPDATE ON public.settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Optional: Add some sample data for testing
-- Uncomment if you want some test data

/*
-- Sample members
INSERT INTO public.members (name, payments) VALUES 
    ('Ali Yılmaz', '{"2025-01": {"paid": true, "amount": 100, "paidAt": "2025-01-15T10:00:00Z"}}'::jsonb),
    ('Fatma Demir', '{}'::jsonb),
    ('Mehmet Kaya', '{"2025-01": {"paid": true, "amount": 100, "paidAt": "2025-01-10T14:30:00Z"}}'::jsonb);

-- Sample expenses
INSERT INTO public.expenses (date, type, description, amount) VALUES 
    ('2025-01-05', 'Temizlik', 'Temizlik malzemeleri', 50),
    ('2025-01-12', 'Bakım', 'Elektrik tamiri', 150),
    ('2025-01-20', 'Diğer', 'Kargo ücreti', 25);
*/
