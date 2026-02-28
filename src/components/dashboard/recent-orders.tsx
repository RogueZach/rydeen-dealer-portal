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
