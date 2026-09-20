import process from 'node:process'
import { relayerWalletClient, publicClient } from '../contracts/contractClient.js'
import { escrowVaultAbi } from '../contracts/escrowVaultAbi.js'
import { ContractToAppStatus } from '../contracts/statusMapper.js'

function getContractAddress(): `0x${string}` {
    const address = process.env.ESCROW_VAULT_ADDRESS
    if (!address || !address.startsWith('0x')) {
        throw new Error('FATAL: ESCROW_VAULT_ADDRESS belum disetel atau tidak valid di .env')
    }
    return address as `0x${string}`
}

export async function lockFunds(txId: string, fiatAmount: bigint) {
    const contractAddress = getContractAddress();

    const hash = await relayerWalletClient.writeContract({
        address: contractAddress,
        abi: escrowVaultAbi,
        functionName: 'lockFunds',
        args: [txId, fiatAmount],
    })

    const receipt = await publicClient.waitForTransactionReceipt({ hash })

    return {
        txHash: hash,
        blockNumber: receipt.blockNumber.toString(),
        status: receipt.status,
    }
}

export async function releaseFunds(txId: string) {
    const contractAddress = getContractAddress();

    const hash = await relayerWalletClient.writeContract({
        address: contractAddress,
        abi: escrowVaultAbi,
        functionName: 'releaseFunds',
        args: [txId],
    })

    const receipt = await publicClient.waitForTransactionReceipt({ hash })

    return {
        txHash: hash,
        blockNumber: receipt.blockNumber.toString(),
        status: receipt.status,
    }
}

export async function refund(txId: string) {
    const contractAddress = getContractAddress();

    const hash = await relayerWalletClient.writeContract({
        address: contractAddress,
        abi: escrowVaultAbi,
        functionName: 'refund',
        args: [txId],
    })

    const receipt = await publicClient.waitForTransactionReceipt({ hash })

    return {
        txHash: hash,
        blockNumber: receipt.blockNumber.toString(),
        status: receipt.status,
    }
}

export async function getTransactionStatus(txId: string) {
    const contractAddress = getContractAddress();

    const statusCode = await publicClient.readContract({
        address: contractAddress,
        abi: escrowVaultAbi,
        functionName: 'getTransactionStatus',
        args: [txId],
    })

    const readableStatus = ContractToAppStatus[Number(statusCode)]

    return readableStatus
}