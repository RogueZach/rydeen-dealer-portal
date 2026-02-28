import { Suspense } from 'react'
import { getAuthenticatedProfile } from '@/lib/auth'
import { getCategories, getProducts } from '@/lib/queries/catalog'
import { calculateDealerPrice } from '@/lib/pricing'
import { CategoryFilter } from '@/components/catalog/category-filter'
import { SearchBar } from '@/components/catalog/search-bar'
import { ProductCard } from '@/components/catalog/product-card'

interface CatalogPageProps {
  searchParams: Promise<{ category?: string; search?: string }>
}

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const params = await searchParams
  const profile = await getAuthenticatedProfile()

  const [categories, products] = await Promise.all([
    getCategories(),
    getProducts({
      categorySlug: params.category,
      search: params.search,
    }),
  ])

  const discountPercentage = profile.pricing_tier?.discount_percentage ?? 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Product Catalog</h1>
          <p className="text-muted-foreground">Browse and order Rydeen products</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <Suspense>
          <SearchBar />
        </Suspense>
        <Suspense>
          <CategoryFilter categories={categories} activeSlug={params.category} />
        </Suspense>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product as any}
            dealerPrice={calculateDealerPrice(Number(product.msrp), discountPercentage)}
          />
        ))}
      </div>

      {products.length === 0 && (
        <p className="text-center text-muted-foreground py-12">No products found.</p>
      )}
    </div>
  )
}
