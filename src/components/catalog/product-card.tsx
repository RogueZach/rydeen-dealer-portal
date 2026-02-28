'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useCart } from '@/lib/cart/context'
import type { Product, Category } from '@/types/database'

interface ProductCardProps {
  product: Product & { category: Category }
  dealerPrice: number
}

export function ProductCard({ product, dealerPrice }: ProductCardProps) {
  const { addItem, getItemQuantity, updateQuantity } = useCart()
  const quantity = getItemQuantity(product.id)

  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-square bg-gray-100">
        {product.category && (
          <Badge
            className="absolute top-2 left-2 z-10"
            style={{ backgroundColor: product.category.badge_color, color: '#fff' }}
          >
            {product.category.name}
          </Badge>
        )}
        <Link href={`/portal/catalog/${product.sku}`} className="absolute top-2 right-2 z-10">
          <Badge variant="secondary">Details</Badge>
        </Link>
        {product.status_flags.length > 0 && (
          <div className="absolute top-10 right-2 z-10 flex flex-col gap-1">
            {product.status_flags.map((flag) => (
              <Badge key={flag} variant="destructive" className="text-xs">{flag}</Badge>
            ))}
          </div>
        )}
        {product.image_url ? (
          <Image src={product.image_url} alt={product.name} fill className="object-contain p-4" />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">No image</div>
        )}
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold text-sm line-clamp-2">{product.name}</h3>
        <p className="text-xs text-muted-foreground">{product.sku}</p>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-sm text-muted-foreground">YOUR PRICE</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold">${dealerPrice.toFixed(2)}</span>
          <span className="text-sm text-muted-foreground">MSRP</span>
          <span className="text-sm text-muted-foreground line-through">${Number(product.msrp).toFixed(2)}</span>
        </div>
        <div className="mt-3">
          {quantity === 0 ? (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => addItem({
                productId: product.id,
                sku: product.sku,
                name: product.name,
                imageUrl: product.image_url,
                unitPrice: dealerPrice,
                msrp: Number(product.msrp),
                quantity: 1,
              })}
            >
              + Add to Order
            </Button>
          ) : (
            <div className="flex items-center justify-center gap-3">
              <Button variant="outline" size="sm" onClick={() => updateQuantity(product.id, quantity - 1)}>
                −
              </Button>
              <span className="font-medium w-8 text-center">{quantity}</span>
              <Button variant="outline" size="sm" onClick={() => updateQuantity(product.id, quantity + 1)}>
                +
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
