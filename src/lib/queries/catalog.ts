import { createSSRClient } from '@/lib/supabase/server'

export async function getCategories() {
  const supabase = await createSSRClient()
  const { data } = await supabase
    .from('categories')
    .select('*, sector:sectors(*)')
    .order('sort_order')
  return data || []
}

export async function getProducts(options?: {
  categorySlug?: string
  search?: string
}) {
  const supabase = await createSSRClient()

  let query = supabase
    .from('products')
    .select('*, category:categories(*)')
    .eq('is_active', true)
    .order('sort_order')

  if (options?.categorySlug) {
    query = query.eq('category.slug', options.categorySlug)
  }

  if (options?.search) {
    query = query.or(`name.ilike.%${options.search}%,sku.ilike.%${options.search}%`)
  }

  const { data } = await query
  return (data || []).filter(p => p.category !== null)
}
