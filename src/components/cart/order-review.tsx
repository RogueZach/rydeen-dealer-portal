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
                    −
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
                  ×
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
              placeholder="Notes added to this order will be read by a Rydeen Specialist. Add notes here."
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
