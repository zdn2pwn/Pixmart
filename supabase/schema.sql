-- ============================================================
-- PIXMART — Supabase PostgreSQL Schema (Location-Based P2P Escrow)
-- Jalankan script ini di Supabase Dashboard -> SQL Editor -> Run
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES (Anonymous by default, linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  codename TEXT NOT NULL,
  email TEXT,
  role TEXT CHECK (role IN ('OWNER', 'SELLER', 'BUYER')),
  reputation NUMERIC DEFAULT 100,
  completed_deals INTEGER DEFAULT 0,
  location_city TEXT DEFAULT 'Jakarta',
  location_district TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Trigger to auto-create profile on new user registration in Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, codename, role)
  VALUES (
    NEW.id,
    NEW.email,
    'Anon_#' || UPPER(SUBSTRING(NEW.id::text FROM 1 FOR 4)),
    COALESCE(NEW.raw_user_meta_data->>'role', NULL)
  )
  ON CONFLICT (id) DO UPDATE SET
    role = COALESCE(EXCLUDED.role, public.profiles.role),
    email = EXCLUDED.email,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. PRODUCTS
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  condition TEXT NOT NULL,
  fiat_estimate_idr NUMERIC NOT NULL,
  price_btc NUMERIC NOT NULL,
  price_xmr NUMERIC NOT NULL,
  stock INTEGER DEFAULT 1,
  location_city TEXT NOT NULL,
  location_district TEXT NOT NULL,
  location_region TEXT,
  approx_latitude NUMERIC NOT NULL,
  approx_longitude NUMERIC NOT NULL,
  meetup_zone TEXT NOT NULL,
  meeting_availability TEXT,
  legal_status_guarantee BOOLEAN DEFAULT TRUE,
  status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'IN_NEGOTIATION', 'IN_ESCROW', 'SOLD', 'CANCELLED')),
  views INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Products viewable by everyone" ON public.products;
CREATE POLICY "Products viewable by everyone" ON public.products FOR SELECT USING (true);
DROP POLICY IF EXISTS "Sellers can manage their products" ON public.products;
CREATE POLICY "Sellers can manage their products" ON public.products FOR ALL USING (auth.uid() = seller_id);

-- 3. PRODUCT IMAGES
CREATE TABLE IF NOT EXISTS public.product_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Product images viewable by everyone" ON public.product_images;
CREATE POLICY "Product images viewable by everyone" ON public.product_images FOR SELECT USING (true);

-- 4. WISHLIST
CREATE TABLE IF NOT EXISTS public.wishlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own wishlist" ON public.wishlist;
CREATE POLICY "Users can manage own wishlist" ON public.wishlist FOR ALL USING (auth.uid() = user_id);

-- 5. NEGOTIATIONS
CREATE TABLE IF NOT EXISTS public.negotiations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  buyer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  seller_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'OFFER_MADE', 'COUNTER_OFFERED', 'DEAL_AGREED', 'REJECTED', 'CANCELLED')),
  current_offer_price NUMERIC NOT NULL,
  current_offer_btc NUMERIC,
  current_offer_xmr NUMERIC,
  last_offer_by TEXT CHECK (last_offer_by IN ('BUYER', 'SELLER')),
  escrow_room_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.negotiations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Participants can view negotiations" ON public.negotiations;
CREATE POLICY "Participants can view negotiations" ON public.negotiations
  FOR ALL USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- 6. NEGOTIATION MESSAGES
CREATE TABLE IF NOT EXISTS public.negotiation_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  negotiation_id UUID REFERENCES public.negotiations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('BUYER', 'SELLER', 'SYSTEM')),
  message_type TEXT NOT NULL CHECK (message_type IN ('TEXT', 'OFFER', 'COUNTER_OFFER', 'ACCEPT', 'REJECT', 'DEAL_LOCKED')),
  amount NUMERIC,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.negotiation_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Participants can view and send negotiation messages" ON public.negotiation_messages;
CREATE POLICY "Participants can view and send negotiation messages" ON public.negotiation_messages
  FOR ALL USING (true);

-- 7. ESCROW ROOMS (In-Person COD & Coordination)
CREATE TABLE IF NOT EXISTS public.escrow_rooms (
  id TEXT PRIMARY KEY,
  transaction_id TEXT NOT NULL,
  negotiation_id UUID REFERENCES public.negotiations(id) ON DELETE SET NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  buyer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  seller_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  final_price_idr NUMERIC NOT NULL,
  crypto_currency TEXT DEFAULT 'XMR' CHECK (crypto_currency IN ('BTC', 'XMR')),
  crypto_amount NUMERIC NOT NULL,
  handshake_status TEXT DEFAULT 'WAITING_FOR_BUYER',
  buyer_connected BOOLEAN DEFAULT FALSE,
  seller_connected BOOLEAN DEFAULT FALSE,
  meeting_status TEXT DEFAULT 'MEETING_PENDING',
  meeting_location_name TEXT,
  meeting_area_note TEXT,
  meeting_date_time TEXT,
  meeting_confirmed_at TIMESTAMPTZ,
  buyer_arrived BOOLEAN DEFAULT FALSE,
  seller_arrived BOOLEAN DEFAULT FALSE,
  buyer_arrived_at TIMESTAMPTZ,
  seller_arrived_at TIMESTAMPTZ,
  buyer_confirmed_received BOOLEAN DEFAULT FALSE,
  seller_confirmed_handed_over BOOLEAN DEFAULT FALSE,
  buyer_confirmed_at TIMESTAMPTZ,
  seller_confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.escrow_rooms ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Participants can view escrow rooms" ON public.escrow_rooms;
CREATE POLICY "Participants can view escrow rooms" ON public.escrow_rooms
  FOR ALL USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- 8. ESCROW MESSAGES
CREATE TABLE IF NOT EXISTS public.escrow_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  escrow_room_id TEXT REFERENCES public.escrow_rooms(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('BUYER', 'SELLER', 'SYSTEM')),
  message_type TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.escrow_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Participants can access escrow messages" ON public.escrow_messages;
CREATE POLICY "Participants can access escrow messages" ON public.escrow_messages
  FOR ALL USING (true);

-- 9. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link_url TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR ALL USING (auth.uid() = user_id);

-- 10. Enable Supabase Realtime Publication
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

ALTER PUBLICATION supabase_realtime ADD TABLE public.escrow_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.escrow_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.negotiations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.negotiation_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
