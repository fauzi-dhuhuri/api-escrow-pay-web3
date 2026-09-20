import { Hono } from "hono"
import { z } from "zod"
import { zValidator } from "@hono/zod-validator"
import { prisma } from "../db/database.js"
import { processPaymentWebhook } from "../services/paymentProcessor.js"
import { releaseFunds, getTransactionStatus } from "../services/escrowServices.js"

const app = new Hono()

const createTransactionSchema = z.object({
  buyer_email: z.string().email({ message: 'That address email format is wrong' }),
  buyer_name: z.string().min(1, { message: 'Buyer name is required' }),
  seller_email: z.string().email({ message: 'That address email format is wrong' }),
  amount: z.number().positive({ message: 'Nominal must be greater than 0' }),
})

app.post('/create-transaction', zValidator('json', createTransactionSchema), async (c) => {
  try {
    const body = c.req.valid('json')
    const transactionId = `TX-ESCROW-${Date.now()}`
    const sanitizedCustRef = `CUST${Date.now()}${Math.floor(Math.random() * 1000)}`

    const xenditResponse = await fetch('https://api.xendit.co/sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${process.env.XENDIT_SECRET_KEY}:`).toString('base64')}`,
      },
      body: JSON.stringify({
        reference_id: transactionId,
        session_type: 'PAY',
        mode: 'PAYMENT_LINK',
        amount: body.amount,
        currency: 'IDR',
        country: 'ID',
        customer: {
          type: 'INDIVIDUAL',
          reference_id: sanitizedCustRef,
          email: body.buyer_email,
          individual_detail: {
            given_names: body.buyer_name,
          }
        },
        allowed_payment_channels: ['QRIS', 'BCA_VIRTUAL_ACCOUNT', 'DANA'],
        return_url: `${process.env.URL}/api/v1/payments/success?txId=${transactionId}`,
      }),
    })

    const sessionData = await xenditResponse.json()

    if (!xenditResponse.ok) {
      throw new Error(sessionData.message || 'Gagal membuat Payment Session di Xendit')
    }

    const paymentUrl = sessionData.payment_link_url || sessionData.url

    const newTx = await prisma.transaction.create({
      data: {
        id: transactionId,
        buyerEmail: body.buyer_email,
        sellerAddress: body.seller_email,
        amount: body.amount,
        status: 'PENDING',
        paymentUrl: paymentUrl,
      },
    })

    return c.json({
      success: true,
      message: 'Transaksi berhasil dicatat di database',
      data: newTx
    }, 201)

  } catch (error: any) {
    return c.json({
      success: false,
      message: 'Gagal membuat transaksi',
      error: error.message,
    }, 500)
  }

})

app.post('/webhook', async (c) => {
  try {
    // A. Validasi Header Xendit Verification Token (Keamanan Webhook)
    const xenditCallbackToken = c.req.header('x-callback-token')
    const expectedToken = process.env.XENDIT_WEBHOOK_VERIFICATION_TOKEN

    if (expectedToken && xenditCallbackToken !== expectedToken) {
      console.warn('⚠️ Webhook ditolak: Callback Token tidak valid!')
      return c.json({ success: false, message: 'Unauthorized webhook request' }, 401)
    }

    // B. Parse Body Webhook dari Xendit
    const body = await c.req.json()
    console.log('🔔 Xendit Webhook Event Received:', JSON.stringify(body, null, 2))

    // Payload Xendit Session mengirimkan objek data utama
    const sessionData = body.data || body
    const referenceId = sessionData.reference_id
    const sessionStatus = sessionData.status // 'COMPLETED', 'EXPIRED', 'CANCELLED'
    const eventType = body.event // 'payment_session.completed', 'payment_session.expired'

    if (!referenceId) {
      return c.json({ success: false, message: 'Missing reference_id in webhook payload' }, 400)
    }

    // C. Cari Transaksi berdasarkan reference_id di Prisma
    const existingTx = await prisma.transaction.findUnique({
      where: { id: referenceId },
    })

    if (!existingTx) {
      console.warn(`⚠️ Transaksi dengan ID ${referenceId} tidak ditemukan di DB.`)
      return c.json({ success: false, message: 'Transaction not found' }, 404)
    }

    const result = await processPaymentWebhook({
      sessionStatus,
      eventType,
      referenceId,
      amount: existingTx.amount.toNumber(),
    })

    if (result.status === 'IGNORED') {
      return c.json({ success: true, message: 'Event ignored' }, 200)
    }

    // Update DB & simpan raw payload untuk audit trail/skripsi
    const updatedTx = await prisma.transaction.update({
      where: { id: referenceId },
      data: {
        status: result.status,
        blockchainTxHash: result.blockchainTxHash || existingTx.blockchainTxHash,
        rawWebhookPayload: body,
      },
    })

    console.log(`✅ Status Transaksi ${referenceId} berhasil diperbarui menjadi: ${result.status}`)

    // E. Berikan respon HTTP 200 ke Xendit sebagai konfirmasi
    return c.json({
      success: true,
      message: 'Webhook processed successfully',
      data: {
        transaction_id: updatedTx.id,
        status: updatedTx.status,
        txHash: updatedTx.blockchainTxHash,
      },
    }, 200)

  } catch (error: any) {
    console.error('❌ Webhook Handler Error:', error)
    return c.json({
      success: false,
      message: 'Internal server error processing webhook',
      error: error.message || error,
    }, 500)
  }
})

app.post('/release-funds', async (c) => {
  const { transactionId } = await c.req.json()

  const tx = await prisma.transaction.findUnique({ where: { id: transactionId } })
  if (!tx) {
    return c.json({ success: false, message: 'Transaksi tidak ditemukan' }, 404)
  }

  if (tx.status === 'COMPLETED') {
    return c.json({ 
      success: true, 
      message: 'Dana untuk transaksi ini sudah pernah dirilis (COMPLETED)',
      data: tx 
    }, 200)
  }

  if (tx.status !== 'LOCKED') {
    return c.json({ success: false, message: `Transaksi berstatus ${tx.status}, tidak bisa dirilis` }, 400)
  }

  const releaseResult = await releaseFunds(transactionId)

  const completedTx = await prisma.transaction.update({
    where: { id: transactionId },
    data: { status: 'COMPLETED' }
  })

  return c.json({
    success: true,
    message: 'Dana berhasil dirilis ke seller',
    data: completedTx,
    releaseResult
  })
})

app.post('/get-transaction-status', async (c) => {
  const { transactionId } = await c.req.json()

  const tx = await prisma.transaction.findUnique({ where: { id: transactionId } })
  if (!tx) {
    return c.json({ success: false, message: 'Transaksi tidak ditemukan' }, 404)
  }

  const blockchainStatus = await getTransactionStatus(transactionId)

  return c.json({
    success: true,
    blockchainStatus,
    message: 'Status transaksi berhasil diambil',
    data: tx
  })
})

export default app