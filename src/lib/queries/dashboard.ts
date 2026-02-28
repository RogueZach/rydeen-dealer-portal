import { createSSRClient } from '@/lib/supabase/server'

export async function getDashboardData(dealerId: string) {
  const supabase = await createSSRClient()
  const now = new Date()
  const yearStart = new Date(now.getFullYear(), 0, 1).toISOString()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const [ordersThisYear, monthTotal, pendingOrders, recentOrders] = await Promise.all([
    supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('dealer_id', dealerId)
      .gte('created_at', yearStart),
    supabase
      .from('orders')
      .select('total')
      .eq('dealer_id', dealerId)
      .gte('created_at', monthStart),
    supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('dealer_id', dealerId)
      .in('status', ['pending', 'confirmed', 'processing']),
    supabase
      .from('orders')
      .select('*')
      .eq('dealer_id', dealerId)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const thisMonthTotal = (monthTotal.data || []).reduce((sum, o) => sum + Number(o.total), 0)

  return {
    totalOrders: ordersThisYear.count || 0,
    thisMonth: thisMonthTotal,
    pendingOrders: pendingOrders.count || 0,
    recentOrders: recentOrders.data || [],
  }
}
