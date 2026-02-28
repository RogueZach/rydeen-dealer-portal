# Foundation + Catalog + Cart Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a working Rydeen Dealer Portal where dealers can log in via email OTP, browse a product catalog with dealer-specific pricing, add items to a cart, and submit orders that are emailed to the Rydeen team.

**Architecture:** Next.js 15 App Router with Supabase for auth (email OTP), PostgreSQL database, and Row Level Security. Two route groups: `(auth)` for login/register flows and `(portal)` for the authenticated dealer experience. Cart state managed via React Context + localStorage. Order submission triggers an email to orders@rydeenmobile.com via Resend.

**Tech Stack:** Next.js 15, TypeScript, Supabase (@supabase/ssr), Tailwind CSS, shadcn/ui, Resend (email), Vitest + React Testing Library (tests)

---

## Task 1: Project Scaffolding

**Files:**
- Create: entire project via `create-next-app`
- Create: `.env.local`
- Modify: `package.json` (add deps)

**Step 1: Create Next.js project**

```bash
cd /Volumes/T9/Github/rydeen-dealer-portal
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --turbopack
```

Select defaults when prompted. This will scaffold into the existing repo.

**Step 2: Install core dependencies**

```bash
npm install @supabase/supabase-js @supabase/ssr resend
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

**Step 3: Initialize shadcn/ui**

```bash
npx shadcn@latest init
```

Select: New York style, Zinc base color, CSS variables yes.

Then install the components we need:

```bash
npx shadcn@latest add button card badge input sheet dialog separator table toast dropdown-menu avatar tabs
```

**Step 4: Create environment file**

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
RESEND_API_KEY=your_resend_api_key
ORDER_NOTIFICATION_EMAIL=orders@rydeenmobile.com
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Add `.env.local` to `.gitignore` (create-next-app should handle this, verify).

**Step 5: Create `.env.example`**

Create `.env.example` with the same keys but placeholder values so other devs know what's needed.

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
RESEND_API_KEY=re_your_resend_key
ORDER_NOTIFICATION_EMAIL=orders@rydeenmobile.com
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

**Step 6: Configure Vitest**

Create `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

Create `src/test/setup.ts`:

```typescript
import '@testing-library/jest-dom/vitest'
```

Add to `package.json` scripts:

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run"
  }
}
```

**Step 7: Verify everything works**

```bash
npm run dev
npm run test:run
```

Dev server should start on localhost:3000. Tests should run (0 tests, 0 failures).

**Step 8: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js project with Supabase, shadcn/ui, Vitest"
```

---

## Task 2: Supabase Database Schema

**Files:**
- Create: `supabase/schema.sql`
- Create: `supabase/seed.sql`
- Create: `src/types/database.ts`

**Step 1: Create the full database schema**

Create `supabase/schema.sql`:

```sql
-- ============================================================
-- Rydeen Dealer Portal Schema
-- Run this in the Supabase SQL Editor to set up all tables.
-- ============================================================

-- Pricing tiers (MESA, New Dealer, Dealer, International)
CREATE TABLE pricing_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  discount_percentage DECIMAL(5,2) NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Sectors (top-level product grouping)
CREATE TABLE sectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Categories (within sectors)
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sector_id UUID NOT NULL REFERENCES sectors(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  badge_color TEXT DEFAULT '#000000',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Products
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  sku TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  short_description TEXT,
  description TEXT,
  features JSONB DEFAULT '[]',
  msrp DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  gallery_urls JSONB DEFAULT '[]',
  status_flags TEXT[] DEFAULT '{}',
  inventory_count INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Profiles (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'dealer' CHECK (role IN ('admin', 'rep', 'dealer')),
  company_name TEXT,
  contact_name TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  pricing_tier_id UUID REFERENCES pricing_tiers(id),
  is_approved BOOLEAN DEFAULT false,
  forecast_level TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Dealer shipping addresses
CREATE TABLE dealer_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  label TEXT DEFAULT 'Main',
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip TEXT NOT NULL,
  country TEXT DEFAULT 'US',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Orders
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  dealer_id UUID NOT NULL REFERENCES profiles(id),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
  shipping_address_id UUID REFERENCES dealer_addresses(id),
  notes TEXT,
  subtotal DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Order items
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  sku TEXT NOT NULL,
  product_name TEXT NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10,2) NOT NULL,
  msrp DECIMAL(10,2) NOT NULL,
  line_total DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Auto-generate order numbers
CREATE SEQUENCE order_number_seq START 1;

CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.order_number := 'ORD-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEXTVAL('order_number_seq')::TEXT, 5, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_order_number
  BEFORE INSERT ON orders
  FOR EACH ROW
  WHEN (NEW.order_number IS NULL)
  EXECUTE FUNCTION generate_order_number();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'dealer');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

**Step 2: Create Row Level Security policies**

Append to `supabase/schema.sql`:

```sql
-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE dealer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read their own, admins can read all
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can update any profile"
  ON profiles FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Catalog tables: readable by all authenticated users
CREATE POLICY "Authenticated users can view pricing tiers"
  ON pricing_tiers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can view sectors"
  ON sectors FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can view categories"
  ON categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can view active products"
  ON products FOR SELECT TO authenticated USING (is_active = true);

-- Admins can manage catalog
CREATE POLICY "Admins can manage pricing tiers"
  ON pricing_tiers FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
CREATE POLICY "Admins can manage sectors"
  ON sectors FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
CREATE POLICY "Admins can manage categories"
  ON categories FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
CREATE POLICY "Admins can manage products"
  ON products FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Dealer addresses: own only
CREATE POLICY "Dealers can manage own addresses"
  ON dealer_addresses FOR ALL USING (dealer_id = auth.uid());
CREATE POLICY "Admins can view all addresses"
  ON dealer_addresses FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Orders: dealers see own, admins see all
CREATE POLICY "Dealers can view own orders"
  ON orders FOR SELECT USING (dealer_id = auth.uid());
CREATE POLICY "Dealers can insert own orders"
  ON orders FOR INSERT WITH CHECK (dealer_id = auth.uid());
CREATE POLICY "Admins can manage all orders"
  ON orders FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Order items: same as orders
CREATE POLICY "Dealers can view own order items"
  ON order_items FOR SELECT USING (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.dealer_id = auth.uid())
  );
CREATE POLICY "Dealers can insert own order items"
  ON order_items FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.dealer_id = auth.uid())
  );
CREATE POLICY "Admins can manage all order items"
  ON order_items FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
```

**Step 3: Create seed data**

Create `supabase/seed.sql`:

```sql
-- Pricing tiers
INSERT INTO pricing_tiers (name, display_name, discount_percentage, sort_order) VALUES
  ('mesa', 'MESA Dealers', 40.00, 1),
  ('new_dealer', 'New Dealers', 25.00, 2),
  ('dealer', 'Dealers', 35.00, 3),
  ('international', 'International Dealers', 30.00, 4);

-- Sectors
INSERT INTO sectors (name, slug, sort_order) VALUES
  ('Vehicle Electronics', 'vehicle-electronics', 1);

-- Categories
INSERT INTO categories (sector_id, name, slug, badge_color, sort_order)
SELECT s.id, c.name, c.slug, c.badge_color, c.sort_order
FROM sectors s,
(VALUES
  ('Digital Mirrors', 'digital-mirrors', '#3B82F6', 1),
  ('Blind Spot Detection', 'blind-spot-detection', '#EF4444', 2),
  ('Cameras', 'cameras', '#10B981', 3),
  ('Monitors', 'monitors', '#8B5CF6', 4)
) AS c(name, slug, badge_color, sort_order)
WHERE s.slug = 'vehicle-electronics';

