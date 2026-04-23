-- 1. Products Table
CREATE TABLE products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  wholesale_price NUMERIC DEFAULT 0,
  selling_price NUMERIC DEFAULT 0,
  quantity INTEGER DEFAULT 0,
  backroom_quantity INTEGER DEFAULT 0,
  notes TEXT,
  image_url TEXT,
  category TEXT,
  type TEXT CHECK (type IN ('product', 'service')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expiration_date DATE
);

-- 2. Sales Table
CREATE TABLE sales (
  id TEXT PRIMARY KEY,
  product_id TEXT REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT,
  category TEXT,
  type TEXT CHECK (type IN ('product', 'service')),
  quantity INTEGER DEFAULT 1,
  unit_price NUMERIC DEFAULT 0,
  total_base_price NUMERIC DEFAULT 0,
  wholesale_total_cost NUMERIC DEFAULT 0,
  discount NUMERIC DEFAULT 0,
  final_price NUMERIC DEFAULT 0,
  profit NUMERIC DEFAULT 0,
  method TEXT,
  date TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  customer_id TEXT,
  customer_name TEXT,
  customer_phone TEXT
);

-- 3. Transactions Table
CREATE TABLE transactions (
  id TEXT PRIMARY KEY,
  type TEXT,
  source_account TEXT,
  destination_account TEXT,
  profit_account TEXT,
  amount NUMERIC DEFAULT 0,
  commission NUMERIC DEFAULT 0,
  notes TEXT,
  date TIMESTAMPTZ DEFAULT NOW(),
  customer_id TEXT,
  proof_image_url TEXT
);

-- 4. Customers Table
CREATE TABLE customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  image_url TEXT,
  total_debt NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Settings Table
CREATE TABLE app_settings (
  id TEXT PRIMARY KEY DEFAULT 'auth_settings',
  owner_pin TEXT DEFAULT '2002',
  employee_pin TEXT DEFAULT '0000'
);

-- Insert default settings
INSERT INTO app_settings (id, owner_pin, employee_pin) 
VALUES ('auth_settings', '2002', '0000')
ON CONFLICT (id) DO NOTHING;

-- Enable Realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE products;
ALTER PUBLICATION supabase_realtime ADD TABLE sales;
ALTER PUBLICATION supabase_realtime ADD TABLE transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE customers;
ALTER PUBLICATION supabase_realtime ADD TABLE app_settings;

-- Enable Row Level Security (RLS) - Set to public for now to match Anonymous Auth behavior, or configure for authenticated users
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Simple policy: Allow everyone to do everything (matches the "Anonymous" simple setup)
-- In production, you'd want to restrict this more.
CREATE POLICY "Public full access" ON products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access" ON sales FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access" ON transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access" ON customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access" ON app_settings FOR ALL USING (true) WITH CHECK (true);

-- 6. Expenses Table
CREATE TABLE expenses (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  amount NUMERIC DEFAULT 0,
  category TEXT,
  type TEXT DEFAULT 'expense', -- 'expense' or 'waste'
  date TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Realtime for expenses
ALTER PUBLICATION supabase_realtime ADD TABLE expenses;

-- Enable RLS
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Policy
CREATE POLICY "Public full access" ON expenses FOR ALL USING (true) WITH CHECK (true);
