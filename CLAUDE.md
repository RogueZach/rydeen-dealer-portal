# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Rydeen Dealer Portal — a B2B order portal for Rydeen Mobile (car accessory company). Car dealers log in to browse products, see dealer-specific pricing, and place orders. This is NOT an e-commerce storefront; there is no payment processing. Orders are submitted and forwarded to orders@rydeenmobile.com for manual processing by the Rydeen team (Mon–Fri, 9:30 AM–4:30 PM PCT).

The original spec calls for building on irearview.com, but this repo is being developed as a standalone application, separate from irearview.com for now. Integration may happen later.

## Tech Stack

- **Framework:** Next.js 15 (App Router, TypeScript, Turbopack)
- **Database/Auth:** Supabase (PostgreSQL, Email OTP auth, Row Level Security)
- **UI:** Tailwind CSS + shadcn/ui
- **Email:** Resend (order notifications to orders@rydeenmobile.com)
- **Testing:** Vitest + React Testing Library
- **Deployment:** TBD (Railway is a candidate)

## Commands

```bash
npm run dev        # Start dev server (Turbopack)
npm run build      # Production build
npm run test       # Run tests (watch mode)
npm run test:run   # Run tests once
npm run lint       # ESLint
```

## Architecture

- `src/app/(auth)/` — Login, OTP verification, registration, pending-approval (public routes)
- `src/app/(portal)/` — Dashboard, catalog, cart, orders (protected routes, shared layout with header)
- `src/lib/supabase/` — Client (`client.ts`), server (`server.ts`), admin (`admin.ts`), middleware (`middleware.ts`)
- `src/lib/cart/` — Cart state via React Context + useReducer, persisted to localStorage
- `src/lib/queries/` — Server-side data fetching functions
- `src/lib/pricing.ts` — Dealer price calculation (MSRP × discount percentage)
- `src/middleware.ts` — Route protection (redirects unauthenticated users from `/portal/*` to `/login`)
- `supabase/schema.sql` — Full database schema with RLS policies
- `supabase/seed.sql` — Sample product/category data

## Business Rules

### Roles
- **Admin**: Rydeen staff. Manages dealers, orders, inventory, password resets, product catalog, pricing.
- **Rep**: Rydeen sales representative. Limited admin view.
- **Dealer**: External car dealer. Browses catalog, places orders, views order history.

### Authentication
- Dealers log in with email → 6-digit verification code sent via email (passwordless).
- Device verification required per device (email or SMS code).
- Dealers must be approved by Rydeen Admin before access is granted.
- Each device must be registered; additional devices added in dealer profile.

### Product Catalog
- Hierarchy: **Sector → Category → SKU**
- Categories include: Digital Mirrors, Blind Spot Detection, Cameras, Monitors (and more).
- Each product has: image(s), name, description, SKU, MSRP, bullet-point features, category badge (color-coded).
- Product status flags: `NEW`, `UPDATED`, `SALE`, `REDUCED`.
- Inventory is manual — managed by Rydeen Admin.

### Pricing
- 4 pricing tiers using percentage variables: MESA Dealers, New Dealers, Dealers, International Dealers.
- Dealer's login determines which pricing tier they see ("YOUR PRICE" vs crossed-out MSRP).
- Promo pricing has 4 dimensions: (A) % discounts, (B) threshold-based, (C) time-limited, (D) SKU-level.
- "Forecast Level" concept — dealer discount level displayed on dashboard; teaches dealers about quota/forecast.

### Order Flow
1. Dealer browses Product Catalog (search by name/SKU, filter by category).
2. Add items to cart with quantity (inline +/− controls on catalog cards).
3. Side cart panel shows running order with subtotal.
4. "Review & Continue" → Order Review page with editable quantities, order notes field.
5. "Place Order" → order submitted. Note: "Orders require admin review before processing."
6. Order email sent to orders@rydeenmobile.com.
7. Admin confirms inventory and processes. Dealer gets email notification if issues arise.

### Order History
- Never purged, always printable.
- Easy reorder from past orders.
- Data downloadable as CSV/PDF, never deleted.

### Dealer Dashboard
Shows 4 KPI cards:
- **Total Orders** — orders in current year
- **This Month** — dollar total for current month
- **Pending Orders** — orders open or in-process
- **Forecast Level** — dealer's discount tier

Plus a "Recent Orders" section with "Browse Catalog" CTA when empty.

### Additional Requirements
- Portal must be available 24/7.
- Portal also serves as an FAQ library with PDFs, Q&As, and downloads.
- Multiple ship-to addresses per dealer profile (dealer self-manages preferred).
- Mobile-friendly (future APP version desired).
