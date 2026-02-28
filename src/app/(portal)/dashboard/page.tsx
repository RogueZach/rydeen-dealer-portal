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
