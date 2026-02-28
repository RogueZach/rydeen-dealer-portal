import { createSSRClient } from '@/lib/supabase/server'

export async function getProductBySku(sku: string) {
  const supabase = await createSSRClient()

  const { data } = await supabase
    .from('products')
    .select('*, category:categories(*, sector:sectors(*))')
    .eq('sku', sku)
    .eq('is_active', true)
    .single()

  return data
}
