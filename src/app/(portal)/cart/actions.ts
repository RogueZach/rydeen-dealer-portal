'use server'

import { createSSRClient } from '@/lib/supabase/server'
import { sendOrderNotification } from '@/lib/email/order-notification'

interface PlaceOrderInput {
  items: {
    productId: string
    sku: string
    productName: string
    quantity: number
    unitPrice: number
    msrp: number
  }[]
  notes: string
}

export async function placeOrder(input: PlaceOrderInput) {
  const supabase = await createSSRClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated', orderNumber: null }

  const subtotal = input.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0)

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      dealer_id: user.id,
      notes: input.notes || null,
      subtotal: Math.round(subtotal * 100) / 100,
      total: Math.round(subtotal * 100) / 100,
    })
    .select()
    .single()

  if (orderError) return { error: orderError.message, orderNumber: null }

  const orderItems = input.items.map((item) => ({
    order_id: order.id,
    product_id: item.productId,
    sku: item.sku,
    product_name: item.productName,
    quantity: item.quantity,
    unit_price: item.unitPrice,
    msrp: item.msrp,
    line_total: Math.round(item.unitPrice * item.quantity * 100) / 100,
  }))

  const { error: itemsError } = await supabase.from('order_items').insert(orderItems)
  if (itemsError) return { error: itemsError.message, orderNumber: null }

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_name, contact_name, email')
    .eq('id', user.id)
    .single()

  try {
    await sendOrderNotification({
      orderNumber: order.order_number,
      dealerName: profile?.company_name || profile?.contact_name || 'Unknown Dealer',
      dealerEmail: profile?.email || user.email || '',
      items: input.items,
      subtotal,
      total: subtotal,
      notes: input.notes,
    })
  } catch (e) {
    console.error('Failed to send order notification email:', e)
  }

  return { error: null, orderNumber: order.order_number }
}
