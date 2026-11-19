# PIXMART

PIXMART is a demo Anonymous local marketplace for physical goods. Buyers and sellers negotiate price and meeting point, then complete the deal in person (cash on delivery) with a simulated escrow and dual confirmation. All balances, deposits, and cryptocurrency (BTC/XMR) are simulated; no real funds move.

The interface uses an arcade-inspired design system with dark-first theming, lime accents, and vendored 8-bit UI primitives.

## Preview

![PIXMART Neon Local Marketplace](public/pixmart-neon-local-marketplace.png)

## Features

- Marketplace catalog with filters for city, category, radius, and sort order
- Listing creation and editing for sellers, including images, stock, and location
- Buyer-seller negotiation rooms with offers and chat
- Escrow rooms with meeting coordination, arrival confirmation, dual handshake, and midman verification
- Buyer dashboard and seller dashboard
- Owner/midman dashboard for escrow oversight
- Profile management with simulated BTC/XMR wallets and balances
- Wishlist, notifications, and a reputation card on the profile page
- Arcade-styled 404 page

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16.4.6 (App Router, Turbopack) |
| UI library | React 19.3.0 |
| Styling | Tailwind CSS 4.3.3 |
| Language | TypeScript 5 |
| Backend / database | Supabase (PostgreSQL) via `@supabase/ssr` and `@supabase/supabase-js` |
| Icons | lucide-react |
| UI primitives | Radix UI |
| Utilities | clsx, tailwind-merge, date-fns, class-variance-authority |

## Project Structure

```
app/
  page.tsx                 Landing page
  marketplace/             Catalog, detail, new, edit
  negotiations/            Negotiation rooms
  escrow/                  Escrow rooms
  dashboard/               Buyer dashboard
  seller/                  Seller dashboard
  owner/                   Midman dashboard
  profile/                 Profile settings
  login/ register/         Authentication
  onboarding/              First-run setup
  not-found.tsx            Arcade 404 page
components/
  layout/                  Navbar, footer, notification bell
  ui/                      Base and 8-bit UI primitives
  nego/                    Negotiation components
lib/
  supabase/                Supabase clients
  crypto-wallet.ts         Simulated BTC/XMR address generation and validation
  types.ts                 Shared TypeScript types
supabase/migrations/       SQL migrations
```

## Getting Started

### Prerequisites

- Node.js 20 or newer
- A Supabase project (free tier is sufficient)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/zdn2pwn/Pixmart.git
   cd Pixmart
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env.local` file in the project root with your Supabase credentials:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Run the database migrations in the Supabase SQL Editor, in order:

   - `supabase/migrations/20240116000000_add_stock_column.sql`
   - `supabase/migrations/20240117000000_add_soft_delete_to_escrow.sql`
   - `supabase/migrations/001_wow_features.sql`

5. Start the development server:

   ```bash
   npm run dev
   ```

6. Open http://localhost:3000 in your browser.

## Available Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm run start` | Run the production server |
| `npm run lint` | Run ESLint |

## Routes

- `/` - Landing page
- `/marketplace` - Product catalog with filters
- `/marketplace/[id]` - Product detail and escrow entry
- `/marketplace/new` - Create a listing
- `/marketplace/[id]/edit` - Edit a listing
- `/dashboard` - Buyer dashboard
- `/seller` - Seller dashboard
- `/negotiations` - Negotiation list
- `/negotiations/[id]` - Negotiation room
- `/escrow` - Escrow list
- `/escrow/[id]` - Escrow room
- `/owner` - Midman dashboard
- `/owner/escrow/[id]` - Midman escrow room
- `/profile` - Profile and wallet settings
- `/login`, `/register`, `/onboarding` - Authentication and setup

## Important Notes

- This is a presentation demo. Escrow, balances, and cryptocurrency (BTC/XMR) are simulated; no real funds move and no real blockchain transactions occur.
- Only legal physical goods are intended for listing. The project follows a zero contraband policy.
- The Supabase anon key is a public client key by design; row-level security policies in the migrations are permissive for demo purposes and should be tightened before any production use.
- Deployment protection on the hosting platform may require authentication to view the deployed site; disable it in the platform dashboard for public access.

## Deployment

The project is deployed on Vercel. To deploy your own instance:

1. Import the repository into Vercel.
2. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in the project environment variables.
3. Deploy. Vercel auto-detects Next.js.

## License

This repository is provided for demo and presentation purposes.