-- Products (sample)
INSERT INTO products (category_id, sku, name, short_description, description, features, msrp, image_url, status_flags, inventory_count)
SELECT c.id, p.sku, p.name, p.short_desc, p.description, p.features::jsonb, p.msrp, p.image_url, p.status_flags::text[], p.inv
FROM categories c,
(VALUES
  ('digital-mirrors', '360-VIEW-K', '360 VIEW-K', '4K Dash Camera Frameless Rearview Mirror',
   '360 VIEW-K is a universal touchscreen 10-inch frameless rearview mirror with built-in dash cam/HD monitor.',
   '["4K dash camera", "10-inch frameless mirror", "Touchscreen display", "DVR with TFT screen"]',
   549.00, '/images/products/360-view-k.jpg', '{NEW}', 25),
  ('digital-mirrors', '360-VIEW-SPL', '360 VIEW-SPL', '360 Surround View Frameless Rearview Mirror with 4K Dash and Backup Cameras',
   'The 360 VIEW-SPL is a universal touchscreen 10-inch frameless rearview mirror with built-in dash cam/HD monitor with 360 surround video recording features.',
   '["360-degree video rearview replacement mirror with touchscreen", "10-inch mirror DVR with TFT screen", "Auto sensing photo sensor for TFT screen brightness control", "AHD Rear Camera"]',
   599.00, '/images/products/360-view-spl.jpg', '{}', 18),
  ('blind-spot-detection', 'BSS-ONE', 'BSS-ONE', 'Single Sensor 77-GHz Blind Spot Detection System',
   'BSS-ONE is a single sensor 77GHz blind spot detection system designed for easy installation.',
   '["77GHz radar technology", "Single sensor design", "Easy installation", "LED warning indicators"]',
   549.00, '/images/products/bss-one.jpg', '{}', 30),
  ('blind-spot-detection', 'BSS2LPB', 'BSS2LPB', 'License Plate Bar Radar Blind Spot Detection System',
   'BSS2LPB integrates blind spot detection into a license plate bar for a clean, OEM-like installation.',
   '["License plate bar design", "Radar blind spot detection", "OEM-like installation", "Dual sensors"]',
   499.00, '/images/products/bss2lpb.jpg', '{SALE}', 15),
  ('blind-spot-detection', 'BSS3', 'BSS3', 'Advanced Dual Radar Blind Spot Detection System',
   'BSS3 is an advanced dual radar blind spot detection system with enhanced coverage.',
   '["Dual radar sensors", "Advanced detection algorithm", "Wide coverage area", "Visual and audio alerts"]',
   699.00, '/images/products/bss3.jpg', '{NEW}', 12),
  ('cameras', 'CM-AHD1', 'CM-AHD1', 'Full HD AHD Vehicle Backup Camera',
   'CM-AHD1 is a full HD AHD vehicle backup camera designed for clear rearview imaging.',
   '["Full HD AHD resolution", "Wide viewing angle", "Waterproof design", "Night vision"]',
   59.00, '/images/products/cm-ahd1.jpg', '{}', 100),
  ('cameras', 'CM-AHD1000P', 'CM-AHD1000P', 'Commercial Pro Grade Digital Backup Camera',
   'CM-AHD1000P is a commercial pro grade digital backup camera for heavy-duty vehicles.',
   '["Pro grade sensor", "Commercial duty build", "Digital signal processing", "IP69K waterproof"]',
   99.00, '/images/products/cm-ahd1000p.jpg', '{}', 45),
  ('cameras', 'CM-AHD2', 'CM-AHD2', 'Full HD AHD Passenger Vehicle Camera',
   'CM-AHD2 is a full HD AHD camera designed specifically for passenger vehicles.',
   '["Full HD AHD", "Compact design", "Passenger vehicle optimized", "Easy mount"]',
   69.00, '/images/products/cm-ahd2.jpg', '{}', 80),
  ('cameras', 'CM-D700-AHD', 'CM-D700 AHD', 'Dual 1080P AHD Side Camera Kit',
   'CM-D700-AHD is a dual 1080P AHD side camera kit with wide-angle coverage.',
   '["Dual 1080P cameras", "AHD technology", "Side mount design", "Wide angle coverage"]',
   319.00, '/images/products/cm-d700-ahd.jpg', '{}', 20),
  ('cameras', 'CM-D700', 'CM-D700', 'Dual Side View Blindspot Camera Kit',
   'CM-D700 is a dual side view blindspot camera kit for enhanced visibility.',
   '["Dual side view cameras", "Blindspot coverage", "Compact design", "Universal mount"]',
   279.00, '/images/products/cm-d700.jpg', '{}', 22),
  ('cameras', 'CM-SIDE-AHD', 'CM-SIDE AHD', 'Ultra-Wide High-Resolution Safety Side Camera',
   'CM-SIDE-AHD is an ultra-wide high-resolution safety side camera.',
   '["Ultra-wide angle", "High resolution", "Safety rated", "AHD output"]',
   79.00, '/images/products/cm-side-ahd.jpg', '{UPDATED}', 60),
  ('monitors', 'PV8-A', 'PV8-A', '8.2" Ultra-Bright HD Digital Rearview Mirror Monitor',
   'PV8-A is an 8.2 inch ultra-bright HD digital rearview mirror monitor.',
   '["8.2 inch display", "Ultra-bright HD", "Digital rearview mirror", "Auto brightness"]',
   359.00, '/images/products/pv8-a.jpg', '{}', 35)
) AS p(cat_slug, sku, name, short_desc, description, features, msrp, image_url, status_flags, inv)
WHERE c.slug = p.cat_slug;
```

**Step 4: Create TypeScript types**

Create `src/types/database.ts`:

```typescript
export type Role = 'admin' | 'rep' | 'dealer'

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'

export type ProductStatusFlag = 'NEW' | 'UPDATED' | 'SALE' | 'REDUCED'

export interface PricingTier {
  id: string
  name: string
  display_name: string
  discount_percentage: number
  sort_order: number
  created_at: string
}

export interface Sector {
  id: string
  name: string
  slug: string
  sort_order: number
  created_at: string
}

export interface Category {
  id: string
  sector_id: string
  name: string
  slug: string
  badge_color: string
  sort_order: number
  created_at: string
}

export interface Product {
  id: string
  category_id: string
  sku: string
  name: string
  short_description: string | null
  description: string | null
  features: string[]
  msrp: number
  image_url: string | null
  gallery_urls: string[]
  status_flags: ProductStatusFlag[]
  inventory_count: number
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
  // Joined
  category?: Category
}

export interface Profile {
  id: string
  role: Role
  company_name: string | null
  contact_name: string | null
  email: string
  phone: string | null
  pricing_tier_id: string | null
  is_approved: boolean
  forecast_level: string | null
  created_at: string
  updated_at: string
  // Joined
  pricing_tier?: PricingTier
}

export interface DealerAddress {
  id: string
  dealer_id: string
  label: string
  address_line1: string
  address_line2: string | null
  city: string
  state: string
  zip: string
  country: string
  is_default: boolean
  created_at: string
}

export interface Order {
  id: string
  order_number: string
  dealer_id: string
  status: OrderStatus
  shipping_address_id: string | null
  notes: string | null
  subtotal: number
  total: number
  created_at: string
  updated_at: string
  // Joined
  items?: OrderItem[]
  dealer?: Profile
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  sku: string
  product_name: string
  quantity: number
  unit_price: number
  msrp: number
  line_total: number
  created_at: string
}
```

**Step 5: Run schema in Supabase**

Go to your Supabase project dashboard > SQL Editor. Run `schema.sql` then `seed.sql`.

**Step 6: Commit**

```bash
git add supabase/ src/types/database.ts
git commit -m "feat: add database schema, RLS policies, seed data, and TypeScript types"
```

---

## Task 3: Supabase Client Setup

**Files:**
- Create: `src/lib/supabase/client.ts`
- Create: `src/lib/supabase/server.ts`
- Create: `src/lib/supabase/admin.ts`
- Create: `src/lib/supabase/middleware.ts`

**Step 1: Create browser client**

Create `src/lib/supabase/client.ts`:

```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**Step 2: Create server client**

Create `src/lib/supabase/server.ts`:

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createSSRClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // Ignored in Server Component context (read-only)
          }
        },
      },
    }
  )
}
```

**Step 3: Create admin client**

Create `src/lib/supabase/admin.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  )
}
```

**Step 4: Create middleware helper**

Create `src/lib/supabase/middleware.ts`:

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Protect /portal routes — redirect to login if not authenticated
  if (!user && request.nextUrl.pathname.startsWith('/portal')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users away from auth pages
  if (user && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/register')) {
    const url = request.nextUrl.clone()
    url.pathname = '/portal/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
```

**Step 5: Create Next.js middleware**

Create `src/middleware.ts`:

```typescript
import { updateSession } from '@/lib/supabase/middleware'
import { type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|images|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

**Step 6: Verify dev server still runs**

```bash
npm run dev
```

**Step 7: Commit**

```bash
git add src/lib/supabase/ src/middleware.ts
git commit -m "feat: add Supabase client, server, admin, and middleware helpers"
```

---

## Task 4: Auth — Login + OTP Verification

**Files:**
- Create: `src/app/(auth)/layout.tsx`
- Create: `src/app/(auth)/login/page.tsx`
- Create: `src/app/(auth)/login/actions.ts`
- Create: `src/app/(auth)/verify/page.tsx`
- Create: `src/app/(auth)/verify/actions.ts`
- Create: `src/app/(auth)/register/page.tsx`
- Create: `src/app/(auth)/register/actions.ts`
- Create: `src/app/(auth)/pending-approval/page.tsx`

**Step 1: Create auth layout**

Create `src/app/(auth)/layout.tsx`:

```tsx
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight">RYDEEN</h1>
        <p className="text-sm text-muted-foreground">next level awareness</p>
        <p className="mt-2 text-lg font-medium">Rydeen Mobile</p>
        <p className="text-sm text-muted-foreground">Dealer Portal</p>
      </div>
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  )
}
```

**Step 2: Create login page**

Create `src/app/(auth)/login/page.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { sendOtp } from './actions'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const result = await sendOtp(email)

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    router.push(`/verify?email=${encodeURIComponent(email)}`)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Account Sign-in</CardTitle>
        <CardDescription>We&apos;ll send a verification code to your email</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="text-sm font-medium">Email address</label>
            <Input
              id="email"
              type="email"
              placeholder="you@dealership.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" className="w-full bg-black text-white hover:bg-gray-800" disabled={loading}>
            {loading ? 'Sending code...' : 'Continue with Email'}
          </Button>
        </form>
        <div className="mt-4 text-center text-sm">
          <Link href="#" className="text-muted-foreground hover:underline">Having trouble signing in?</Link>
          <p className="mt-2">
            Not a dealer yet? <Link href="/register" className="font-medium underline">Apply for an account</Link>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
