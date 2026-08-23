import { SpanStatusCode } from '@opentelemetry/api'
import { defineEventHandler, readBody } from 'h3'

interface OrderRequest {
  productId: string
  quantity: number
  userId: string
}

export default defineEventHandler(async (event) => {
  const { trace } = useOtelTracer('order')
  const logger = useOtelLogger()
  const orderStorage = useStorage('order')

  const body = await readBody<OrderRequest>(event)
  const orderId = `ord-${Date.now()}`

  return await trace('process', async (span) => {
    span.setAttributes({
      'order.id': orderId,
      'order.product_id': body.productId,
      'order.quantity': body.quantity,
      'order.user_id': body.userId,
    })

    logger.emit({
      severityNumber: 9,
      body: `Processing order ${orderId}`,
      attributes: { orderId, productId: body.productId },
    })

    // Validate order
    await trace('validate', async (s) => {
      await delay(10, 30)
      if (body.quantity <= 0) {
        s.setStatus({ code: SpanStatusCode.ERROR, message: 'Invalid quantity' })
        throw new Error('Invalid quantity')
      }
      s.setAttribute('validation.passed', true)
    })

    // Check inventory
    const inStock = await trace('inventory.check', async (s) => {
      await delay(20, 50)
      const available = Math.random() > 0.1 // 90% in stock
      s.setAttribute('inventory.available', available)
      return available
    })

    if (!inStock) {
      span.setStatus({ code: SpanStatusCode.ERROR, message: 'Out of stock' })
      logger.emit({
        severityNumber: 17,
        body: `Order ${orderId} failed: out of stock`,
        attributes: { orderId, productId: body.productId },
      })
      return { success: false, error: 'Out of stock', orderId }
    }

    // Process payment
    const paymentSuccess = await trace('payment.process', async (s) => {
      await delay(50, 150)
      const success = Math.random() > 0.15 // 85% success rate
      s.setAttribute('payment.success', success)
      s.setAttribute('payment.amount', body.quantity * 29.99)
      return success
    })

    if (!paymentSuccess) {
      span.setStatus({ code: SpanStatusCode.ERROR, message: 'Payment failed' })
      logger.emit({
        severityNumber: 17,
        body: `Order ${orderId} failed: payment declined`,
        attributes: { orderId },
      })
      return { success: false, error: 'Payment failed', orderId }
    }

    // Update inventory
    await trace('inventory.update', async (s) => {
      await delay(15, 40)
      s.setAttribute('inventory.deducted', body.quantity)
    })

    span.setStatus({ code: SpanStatusCode.OK })
    logger.emit({
      severityNumber: 9,
      body: `Order ${orderId} completed successfully`,
      attributes: { orderId, total: body.quantity * 29.99 },
    })
    const order = {
      success: true,
      orderId,
      total: body.quantity * 29.99,
    }
    await orderStorage.set(orderId, order)
    return order
  })
})

function delay(min: number, max: number) {
  return new Promise(resolve => setTimeout(() => resolve(true), Math.random() * (max - min) + min))
}
