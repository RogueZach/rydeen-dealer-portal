import { notFound } from 'next/navigation'
import { getAuthenticatedProfile } from '@/lib/auth'
import { getProductBySku } from '@/lib/queries/product'
import { calculateDealerPrice } from '@/lib/pricing'
import { ProductDetail } from '@/components/catalog/product-detail'

interface ProductPageProps {
  params: Promise<{ sku: string }>
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { sku } = await params
  const profile = await getAuthenticatedProfile()
  const product = await getProductBySku(sku)

  if (!product) notFound()

  const discountPercentage = profile.pricing_tier?.discount_percentage ?? 0
  const dealerPrice = calculateDealerPrice(Number(product.msrp), discountPercentage)

  return (
    <div className="max-w-5xl mx-auto">
      <ProductDetail product={product} dealerPrice={dealerPrice} />
    </div>
  )
}
