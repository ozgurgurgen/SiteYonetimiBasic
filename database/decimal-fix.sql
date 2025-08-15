-- Supabase PostgreSQL Schema Update
-- This file ensures that decimal values are properly handled in the database

-- Make sure expenses.amount column supports decimal values
ALTER TABLE expenses ALTER COLUMN amount TYPE DECIMAL(10,2);

-- Make sure settings.monthly_fee supports decimal values  
ALTER TABLE settings ALTER COLUMN monthly_fee TYPE DECIMAL(8,2);

-- Make sure settings.previous_carry_over supports decimal values
ALTER TABLE settings ALTER COLUMN previous_carry_over TYPE DECIMAL(12,2);

-- Update any fee_history amounts to decimal in JSONB
-- Note: JSONB already supports decimal numbers, but we ensure consistency

-- Create index for better performance on amount queries
CREATE INDEX IF NOT EXISTS idx_expenses_amount ON expenses(amount);
CREATE INDEX IF NOT EXISTS idx_settings_monthly_fee ON settings(monthly_fee);

-- Example of how to update existing data if needed:
-- UPDATE expenses SET amount = ROUND(amount::DECIMAL, 2);
-- UPDATE settings SET monthly_fee = ROUND(monthly_fee::DECIMAL, 2);
-- UPDATE settings SET previous_carry_over = ROUND(previous_carry_over::DECIMAL, 2);
