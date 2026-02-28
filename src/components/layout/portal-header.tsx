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
          <Link href="/portal/cart">
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