```

**Step 3: Create login server action**

Create `src/app/(auth)/login/actions.ts`:

```typescript
'use server'

import { createSSRClient } from '@/lib/supabase/server'

export async function sendOtp(email: string) {
  const supabase = await createSSRClient()

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
    },
  })

  if (error) {
    if (error.message.includes('Signups not allowed')) {
      return { error: 'No account found with this email. Please apply for an account first.' }
    }
    return { error: error.message }
  }

  return { error: null }
}
```

**Step 4: Create verify page**

Create `src/app/(auth)/verify/page.tsx`:

```tsx
'use client'

import { useState, useRef, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { verifyOtp, resendOtp } from './actions'
import Link from 'next/link'

function VerifyForm() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const router = useRouter()

  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  function handleChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return
    const newCode = [...code]
    newCode[index] = value.slice(-1)
    setCode(newCode)
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const token = code.join('')
    if (token.length !== 6) return

    setError(null)
    setLoading(true)

    const result = await verifyOtp(email, token)

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    if (result.pendingApproval) {
      router.push('/pending-approval')
      return
    }

    router.push('/portal/dashboard')
  }

  async function handleResend() {
    setError(null)
    const result = await resendOtp(email)
    if (result.error) setError(result.error)
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle>Check your email</CardTitle>
        <CardDescription>
          We sent a 6-digit code to {email}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Enter verification code</label>
            <p className="text-xs text-muted-foreground mb-2">The code expires in 10 minutes</p>
            <div className="flex gap-2 justify-center">
              {code.map((digit, i) => (
                <Input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className="w-12 h-12 text-center text-lg"
                />
              ))}
            </div>
          </div>
          {error && <p className="text-sm text-red-600 text-center">{error}</p>}
          <Button type="submit" className="w-full bg-black text-white hover:bg-gray-800" disabled={loading}>
            {loading ? 'Verifying...' : 'Verify Code'}
          </Button>
        </form>
        <div className="mt-4 text-center text-sm space-y-2">
          <button onClick={handleResend} className="text-muted-foreground hover:underline">
            Didn&apos;t receive it? Resend code
          </button>
          <p>
            <Link href="/login" className="text-muted-foreground hover:underline">&larr; Back to sign in</Link>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyForm />
    </Suspense>
  )
}
```

**Step 5: Create verify server actions**

Create `src/app/(auth)/verify/actions.ts`:

```typescript
'use server'

import { createSSRClient } from '@/lib/supabase/server'

export async function verifyOtp(email: string, token: string) {
  const supabase = await createSSRClient()

  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'email',
  })

  if (error) {
    return { error: error.message, pendingApproval: false }
  }

  // Check if dealer is approved
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_approved, role')
    .eq('id', data.user!.id)
    .single()

  if (profile && profile.role === 'dealer' && !profile.is_approved) {
    return { error: null, pendingApproval: true }
  }

  return { error: null, pendingApproval: false }
}

export async function resendOtp(email: string) {
  const supabase = await createSSRClient()

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
    },
  })

  if (error) return { error: error.message }
  return { error: null }
}
```

**Step 6: Create registration page**

Create `src/app/(auth)/register/page.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { registerDealer } from './actions'
import Link from 'next/link'

export default function RegisterPage() {
  const [form, setForm] = useState({ email: '', companyName: '', contactName: '', phone: '' })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const result = await registerDealer(form)

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    setSuccess(true)
  }

  if (success) {
    return (
      <Card>
        <CardHeader className="text-center">
          <CardTitle>Application Submitted</CardTitle>
          <CardDescription>
            Your dealer application has been submitted. A Rydeen administrator will review and approve your account.
            You&apos;ll receive an email once approved.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Link href="/login">
            <Button variant="outline">&larr; Back to sign in</Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Apply for an Account</CardTitle>
        <CardDescription>Submit your dealer application for Rydeen approval</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="companyName" className="text-sm font-medium">Company Name</label>
            <Input id="companyName" value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} required />
          </div>
          <div>
            <label htmlFor="contactName" className="text-sm font-medium">Contact Name</label>
            <Input id="contactName" value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} required />
          </div>
          <div>
            <label htmlFor="email" className="text-sm font-medium">Email Address</label>
            <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div>
            <label htmlFor="phone" className="text-sm font-medium">Phone Number</label>
            <Input id="phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" className="w-full bg-black text-white hover:bg-gray-800" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Application'}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm">
          Already have an account? <Link href="/login" className="font-medium underline">Sign in</Link>
        </p>
      </CardContent>
    </Card>
  )
}
```

**Step 7: Create register server action**

Create `src/app/(auth)/register/actions.ts`:

```typescript
'use server'

import { createAdminClient } from '@/lib/supabase/admin'

export async function registerDealer(form: {
  email: string
  companyName: string
  contactName: string
  phone: string
}) {
  const supabase = createAdminClient()

  // Create user via admin API (bypasses "signups not allowed" restriction)
  const { data: user, error: createError } = await supabase.auth.admin.createUser({
    email: form.email,
    email_confirm: true, // Skip email confirmation for admin-created users
  })

  if (createError) {
    if (createError.message.includes('already been registered')) {
      return { error: 'An account with this email already exists. Please sign in instead.' }
    }
    return { error: createError.message }
  }

  // Update the profile with dealer details (trigger already created the profile row)
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      company_name: form.companyName,
      contact_name: form.contactName,
      phone: form.phone,
      is_approved: false,
    })
    .eq('id', user.user.id)

  if (profileError) {
    return { error: profileError.message }
  }

  return { error: null }
}
```

**Step 8: Create pending-approval page**

Create `src/app/(auth)/pending-approval/page.tsx`:

```tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function PendingApprovalPage() {
  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle>Account Pending Approval</CardTitle>
        <CardDescription>
          Your dealer account is awaiting approval from Rydeen. You&apos;ll receive an email notification once your account has been activated.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <p className="text-sm text-muted-foreground mb-4">
          If you have questions, contact us at 1-310-787-7880.
        </p>
        <Link href="/login">
          <Button variant="outline">&larr; Back to sign in</Button>
        </Link>
      </CardContent>
    </Card>
  )
}
```

**Step 9: Update root page to redirect**

Replace `src/app/page.tsx`:

```tsx
import { redirect } from 'next/navigation'

export default function Home() {
  redirect('/login')
}
```

**Step 10: Configure Supabase Auth**

In Supabase Dashboard > Authentication > Providers > Email:
- Enable Email provider
- Disable "Confirm email" (we handle confirmation via OTP)
- Enable "Secure email change" option
- Set OTP expiry to 600 seconds (10 minutes)

In Authentication > URL Configuration:
- Set Site URL to your app URL
- Add redirect URLs for local dev: `http://localhost:3000/**`

**Step 11: Verify the auth flow works**

```bash
npm run dev
```

Visit http://localhost:3000 — should redirect to /login. Enter an email, receive OTP, enter code.

**Step 12: Commit**

```bash
git add src/app/ src/middleware.ts
git commit -m "feat: add email OTP auth flow with login, verification, registration, and approval gate"
```

---

## Task 5: Portal Layout + Navigation

**Files:**
- Create: `src/app/(portal)/layout.tsx`
- Create: `src/components/layout/portal-header.tsx`
- Create: `src/lib/auth.ts`

**Step 1: Create auth helper**

Create `src/lib/auth.ts`:

```typescript
import { createSSRClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Profile } from '@/types/database'

export async function getAuthenticatedProfile(): Promise<Profile> {
  const supabase = await createSSRClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, pricing_tier:pricing_tiers(*)')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')
  if (profile.role === 'dealer' && !profile.is_approved) redirect('/pending-approval')

  return profile as Profile
}
```

**Step 2: Create portal header**

Create `src/components/layout/portal-header.tsx`:

