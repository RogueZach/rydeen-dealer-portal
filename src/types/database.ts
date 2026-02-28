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
