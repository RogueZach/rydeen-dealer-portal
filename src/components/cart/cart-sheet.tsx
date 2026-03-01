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
                      −
                    </Button>
                    <span className="text-sm w-6 text-center">{item.quantity}</span>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0"
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}>
                      +
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground"
                      onClick={() => removeItem(item.productId)}>
                      ×
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
