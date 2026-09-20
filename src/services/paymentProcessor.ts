import { lockFunds } from './escrowServices.js'

interface WebhookProcessResult {
  status: 'LOCKED' | 'EXPIRED' | 'CANCELLED' | 'IGNORED'
  blockchainTxHash?: string
}

export async function processPaymentWebhook(params: {
  sessionStatus?: string
  eventType?: string
  referenceId: string
  amount: number
}): Promise<WebhookProcessResult> {
  const { sessionStatus, eventType, referenceId, amount } = params

  if (sessionStatus === 'COMPLETED' || eventType === 'payment_session.completed') {
    const lockResult = await lockFunds(referenceId, BigInt(amount))

    return {
      status: 'LOCKED',
      blockchainTxHash: lockResult.txHash,
    }
  }

  if (sessionStatus === 'EXPIRED' || eventType === 'payment_session.expired') {
    return { status: 'EXPIRED' }
  }

  if (sessionStatus === 'CANCELLED') {
    return { status: 'CANCELLED' }
  }

  return { status: 'IGNORED' }
}