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
            {(order.items as any[]).map((item: any) => (
              <div key={item.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                <div>
                  <p className="font-medium">{item.product_name}</p>
                  <p className="text-sm text-muted-foreground">{item.sku} · Qty: {item.quantity}</p>
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
