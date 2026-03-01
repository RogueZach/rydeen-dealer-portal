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
