'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useCart } from '@/lib/cart/context'
import type { Product } from '@/types/database'

interface ProductDetailProps {
  product: Product
  dealerPrice: number
}

export function ProductDetail({ product, dealerPrice }: ProductDetailProps) {
  const { addItem, getItemQuantity, updateQuantity } = useCart()
  const quantity = getItemQuantity(product.id)

  function handleAddToCart() {
    if (quantity === 0) {
      addItem({
        productId: product.id,
        sku: product.sku,
        name: product.name,
        imageUrl: product.image_url,
        unitPrice: dealerPrice,
        msrp: Number(product.msrp),
        quantity: 1,
      })
    }
  }

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <div className="relative aspect-square bg-gray-100 rounded-lg">
        {product.image_url ? (
          <Image src={product.image_url} alt={product.name} fill className="object-contain p-8" />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">No image</div>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold">{product.name}</h1>
          <p className="text-muted-foreground">{product.short_description}</p>
        </div>

        <div>
          <span className="text-3xl font-bold text-green-700">${dealerPrice.toFixed(2)}</span>
          <span className="ml-2 text-sm text-muted-foreground">(based on FORECAST LVL.)</span>
        </div>

        {product.status_flags.length > 0 && (
          <div className="flex gap-2">
            {product.status_flags.map((flag) => (
              <Badge key={flag} variant="destructive">{flag}</Badge>
            ))}
          </div>
        )}

        <ul className="list-disc list-inside space-y-1">
          {(product.features as string[]).map((feature, i) => (
            <li key={i} className="text-sm">{feature}</li>
          ))}
        </ul>

        <hr />

        <div className="flex items-center gap-4">
          <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
        </div>

        <p className="text-sm font-medium">Need help? 1-310-787-7880</p>

        <hr />

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateQuantity(product.id, Math.max(0, quantity - 1))}
              disabled={quantity === 0}
            >
              −
            </Button>
            <span className="font-medium w-8 text-center">{quantity || 1}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => quantity === 0 ? handleAddToCart() : updateQuantity(product.id, quantity + 1)}
            >
              +
            </Button>
          </div>
          <Button
            className="flex-1 bg-black text-white hover:bg-gray-800"
            onClick={handleAddToCart}
          >
            + Add to Order
          </Button>
        </div>

        <div className="flex gap-4 text-sm">
          <Link href="/portal/catalog" className="text-muted-foreground hover:underline">
            Back to Browse
          </Link>
        </div>
      </div>

      {product.description && (
        <div className="md:col-span-2">
          <h2 className="text-lg font-semibold mb-2">Product Details</h2>
          <p className="text-sm text-muted-foreground whitespace-pre-line">{product.description}</p>
        </div>
      )}
    </div>
  )
}
