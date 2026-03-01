import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface OrderNotificationData {
  orderNumber: string
  dealerName: string
  dealerEmail: string
  items: {
    sku: string
    productName: string
    quantity: number
    unitPrice: number
  }[]
  subtotal: number
  total: number
  notes: string
}

export async function sendOrderNotification(data: OrderNotificationData) {
  const itemRows = data.items
    .map((i) => `${i.sku} | ${i.productName} | Qty: ${i.quantity} | $${i.unitPrice.toFixed(2)} | $${(i.unitPrice * i.quantity).toFixed(2)}`)
    .join('\n')

  await resend.emails.send({
    from: 'Rydeen Dealer Portal <noreply@rydeenmobile.com>',
    to: process.env.ORDER_NOTIFICATION_EMAIL || 'orders@rydeenmobile.com',
    replyTo: data.dealerEmail,
    subject: `New Order ${data.orderNumber} from ${data.dealerName}`,
    text: `
New Dealer Portal Order

Order Number: ${data.orderNumber}
Dealer: ${data.dealerName}
Email: ${data.dealerEmail}

Items:
${itemRows}

Subtotal: $${data.subtotal.toFixed(2)}
Total: $${data.total.toFixed(2)}

${data.notes ? `Order Notes:\n${data.notes}` : ''}

---
This order was placed via the Rydeen Dealer Portal.
    `.trim(),
  })
}
