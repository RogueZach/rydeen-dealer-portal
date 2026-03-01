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