```tsx
'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types/database'

export function PortalHeader({ profile, cartItemCount }: { profile: Profile; cartItemCount: number }) {
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="border-b bg-white">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/portal/dashboard" className="text-xl font-bold tracking-tight">
            RYDEEN
          </Link>
          <nav className="hidden md:flex items-center gap-4 text-sm">
            <Link href="/portal/dashboard" className="text-muted-foreground hover:text-foreground">
              Dashboard
            </Link>
            <Link href="/portal/catalog" className="text-muted-foreground hover:text-foreground">
              Catalog
            </Link>
            <Link href="/portal/orders" className="text-muted-foreground hover:text-foreground">
              Orders
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/portal/cart" className="relative">
            <Button variant="outline" size="sm">
              Cart
              {cartItemCount > 0 && (
                <span className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-black text-xs text-white">
                  {cartItemCount}
                </span>
              )}
            </Button>
          </Link>
          <span className="text-sm text-muted-foreground hidden md:inline">
            {profile.company_name || profile.email}
          </span>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            Sign out
          </Button>
        </div>
      </div>
    </header>
  )
}
```

**Step 3: Create portal layout**

Create `src/app/(portal)/layout.tsx`:

```tsx
import { getAuthenticatedProfile } from '@/lib/auth'
import { PortalHeader } from '@/components/layout/portal-header'
import { CartProvider } from '@/lib/cart/context'

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const profile = await getAuthenticatedProfile()

  return (
    <CartProvider>
      <div className="min-h-screen bg-gray-50">
        <PortalHeader profile={profile} cartItemCount={0} />
        <main className="container mx-auto px-4 py-6">
          {children}
        </main>
      </div>
    </CartProvider>
  )
}
```

Note: `CartProvider` will be created in Task 8. For now, create a placeholder:

Create `src/lib/cart/context.tsx`:

```tsx
'use client'

import { createContext, useContext, ReactNode } from 'react'

const CartContext = createContext<{ items: never[] }>({ items: [] })

export function CartProvider({ children }: { children: ReactNode }) {
  return <CartContext.Provider value={{ items: [] }}>{children}</CartContext.Provider>
}

export function useCart() {
  return useContext(CartContext)
}
```

**Step 4: Verify layout works**

```bash
npm run dev
```

Log in and confirm header renders with navigation links.

**Step 5: Commit**

```bash
git add src/app/\(portal\)/ src/components/layout/ src/lib/auth.ts src/lib/cart/
git commit -m "feat: add portal layout with header navigation and auth guard"
```

---

## Task 6: Dealer Dashboard

**Files:**
- Create: `src/app/(portal)/dashboard/page.tsx`
- Create: `src/components/dashboard/kpi-cards.tsx`
- Create: `src/components/dashboard/recent-orders.tsx`
- Create: `src/lib/queries/dashboard.ts`

**Step 1: Create dashboard queries**

Create `src/lib/queries/dashboard.ts`:

```typescript
import { createSSRClient } from '@/lib/supabase/server'

export async function getDashboardData(dealerId: string) {
  const supabase = await createSSRClient()
  const now = new Date()
  const yearStart = new Date(now.getFullYear(), 0, 1).toISOString()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const [ordersThisYear, monthTotal, pendingOrders, recentOrders] = await Promise.all([
    // Total orders this year
    supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('dealer_id', dealerId)
      .gte('created_at', yearStart),

    // Total dollars this month
    supabase
      .from('orders')
      .select('total')
      .eq('dealer_id', dealerId)
      .gte('created_at', monthStart),

    // Pending orders
    supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('dealer_id', dealerId)
      .in('status', ['pending', 'confirmed', 'processing']),

    // Recent orders (last 5)
    supabase
      .from('orders')
      .select('*')
      .eq('dealer_id', dealerId)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const thisMonthTotal = (monthTotal.data || []).reduce((sum, o) => sum + Number(o.total), 0)

  return {
    totalOrders: ordersThisYear.count || 0,
    thisMonth: thisMonthTotal,
    pendingOrders: pendingOrders.count || 0,
    recentOrders: recentOrders.data || [],
  }
}
```

**Step 2: Create KPI cards component**

Create `src/components/dashboard/kpi-cards.tsx`:

