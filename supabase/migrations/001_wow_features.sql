-- PIXMART wow features migration (wishlist, notifications, reviews)
-- Run this in Supabase SQL Editor.

-- Clean slate for demo (safe to re-run)
drop table if exists public.wishlists cascade;
drop table if exists public.notifications cascade;
drop table if exists public.reviews cascade;

-- Wishlists
create table if not exists public.wishlists (
  user_id text not null,
  listing_id text not null references public.marketplace_listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, listing_id)
);

-- Notifications
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  type text not null default 'info',
  title text not null,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

-- Reviews / reputation
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  reviewer_id text not null,
  reviewee_id text not null,
  escrow_id text,
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_notifications_user on public.notifications(user_id, created_at desc);
create index if not exists idx_reviews_reviewee on public.reviews(reviewee_id);

-- Permissive RLS for demo (anon can read/write). Tighten for production.
alter table public.wishlists enable row level security;
alter table public.notifications enable row level security;
alter table public.reviews enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where tablename='wishlists' and policyname='demo_all_wishlists') then
    create policy demo_all_wishlists on public.wishlists for all using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename='notifications' and policyname='demo_all_notifications') then
    create policy demo_all_notifications on public.notifications for all using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename='reviews' and policyname='demo_all_reviews') then
    create policy demo_all_reviews on public.reviews for all using (true) with check (true);
  end if;
end $$;