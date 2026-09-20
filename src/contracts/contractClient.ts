import { createPublicClient, createWalletClient, http } from 'viem'
import { sepolia } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'

const adminAccount = privateKeyToAccount(process.env.ADMIN_PRIVATE_KEY as `0x${string}`)

export const relayerWalletClient = createWalletClient({
  account: adminAccount,
  chain: sepolia,
  transport: http(process.env.RPC_URL),
})

export const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(process.env.RPC_URL),
})