```tsx
import { Card, CardContent } from '@/components/ui/card'

interface KpiCardsProps {
  totalOrders: number
  thisMonth: number
  pendingOrders: number
  forecastLevel: string | null
}

export function KpiCards({ totalOrders, thisMonth, pendingOrders, forecastLevel }: KpiCardsProps) {
  const cards = [
    { label: 'Total Orders', value: totalOrders.toString(), color: 'bg-blue-50 text-blue-600' },
    { label: 'This Month', value: `$${thisMonth.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, color: 'bg-green-50 text-green-600' },
    { label: 'Pending Orders', value: pendingOrders.toString(), color: 'bg-yellow-50 text-yellow-600' },
    { label: 'Forecast Level', value: forecastLevel || '—', color: 'bg-purple-50 text-purple-600' },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold">{card.value}</p>
            <p className="text-sm text-muted-foreground">{card.label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
```

**Step 3: Create recent orders component**

Create `src/components/dashboard/recent-orders.tsx`:

```tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import type { Order } from '@/types/database'

export function RecentOrders({ orders }: { orders: Order[] }) {
  if (orders.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Recent Orders</CardTitle>
          <Link href="/portal/orders" className="text-sm text-muted-foreground hover:underline">
            View all &rarr;
          </Link>
        </CardHeader>
        <CardContent className="flex flex-col items-center py-12">
          <p className="text-lg font-medium">No orders yet</p>
          <p className="text-sm text-muted-foreground mb-4">Start by browsing our product catalog</p>
          <Link href="/portal/catalog">
            <Button className="bg-black text-white hover:bg-gray-800">Browse Catalog</Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Recent Orders</CardTitle>
        <Link href="/portal/orders" className="text-sm text-muted-foreground hover:underline">
          View all &rarr;
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {orders.map((order) => (
            <div key={order.id} className="flex items-center justify-between border-b pb-3 last:border-0">
              <div>
                <p className="font-medium">{order.order_number}</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(order.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium">${Number(order.total).toFixed(2)}</p>
                <p className="text-xs capitalize text-muted-foreground">{order.status}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
```

**Step 4: Create dashboard page**

Create `src/app/(portal)/dashboard/page.tsx`:

```tsx
import { getAuthenticatedProfile } from '@/lib/auth'
import { getDashboardData } from '@/lib/queries/dashboard'
import { KpiCards } from '@/components/dashboard/kpi-cards'
import { RecentOrders } from '@/components/dashboard/recent-orders'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function DashboardPage() {
  const profile = await getAuthenticatedProfile()
  const data = await getDashboardData(profile.id)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Welcome back, {profile.contact_name || 'Rydeen Dealer'}</h1>
          <p className="text-muted-foreground">Here&apos;s what&apos;s happening with your account</p>
        </div>
        <Link href="/portal/catalog">
          <Button className="bg-black text-white hover:bg-gray-800">Shop Now</Button>
        </Link>
      </div>

      <KpiCards
        totalOrders={data.totalOrders}
        thisMonth={data.thisMonth}
        pendingOrders={data.pendingOrders}
        forecastLevel={profile.forecast_level}
      />

      <RecentOrders orders={data.recentOrders} />
    </div>
  )
}
```

**Step 5: Verify dashboard renders**

```bash
npm run dev
```

Log in and navigate to /portal/dashboard. Should show KPI cards and empty recent orders with "Browse Catalog" CTA.

**Step 6: Commit**

```bash
git add src/app/\(portal\)/dashboard/ src/components/dashboard/ src/lib/queries/
git commit -m "feat: add dealer dashboard with KPI cards and recent orders"
```

---

## Task 7: Product Catalog

**Files:**
- Create: `src/app/(portal)/catalog/page.tsx`
- Create: `src/components/catalog/category-filter.tsx`
- Create: `src/components/catalog/product-card.tsx`
- Create: `src/components/catalog/search-bar.tsx`
- Create: `src/lib/queries/catalog.ts`
- Create: `src/lib/pricing.ts`
- Test: `src/lib/__tests__/pricing.test.ts`

**Step 1: Write pricing calculation test**

Create `src/lib/__tests__/pricing.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { calculateDealerPrice } from '../pricing'

describe('calculateDealerPrice', () => {
  it('applies percentage discount to MSRP', () => {
    expect(calculateDealerPrice(100, 40)).toBe(60)
  })

  it('rounds to 2 decimal places', () => {
    expect(calculateDealerPrice(99.99, 33.33)).toBe(66.66)
  })

  it('returns MSRP when discount is 0', () => {
    expect(calculateDealerPrice(549, 0)).toBe(549)
  })

  it('returns 0 when discount is 100', () => {
    expect(calculateDealerPrice(549, 100)).toBe(0)
  })
})
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run src/lib/__tests__/pricing.test.ts
```

Expected: FAIL — `calculateDealerPrice` is not defined.

**Step 3: Implement pricing calculation**

Create `src/lib/pricing.ts`:

```typescript
export function calculateDealerPrice(msrp: number, discountPercentage: number): number {
  const price = msrp * (1 - discountPercentage / 100)
  return Math.round(price * 100) / 100
}
```

**Step 4: Run test to verify it passes**

```bash
npx vitest run src/lib/__tests__/pricing.test.ts
```

Expected: 4 tests PASS.

**Step 5: Create catalog queries**

Create `src/lib/queries/catalog.ts`:

```typescript
import { createSSRClient } from '@/lib/supabase/server'

export async function getCategories() {
  const supabase = await createSSRClient()
  const { data } = await supabase
    .from('categories')
    .select('*, sector:sectors(*)')
    .order('sort_order')
  return data || []
}

export async function getProducts(options?: {
  categorySlug?: string
  search?: string
}) {
  const supabase = await createSSRClient()

  let query = supabase
    .from('products')
    .select('*, category:categories(*)')
    .eq('is_active', true)
    .order('sort_order')

  if (options?.categorySlug) {
    // Join through category to filter by slug
    query = query.eq('category.slug', options.categorySlug)
  }

  if (options?.search) {
    query = query.or(`name.ilike.%${options.search}%,sku.ilike.%${options.search}%`)
  }

  const { data } = await query
  // Filter out products where category join returned null (when filtering by slug)
  return (data || []).filter(p => p.category !== null)
}
```

**Step 6: Create category filter component**

Create `src/components/catalog/category-filter.tsx`:

```tsx
'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import type { Category } from '@/types/database'

export function CategoryFilter({ categories, activeSlug }: { categories: Category[]; activeSlug?: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function selectCategory(slug?: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (slug) {
      params.set('category', slug)
    } else {
      params.delete('category')
    }
    router.push(`/portal/catalog?${params.toString()}`)
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Badge
        variant={!activeSlug ? 'default' : 'outline'}
        className="cursor-pointer"
        onClick={() => selectCategory()}
      >
        ALL
      </Badge>
      {categories.map((cat) => (
        <Badge
          key={cat.id}
          variant={activeSlug === cat.slug ? 'default' : 'outline'}
          className="cursor-pointer"
          style={activeSlug === cat.slug ? { backgroundColor: cat.badge_color } : {}}
          onClick={() => selectCategory(cat.slug)}
        >
          {cat.name}
        </Badge>
      ))}
    </div>
  )
}
```

**Step 7: Create search bar component**

Create `src/components/catalog/search-bar.tsx`:

```tsx
'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'

export function SearchBar() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(searchParams.get('search') || '')

  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (search) {
        params.set('search', search)
      } else {
        params.delete('search')
      }
      router.push(`/portal/catalog?${params.toString()}`)
    }, 300)

    return () => clearTimeout(timer)
  }, [search]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Input
      type="search"
      placeholder="Search by name or SKU..."
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      className="max-w-sm"
    />
  )
}
```

**Step 8: Create product card component**

Create `src/components/catalog/product-card.tsx`:

```tsx
'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useCart } from '@/lib/cart/context'
import type { Product, Category } from '@/types/database'

interface ProductCardProps {
  product: Product & { category: Category }
  dealerPrice: number
}

export function ProductCard({ product, dealerPrice }: ProductCardProps) {
  const { addItem, getItemQuantity, updateQuantity } = useCart()
  const quantity = getItemQuantity(product.id)

  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-square bg-gray-100">
        {product.category && (
          <Badge
            className="absolute top-2 left-2 z-10"
            style={{ backgroundColor: product.category.badge_color, color: '#fff' }}
          >
            {product.category.name}
          </Badge>
        )}
        <Link href={`/portal/catalog/${product.sku}`} className="absolute top-2 right-2 z-10">
          <Badge variant="secondary">Details</Badge>
        </Link>
        {product.status_flags.length > 0 && (
          <div className="absolute top-2 right-16 z-10 flex gap-1">
            {product.status_flags.map((flag) => (
              <Badge key={flag} variant="destructive" className="text-xs">{flag}</Badge>
            ))}
          </div>
        )}
        {product.image_url ? (
          <Image src={product.image_url} alt={product.name} fill className="object-contain p-4" />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">No image</div>
        )}
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold text-sm line-clamp-2">{product.name}</h3>
        <p className="text-xs text-muted-foreground">{product.sku}</p>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-sm text-muted-foreground">YOUR PRICE</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold">${dealerPrice.toFixed(2)}</span>
          <span className="text-sm text-muted-foreground">MSRP</span>
          <span className="text-sm text-muted-foreground line-through">${Number(product.msrp).toFixed(2)}</span>
        </div>
        <div className="mt-3">
          {quantity === 0 ? (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => addItem({
                productId: product.id,
                sku: product.sku,
                name: product.name,
                imageUrl: product.image_url,
                unitPrice: dealerPrice,
                msrp: Number(product.msrp),
                quantity: 1,
              })}
            >
              + Add to Order
            </Button>
          ) : (
            <div className="flex items-center justify-center gap-3">
              <Button variant="outline" size="sm" onClick={() => updateQuantity(product.id, quantity - 1)}>
                &minus;
              </Button>
              <span className="font-medium w-8 text-center">{quantity}</span>
              <Button variant="outline" size="sm" onClick={() => updateQuantity(product.id, quantity + 1)}>
                +
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
```

**Step 9: Create catalog page**

Create `src/app/(portal)/catalog/page.tsx`:

```tsx
import { Suspense } from 'react'
import { getAuthenticatedProfile } from '@/lib/auth'
import { getCategories, getProducts } from '@/lib/queries/catalog'
import { calculateDealerPrice } from '@/lib/pricing'
import { CategoryFilter } from '@/components/catalog/category-filter'
import { SearchBar } from '@/components/catalog/search-bar'
import { ProductCard } from '@/components/catalog/product-card'

interface CatalogPageProps {
  searchParams: Promise<{ category?: string; search?: string }>
}

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const params = await searchParams
  const profile = await getAuthenticatedProfile()

  const [categories, products] = await Promise.all([
    getCategories(),
    getProducts({
      categorySlug: params.category,
      search: params.search,
    }),
  ])

  const discountPercentage = profile.pricing_tier?.discount_percentage ?? 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Product Catalog</h1>
          <p className="text-muted-foreground">Browse and order Rydeen products</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <Suspense>
          <SearchBar />
        </Suspense>
        <Suspense>
          <CategoryFilter categories={categories} activeSlug={params.category} />
        </Suspense>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            dealerPrice={calculateDealerPrice(Number(product.msrp), discountPercentage)}
          />
        ))}
      </div>

      {products.length === 0 && (
        <p className="text-center text-muted-foreground py-12">No products found.</p>
      )}
    </div>
  )
}
```

**Step 10: Verify catalog renders with seed data**

```bash
npm run dev
```

Navigate to /portal/catalog. Should show product grid with category filters and search.

**Step 11: Commit**

```bash
git add src/app/\(portal\)/catalog/ src/components/catalog/ src/lib/queries/catalog.ts src/lib/pricing.ts src/lib/__tests__/
git commit -m "feat: add product catalog with category filters, search, and dealer pricing"
```

---

## Task 8: Product Detail Page

**Files:**
- Create: `src/app/(portal)/catalog/[sku]/page.tsx`
- Create: `src/lib/queries/product.ts`
- Create: `src/components/catalog/product-detail.tsx`

**Step 1: Create product query**

Create `src/lib/queries/product.ts`:

```typescript
import { createSSRClient } from '@/lib/supabase/server'

export async function getProductBySku(sku: string) {
  const supabase = await createSSRClient()

  const { data } = await supabase
    .from('products')
    .select('*, category:categories(*, sector:sectors(*))')
    .eq('sku', sku)
    .eq('is_active', true)
    .single()

  return data
}
```

**Step 2: Create product detail client component**

Create `src/components/catalog/product-detail.tsx`:

```tsx
'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useCart } from '@/lib/cart/context'
import type { Product } from '@/types/database'

interface ProductDetailProps {
  product: Product
  dealerPrice: number
}

