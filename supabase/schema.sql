-- ============================================================
-- PIXMART — Supabase PostgreSQL Schema (Location-Based P2P Escrow)
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES (Anonymous by default)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codename TEXT NOT NULL, -- e.g. "Anonymous Buyer #8821"
  email TEXT UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('OWNER', 'SELLER', 'BUYER')),
  reputation NUMERIC DEFAULT 100,
  completed_deals INTEGER DEFAULT 0,
  location_city TEXT NOT NULL,
  location_district TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

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
  -- Location & Privacy (coordinates never exposed to untrusted clients directly)
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

-- 3. PRODUCT IMAGES
CREATE TABLE IF NOT EXISTS public.product_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. WISHLIST
CREATE TABLE IF NOT EXISTS public.wishlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

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

-- 6. NEGOTIATION MESSAGES & OFFERS
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

-- 7. ESCROW ROOMS (In-Person COD & Coordination)
CREATE TABLE IF NOT EXISTS public.escrow_rooms (
  id TEXT PRIMARY KEY, -- e.g. "ESC-7701"
  transaction_id TEXT NOT NULL,
  negotiation_id UUID REFERENCES public.negotiations(id) ON DELETE SET NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  buyer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  seller_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  final_price_idr NUMERIC NOT NULL,
  crypto_currency TEXT DEFAULT 'XMR' CHECK (crypto_currency IN ('BTC', 'XMR')),
  crypto_amount NUMERIC NOT NULL,
  
  -- Handshake Presence
  handshake_status TEXT DEFAULT 'WAITING_FOR_BUYER',
  buyer_connected BOOLEAN DEFAULT FALSE,
  seller_connected BOOLEAN DEFAULT FALSE,
  
  -- Meeting Status & COD
  meeting_status TEXT DEFAULT 'MEETING_PENDING' CHECK (meeting_status IN (
    'MEETING_PENDING', 'MEETING_PROPOSED', 'MEETING_CONFIRMED',
    'MEETING_STARTED', 'COD_PENDING', 'COMPLETED', 'CANCELLED', 'DISPUTED'
  )),
  
  -- Meeting Point Agreement
  meeting_location_name TEXT,
  meeting_area_note TEXT,
  meeting_date_time TEXT,
  meeting_confirmed_at TIMESTAMPTZ,
  
  -- Arrival
  buyer_arrived BOOLEAN DEFAULT FALSE,
  seller_arrived BOOLEAN DEFAULT FALSE,
  buyer_arrived_at TIMESTAMPTZ,
  seller_arrived_at TIMESTAMPTZ,
  
  -- COD Double Confirmation
  buyer_confirmed_received BOOLEAN DEFAULT FALSE,
  seller_confirmed_handed_over BOOLEAN DEFAULT FALSE,
  buyer_confirmed_at TIMESTAMPTZ,
  seller_confirmed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. MEETING PROPOSALS
CREATE TABLE IF NOT EXISTS public.meeting_proposals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  escrow_room_id TEXT REFERENCES public.escrow_rooms(id) ON DELETE CASCADE,
  proposed_by TEXT NOT NULL CHECK (proposed_by IN ('BUYER', 'SELLER')),
  location_name TEXT NOT NULL,
  area_note TEXT,
  proposed_date DATE NOT NULL,
  proposed_time TIME NOT NULL,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'COUNTERED')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. ESCROW ROOM MESSAGES (End-to-End In-Room Chat)
CREATE TABLE IF NOT EXISTS public.escrow_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  escrow_room_id TEXT REFERENCES public.escrow_rooms(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('BUYER', 'SELLER', 'SYSTEM')),
  message_type TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. DISPUTES
CREATE TABLE IF NOT EXISTS public.disputes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  escrow_room_id TEXT REFERENCES public.escrow_rooms(id) ON DELETE CASCADE,
  raised_by TEXT NOT NULL CHECK (raised_by IN ('BUYER', 'SELLER')),
  reason TEXT NOT NULL,
  description TEXT NOT NULL,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  resolution_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. AUDIT LOG (Immutable)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  action TEXT NOT NULL,
  target_id TEXT NOT NULL,
  details TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link_url TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Supabase Realtime Publication for Channels
ALTER PUBLICATION supabase_realtime ADD TABLE public.escrow_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.escrow_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.negotiations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.negotiation_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
