'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import type { Category } from '@/types/database'

export function CategoryFilter({ categories, activeSlug }: { categories: Category[]; activeSlug?: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function selectCategory(slug?: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (slug) {
      params.set('category', slug)
    } else {
      params.delete('category')
    }
    router.push(`/portal/catalog?${params.toString()}`)
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Badge
        variant={!activeSlug ? 'default' : 'outline'}
        className="cursor-pointer"
        onClick={() => selectCategory()}
      >
        ALL
      </Badge>
      {categories.map((cat) => (
        <Badge
          key={cat.id}
          variant={activeSlug === cat.slug ? 'default' : 'outline'}
          className="cursor-pointer"
          style={activeSlug === cat.slug ? { backgroundColor: cat.badge_color } : {}}
          onClick={() => selectCategory(cat.slug)}
        >
          {cat.name}
        </Badge>
      ))}
    </div>
  )
}