export function ProductDetail({ product, dealerPrice }: ProductDetailProps) {
  const { addItem, getItemQuantity, updateQuantity } = useCart()
  const quantity = getItemQuantity(product.id)

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <div className="relative aspect-square bg-gray-100 rounded-lg">
        {product.image_url ? (
          <Image src={product.image_url} alt={product.name} fill className="object-contain p-8" />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">No image</div>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold">{product.name}</h1>
          <p className="text-muted-foreground">{product.short_description}</p>
        </div>

        <div>
          <span className="text-3xl font-bold text-green-700">${dealerPrice.toFixed(2)}</span>
          <span className="ml-2 text-sm text-muted-foreground">(based on FORECAST LVL.)</span>
        </div>

        {product.status_flags.length > 0 && (
          <div className="flex gap-2">
            {product.status_flags.map((flag) => (
              <Badge key={flag} variant="destructive">{flag}</Badge>
            ))}
          </div>
        )}

        <ul className="list-disc list-inside space-y-1">
          {(product.features as string[]).map((feature, i) => (
            <li key={i} className="text-sm">{feature}</li>
          ))}
        </ul>

        <hr />

        <div className="flex items-center gap-4">
          <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
        </div>

        <p className="text-sm font-medium">Need help? 1-310-787-7880</p>

        <hr />

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateQuantity(product.id, Math.max(0, quantity - 1))}
              disabled={quantity === 0}
            >
              &minus;
            </Button>
            <span className="font-medium w-8 text-center">{quantity || 1}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => quantity === 0
                ? addItem({
                    productId: product.id,
                    sku: product.sku,
                    name: product.name,
                    imageUrl: product.image_url,
                    unitPrice: dealerPrice,
                    msrp: Number(product.msrp),
                    quantity: 1,
                  })
                : updateQuantity(product.id, quantity + 1)
              }
            >
              +
            </Button>
          </div>
          <Button
            className="flex-1 bg-black text-white hover:bg-gray-800"
            onClick={() => {
              if (quantity === 0) {
                addItem({
                  productId: product.id,
                  sku: product.sku,
                  name: product.name,
                  imageUrl: product.image_url,
                  unitPrice: dealerPrice,
                  msrp: Number(product.msrp),
                  quantity: 1,
                })
              }
            }}
          >
            + Add to Order
          </Button>
        </div>

        <div className="flex gap-4 text-sm">
          <Link href="/portal/catalog" className="text-muted-foreground hover:underline">
            Back to Browse
          </Link>
        </div>
      </div>

      {product.description && (
        <div className="md:col-span-2">
          <h2 className="text-lg font-semibold mb-2">Product Details</h2>
          <p className="text-sm text-muted-foreground whitespace-pre-line">{product.description}</p>
        </div>
      )}
    </div>
  )
}
```

**Step 3: Create product detail page**

Create `src/app/(portal)/catalog/[sku]/page.tsx`:

```tsx
import { notFound } from 'next/navigation'
import { getAuthenticatedProfile } from '@/lib/auth'
import { getProductBySku } from '@/lib/queries/product'
import { calculateDealerPrice } from '@/lib/pricing'
import { ProductDetail } from '@/components/catalog/product-detail'

interface ProductPageProps {
  params: Promise<{ sku: string }>
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { sku } = await params
  const profile = await getAuthenticatedProfile()
  const product = await getProductBySku(sku)

  if (!product) notFound()

  const discountPercentage = profile.pricing_tier?.discount_percentage ?? 0
  const dealerPrice = calculateDealerPrice(Number(product.msrp), discountPercentage)

  return (
    <div className="max-w-5xl mx-auto">
      <ProductDetail product={product} dealerPrice={dealerPrice} />
    </div>
  )
}
```

**Step 4: Verify product detail page**

```bash
npm run dev
```

Click "Details" on any product card. Should navigate to `/portal/catalog/360-VIEW-K` (etc.) and show full product detail.

**Step 5: Commit**

```bash
git add src/app/\(portal\)/catalog/\[sku\]/ src/components/catalog/product-detail.tsx src/lib/queries/product.ts
git commit -m "feat: add product detail page with dealer pricing and add-to-cart"
```

---

## Task 9: Cart State Management

**Files:**
- Modify: `src/lib/cart/context.tsx`
- Create: `src/lib/cart/types.ts`
- Test: `src/lib/cart/__tests__/cart.test.ts`

**Step 1: Define cart types**

Create `src/lib/cart/types.ts`:

```typescript
export interface CartItem {
  productId: string
  sku: string
  name: string
  imageUrl: string | null
  unitPrice: number
  msrp: number
  quantity: number
}

export interface CartState {
  items: CartItem[]
}

export interface CartActions {
  addItem: (item: CartItem) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  getItemQuantity: (productId: string) => number
  getSubtotal: () => number
  getItemCount: () => number
}

export type CartContextValue = CartState & CartActions
```

**Step 2: Write cart logic tests**

Create `src/lib/cart/__tests__/cart.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { cartReducer, type CartAction } from '../reducer'
import type { CartItem } from '../types'

const mockItem: CartItem = {
  productId: 'p1',
  sku: 'TEST-1',
  name: 'Test Product',
  imageUrl: null,
  unitPrice: 100,
  msrp: 150,
  quantity: 1,
}

describe('cartReducer', () => {
  it('adds an item to empty cart', () => {
    const state = cartReducer({ items: [] }, { type: 'ADD_ITEM', item: mockItem })
    expect(state.items).toHaveLength(1)
    expect(state.items[0].quantity).toBe(1)
  })

  it('increments quantity when adding existing item', () => {
    const state = cartReducer(
      { items: [mockItem] },
      { type: 'ADD_ITEM', item: { ...mockItem, quantity: 2 } }
    )
    expect(state.items).toHaveLength(1)
    expect(state.items[0].quantity).toBe(3)
  })

  it('updates quantity of an item', () => {
    const state = cartReducer(
      { items: [mockItem] },
      { type: 'UPDATE_QUANTITY', productId: 'p1', quantity: 5 }
    )
    expect(state.items[0].quantity).toBe(5)
  })

  it('removes item when quantity set to 0', () => {
    const state = cartReducer(
      { items: [mockItem] },
      { type: 'UPDATE_QUANTITY', productId: 'p1', quantity: 0 }
    )
    expect(state.items).toHaveLength(0)
  })

  it('removes a specific item', () => {
    const state = cartReducer(
      { items: [mockItem, { ...mockItem, productId: 'p2', sku: 'TEST-2' }] },
      { type: 'REMOVE_ITEM', productId: 'p1' }
    )
    expect(state.items).toHaveLength(1)
    expect(state.items[0].productId).toBe('p2')
  })

  it('clears all items', () => {
    const state = cartReducer(
      { items: [mockItem] },
      { type: 'CLEAR_CART' }
    )
    expect(state.items).toHaveLength(0)
  })
})
```

**Step 3: Run test to verify it fails**

```bash
npx vitest run src/lib/cart/__tests__/cart.test.ts
```

Expected: FAIL — `cartReducer` not found.

**Step 4: Implement cart reducer**

Create `src/lib/cart/reducer.ts`:

```typescript
import type { CartState, CartItem } from './types'

export type CartAction =
  | { type: 'ADD_ITEM'; item: CartItem }
  | { type: 'REMOVE_ITEM'; productId: string }
  | { type: 'UPDATE_QUANTITY'; productId: string; quantity: number }
  | { type: 'CLEAR_CART' }
  | { type: 'LOAD_CART'; items: CartItem[] }

export function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existing = state.items.find((i) => i.productId === action.item.productId)
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.productId === action.item.productId
              ? { ...i, quantity: i.quantity + action.item.quantity }
              : i
          ),
        }
      }
      return { items: [...state.items, action.item] }
    }

    case 'REMOVE_ITEM':
      return { items: state.items.filter((i) => i.productId !== action.productId) }

    case 'UPDATE_QUANTITY': {
      if (action.quantity <= 0) {
        return { items: state.items.filter((i) => i.productId !== action.productId) }
      }
      return {
        items: state.items.map((i) =>
          i.productId === action.productId ? { ...i, quantity: action.quantity } : i
        ),
      }
    }

    case 'CLEAR_CART':
      return { items: [] }

    case 'LOAD_CART':
      return { items: action.items }

    default:
      return state
  }
}
```

**Step 5: Run tests to verify they pass**

```bash
npx vitest run src/lib/cart/__tests__/cart.test.ts
```

Expected: 6 tests PASS.

**Step 6: Update CartProvider with full implementation**

Replace `src/lib/cart/context.tsx`:

```tsx
'use client'

import { createContext, useContext, useReducer, useEffect, useCallback, type ReactNode } from 'react'
import { cartReducer } from './reducer'
import type { CartItem, CartContextValue } from './types'

