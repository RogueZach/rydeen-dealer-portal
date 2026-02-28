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