const STORAGE_KEY = 'rydeen-cart'

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] })

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        dispatch({ type: 'LOAD_CART', items: JSON.parse(saved) })
      }
    } catch {
      // Ignore parse errors
    }
  }, [])

  // Persist cart to localStorage on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items))
  }, [state.items])

  const addItem = useCallback((item: CartItem) => {
    dispatch({ type: 'ADD_ITEM', item })
  }, [])

  const removeItem = useCallback((productId: string) => {
    dispatch({ type: 'REMOVE_ITEM', productId })
  }, [])

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', productId, quantity })
  }, [])

  const clearCart = useCallback(() => {
    dispatch({ type: 'CLEAR_CART' })
  }, [])

  const getItemQuantity = useCallback((productId: string) => {
    return state.items.find((i) => i.productId === productId)?.quantity ?? 0
  }, [state.items])

  const getSubtotal = useCallback(() => {
    return state.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0)
  }, [state.items])

  const getItemCount = useCallback(() => {
    return state.items.reduce((sum, i) => sum + i.quantity, 0)
  }, [state.items])

  return (
    <CartContext.Provider
      value={{
        items: state.items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        getItemQuantity,
        getSubtotal,
        getItemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
```

**Step 7: Update PortalHeader to use cart count**

Modify `src/app/(portal)/layout.tsx` — the header needs dynamic cart count. Update to pass through context:

Replace the `PortalHeader` usage in `src/app/(portal)/layout.tsx`:

```tsx
import { getAuthenticatedProfile } from '@/lib/auth'
import { PortalHeader } from '@/components/layout/portal-header'
import { CartProvider } from '@/lib/cart/context'

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const profile = await getAuthenticatedProfile()

  return (
    <CartProvider>
      <div className="min-h-screen bg-gray-50">
        <PortalHeaderWrapper profile={profile} />
        <main className="container mx-auto px-4 py-6">
          {children}
        </main>
      </div>
    </CartProvider>
  )
}

// Client wrapper to access cart context
function PortalHeaderWrapper({ profile }: { profile: any }) {
  return <PortalHeader profile={profile} cartItemCount={0} />
}
```

Actually, simpler approach — make PortalHeader read from cart context directly:

Update `src/components/layout/portal-header.tsx` to use `useCart`:

```tsx
'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useCart } from '@/lib/cart/context'
import type { Profile } from '@/types/database'

export function PortalHeader({ profile }: { profile: Profile }) {
  const router = useRouter()
  const { getItemCount } = useCart()
  const cartItemCount = getItemCount()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="border-b bg-white">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/portal/dashboard" className="text-xl font-bold tracking-tight">
            RYDEEN
          </Link>
          <nav className="hidden md:flex items-center gap-4 text-sm">
            <Link href="/portal/dashboard" className="text-muted-foreground hover:text-foreground">Dashboard</Link>
            <Link href="/portal/catalog" className="text-muted-foreground hover:text-foreground">Catalog</Link>
            <Link href="/portal/orders" className="text-muted-foreground hover:text-foreground">Orders</Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/portal/cart" className="relative">
            <Button variant="outline" size="sm">
              Cart
              {cartItemCount > 0 && (
                <span className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-black text-xs text-white">
                  {cartItemCount}
                </span>
              )}
            </Button>
          </Link>
          <span className="text-sm text-muted-foreground hidden md:inline">
            {profile.company_name || profile.email}
          </span>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>Sign out</Button>
        </div>
      </div>
    </header>
  )
}
```

And simplify `src/app/(portal)/layout.tsx`:

```tsx
import { getAuthenticatedProfile } from '@/lib/auth'
import { PortalHeader } from '@/components/layout/portal-header'
import { CartProvider } from '@/lib/cart/context'

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const profile = await getAuthenticatedProfile()

  return (
    <CartProvider>
      <div className="min-h-screen bg-gray-50">
        <PortalHeader profile={profile} />
        <main className="container mx-auto px-4 py-6">
          {children}
        </main>
      </div>
    </CartProvider>
  )
}
```

**Step 8: Run all tests**

```bash
npx vitest run
```

Expected: All tests pass (pricing + cart reducer).

**Step 9: Commit**

```bash
git add src/lib/cart/ src/components/layout/portal-header.tsx src/app/\(portal\)/layout.tsx
git commit -m "feat: add cart state management with reducer, localStorage persistence, and header badge"
```

---

## Task 10: Cart Side Panel

**Files:**
- Create: `src/components/cart/cart-sheet.tsx`
- Modify: `src/components/layout/portal-header.tsx` (add sheet trigger)

**Step 1: Create cart side panel**

Create `src/components/cart/cart-sheet.tsx`:

```tsx
'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { useCart } from '@/lib/cart/context'

export function CartSheet({ children }: { children: React.ReactNode }) {
  const { items, updateQuantity, removeItem, getSubtotal, getItemCount, clearCart } = useCart()

  return (
    <Sheet>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className="flex flex-col w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Order Cart ({getItemCount()} items)</SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground">Your cart is empty</p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto space-y-3 py-4">
              {items.map((item) => (
                <div key={item.productId} className="flex items-center gap-3">
                  <div className="h-12 w-12 bg-gray-100 rounded flex-shrink-0 relative">
                    {item.imageUrl ? (
                      <Image src={item.imageUrl} alt={item.name} fill className="object-contain p-1" />
                    ) : (
                      <div className="flex items-center justify-center h-full text-xs text-muted-foreground">img</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground">${item.unitPrice.toFixed(2)} each</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0"
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}>
                      &minus;
                    </Button>
                    <span className="text-sm w-6 text-center">{item.quantity}</span>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0"
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}>
                      +
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground"
                      onClick={() => removeItem(item.productId)}>
                      &times;
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <Separator />

            <div className="py-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span className="font-bold">${getSubtotal().toFixed(2)}</span>
              </div>
              <Link href="/portal/cart">
                <Button className="w-full bg-black text-white hover:bg-gray-800">
                  Review &amp; Continue
                </Button>
              </Link>
              <Button variant="ghost" className="w-full text-sm" onClick={clearCart}>
                Clear cart
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
```

**Step 2: Integrate sheet into portal header**

Update `src/components/layout/portal-header.tsx` — wrap the Cart button with CartSheet:

Add import at top:
```tsx
import { CartSheet } from '@/components/cart/cart-sheet'
```

Replace the cart link in the header:

```tsx
<CartSheet>
  <Button variant="outline" size="sm">
    Cart
    {cartItemCount > 0 && (
      <span className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-black text-xs text-white">
        {cartItemCount}
      </span>
    )}
  </Button>
</CartSheet>
```

**Step 3: Verify side cart works**

```bash
npm run dev
```

Add items from catalog, click Cart button — should open side panel with items, quantities, subtotal.

**Step 4: Commit**

```bash
git add src/components/cart/ src/components/layout/portal-header.tsx
git commit -m "feat: add side cart panel with item management and subtotal"
```

---

## Task 11: Order Review Page

**Files:**
- Create: `src/app/(portal)/cart/page.tsx`
- Create: `src/components/cart/order-review.tsx`

**Step 1: Create order review client component**

Create `src/components/cart/order-review.tsx`:

```tsx
'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useCart } from '@/lib/cart/context'
import { placeOrder } from '@/app/(portal)/cart/actions'

export function OrderReview() {
  const { items, updateQuantity, removeItem, getSubtotal, clearCart } = useCart()
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handlePlaceOrder() {
    if (items.length === 0) return
    setLoading(true)
    setError(null)

    const result = await placeOrder({
      items: items.map((i) => ({
        productId: i.productId,
        sku: i.sku,
        productName: i.name,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        msrp: i.msrp,
      })),
      notes,
    })

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    clearCart()
    router.push(`/portal/orders/${result.orderNumber}?placed=true`)
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
        <p className="text-muted-foreground mb-4">Add products from the catalog to get started.</p>
        <Link href="/portal/catalog">
          <Button>Browse Catalog</Button>
        </Link>
      </div>
    )
  }

  const subtotal = getSubtotal()

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <div className="md:col-span-2 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Order Items</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.map((item) => (
              <div key={item.productId} className="flex items-center gap-4">
                <div className="h-16 w-16 bg-gray-100 rounded flex-shrink-0 relative">
                  {item.imageUrl ? (
                    <Image src={item.imageUrl} alt={item.name} fill className="object-contain p-2" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-xs text-muted-foreground">img</div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-muted-foreground">{item.sku}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm"
                    onClick={() => updateQuantity(item.productId, item.quantity - 1)}>
                    &minus;
                  </Button>
                  <span className="w-8 text-center">{item.quantity}</span>
                  <Button variant="outline" size="sm"
                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}>
                    +
                  </Button>
                </div>
                <div className="text-right w-24">
                  <p className="font-medium">${(item.unitPrice * item.quantity).toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">${item.unitPrice.toFixed(2)} ea</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => removeItem(item.productId)}>
                  &times;
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Order Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <textarea
              className="w-full border rounded-md p-3 text-sm min-h-[100px] resize-y"
              placeholder="Notes added to this order will be read by a Rydeen Specialist. Add spotes here."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </CardContent>
        </Card>
      </div>

      <div>
        <Card className="sticky top-4">
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button
              className="w-full bg-black text-white hover:bg-gray-800"
              onClick={handlePlaceOrder}
              disabled={loading}
            >
              {loading ? 'Placing Order...' : 'Place Order'}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Orders require admin review before processing
            </p>
          </CardContent>
        </Card>

        <div className="mt-4 text-center">
          <Link href="/portal/catalog" className="text-sm text-muted-foreground hover:underline">
            &larr; Back to Catalog
          </Link>
        </div>
      </div>
    </div>
  )
}
```

**Step 2: Create cart page**

Create `src/app/(portal)/cart/page.tsx`:

```tsx
import { OrderReview } from '@/components/cart/order-review'

export default function CartPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">New Order</h1>
      <p className="text-muted-foreground mb-6">Please review your order carefully. This order will be processed as submitted.</p>
      <OrderReview />
    </div>
  )
}
```

**Step 3: Verify order review page renders**

```bash
npm run dev
```

Add items to cart, click "Review & Continue" — should navigate to /portal/cart with full order review.

**Step 4: Commit**

```bash
git add src/app/\(portal\)/cart/ src/components/cart/order-review.tsx
git commit -m "feat: add order review page with editable quantities and notes"
```

---

## Task 12: Order Submission + Email Notification

**Files:**
- Create: `src/app/(portal)/cart/actions.ts`
- Create: `src/lib/email/order-notification.ts`
- Create: `src/app/(portal)/orders/[orderNumber]/page.tsx`
- Create: `src/app/(portal)/orders/page.tsx`

**Step 1: Create order placement server action**

Create `src/app/(portal)/cart/actions.ts`:

```typescript
'use server'

import { createSSRClient } from '@/lib/supabase/server'
import { sendOrderNotification } from '@/lib/email/order-notification'

interface PlaceOrderInput {
  items: {
    productId: string
    sku: string
    productName: string
    quantity: number
    unitPrice: number
    msrp: number
  }[]
  notes: string
}

export async function placeOrder(input: PlaceOrderInput) {
  const supabase = await createSSRClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated', orderNumber: null }

  const subtotal = input.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0)

  // Create order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      dealer_id: user.id,
      notes: input.notes || null,
      subtotal: Math.round(subtotal * 100) / 100,
      total: Math.round(subtotal * 100) / 100,
    })
    .select()
    .single()

  if (orderError) return { error: orderError.message, orderNumber: null }

  // Create order items
  const orderItems = input.items.map((item) => ({
    order_id: order.id,
    product_id: item.productId,
    sku: item.sku,
    product_name: item.productName,
    quantity: item.quantity,
    unit_price: item.unitPrice,
    msrp: item.msrp,
    line_total: Math.round(item.unitPrice * item.quantity * 100) / 100,
  }))

  const { error: itemsError } = await supabase.from('order_items').insert(orderItems)

  if (itemsError) return { error: itemsError.message, orderNumber: null }

  // Get dealer profile for email
  const { data: profile } = await supabase
    .from('profiles')
    .select('company_name, contact_name, email')
    .eq('id', user.id)
    .single()

  // Send email notification (non-blocking)
  try {
    await sendOrderNotification({
      orderNumber: order.order_number,
      dealerName: profile?.company_name || profile?.contact_name || 'Unknown Dealer',
      dealerEmail: profile?.email || user.email || '',
      items: input.items,
      subtotal,
      total: subtotal,
      notes: input.notes,
    })
  } catch (e) {
    // Log but don't fail the order
    console.error('Failed to send order notification email:', e)
  }

  return { error: null, orderNumber: order.order_number }
}
```

**Step 2: Create email notification service**

Create `src/lib/email/order-notification.ts`:

```typescript
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface OrderNotificationData {
  orderNumber: string
  dealerName: string
  dealerEmail: string
  items: {
    sku: string
    productName: string
    quantity: number
    unitPrice: number
  }[]
  subtotal: number
  total: number
  notes: string
}

export async function sendOrderNotification(data: OrderNotificationData) {
  const itemRows = data.items
    .map((i) => `${i.sku} | ${i.productName} | Qty: ${i.quantity} | $${i.unitPrice.toFixed(2)} | $${(i.unitPrice * i.quantity).toFixed(2)}`)
    .join('\n')

  await resend.emails.send({
    from: 'Rydeen Dealer Portal <noreply@rydeenmobile.com>',
    to: process.env.ORDER_NOTIFICATION_EMAIL || 'orders@rydeenmobile.com',
    replyTo: data.dealerEmail,
    subject: `New Order ${data.orderNumber} from ${data.dealerName}`,
    text: `
New Dealer Portal Order

Order Number: ${data.orderNumber}
Dealer: ${data.dealerName}
Email: ${data.dealerEmail}

Items:
${itemRows}

Subtotal: $${data.subtotal.toFixed(2)}
Total: $${data.total.toFixed(2)}

${data.notes ? `Order Notes:\n${data.notes}` : ''}

---
This order was placed via the Rydeen Dealer Portal.
    `.trim(),
  })
}
```

**Step 3: Create order confirmation page**

Create `src/app/(portal)/orders/[orderNumber]/page.tsx`:

```tsx
import { createSSRClient } from '@/lib/supabase/server'
import { getAuthenticatedProfile } from '@/lib/auth'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface OrderDetailPageProps {
  params: Promise<{ orderNumber: string }>
  searchParams: Promise<{ placed?: string }>
}

export default async function OrderDetailPage({ params, searchParams }: OrderDetailPageProps) {
  const { orderNumber } = await params
  const { placed } = await searchParams
  const profile = await getAuthenticatedProfile()
  const supabase = await createSSRClient()

  const { data: order } = await supabase
    .from('orders')
    .select('*, items:order_items(*)')
    .eq('order_number', orderNumber)
    .eq('dealer_id', profile.id)
    .single()

  if (!order) notFound()

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {placed && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <p className="text-green-800 font-medium">Order placed successfully!</p>
            <p className="text-sm text-green-700">
              Your order has been submitted and sent to the Rydeen team for processing.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Order {order.order_number}</h1>
          <p className="text-muted-foreground">
            Placed on {new Date(order.created_at).toLocaleDateString()}
          </p>
        </div>
        <Badge variant="secondary" className="capitalize">{order.status}</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Order Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {order.items.map((item: any) => (
              <div key={item.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                <div>
                  <p className="font-medium">{item.product_name}</p>
                  <p className="text-sm text-muted-foreground">{item.sku} &middot; Qty: {item.quantity}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">${Number(item.line_total).toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">${Number(item.unit_price).toFixed(2)} ea</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {order.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Order Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{order.notes}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between font-bold text-lg">
            <span>Total</span>
            <span>${Number(order.total).toFixed(2)}</span>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Link href="/portal/orders">
          <Button variant="outline">&larr; All Orders</Button>
        </Link>
        <Link href="/portal/catalog">
          <Button>Continue Shopping</Button>
        </Link>
      </div>
    </div>
  )
}
```

**Step 4: Create orders list page**

Create `src/app/(portal)/orders/page.tsx`:

```tsx
import { createSSRClient } from '@/lib/supabase/server'
import { getAuthenticatedProfile } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function OrdersPage() {
  const profile = await getAuthenticatedProfile()
  const supabase = await createSSRClient()

  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .eq('dealer_id', profile.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Order History</h1>
        <Link href="/portal/catalog">
          <Button>New Order</Button>
        </Link>
      </div>

      {(!orders || orders.length === 0) ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">No orders yet.</p>
            <Link href="/portal/catalog">
              <Button>Browse Catalog</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Link key={order.id} href={`/portal/orders/${order.order_number}`}>
              <Card className="hover:bg-gray-50 transition-colors cursor-pointer">
                <CardContent className="flex items-center justify-between py-4">
                  <div>
                    <p className="font-medium">{order.order_number}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant="secondary" className="capitalize">{order.status}</Badge>
                    <span className="font-bold">${Number(order.total).toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
```

**Step 5: Run all tests**

```bash
npx vitest run
```

Expected: All tests pass.

**Step 6: Verify the full flow**

```bash
npm run dev
```

1. Log in → Dashboard
2. Click "Browse Catalog" → Product Catalog with filters
3. Add items to cart → Side cart shows
4. Click "Review & Continue" → Order Review page
5. Add notes, click "Place Order" → Confirmation page
6. Check orders list → Order appears

**Step 7: Commit**

```bash
git add src/app/\(portal\)/cart/actions.ts src/lib/email/ src/app/\(portal\)/orders/
git commit -m "feat: add order submission with email notification and order history"
```

---

## Summary

After completing all 12 tasks, the portal supports:

| Feature | Status |
|---------|--------|
| Email OTP login | Done |
| Dealer registration + admin approval gate | Done |
| Protected routes (middleware) | Done |
| Dealer dashboard with KPIs | Done |
| Product catalog with category filters + search | Done |
| Dealer-specific pricing (tier-based) | Done |
| Product detail page | Done |
| Cart (add/remove/quantity/persist) | Done |
| Side cart panel | Done |
| Order review with notes | Done |
| Order placement + email to orders@rydeenmobile.com | Done |
| Order history + detail view | Done |

### Not yet implemented (future plans):
- Admin panel (manage dealers, products, inventory, orders)
- Promo pricing (threshold, time-limited, SKU-level)
- Reorder from past orders
- CSV/PDF data export
- FAQ library with PDFs and downloads
- Multiple shipping addresses selection on checkout
- Product image uploads to Supabase Storage
- Mobile app (PWA or React Native)
