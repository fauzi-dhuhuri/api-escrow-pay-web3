export const escrowVaultAbi = [
    { type: "constructor", inputs: [], stateMutability: "nonpayable" },
    {
        type: "function",
        name: "arbiter",
        inputs: [],
        outputs: [{ name: "", type: "address", internalType: "address" }],
        stateMutability: "view",
    },
    {
        type: "function",
        name: "getTransactionStatus",
        inputs: [{ name: "_txId", type: "string", internalType: "string" }],
        outputs: [
            {
                name: "",
                type: "uint8",
                internalType: "enum EscrowVault.TransactionStatus",
            },
        ],
        stateMutability: "view",
    },
    {
        type: "function",
        name: "lockFunds",
        inputs: [
            { name: "_txId", type: "string", internalType: "string" },
            { name: "_fiatAmount", type: "uint256", internalType: "uint256" },
        ],
        outputs: [],
        stateMutability: "nonpayable",
    },
    {
        type: "function",
        name: "refund",
        inputs: [{ name: "_txId", type: "string", internalType: "string" }],
        outputs: [],
        stateMutability: "nonpayable",
    },
    {
        type: "function",
        name: "releaseFunds",
        inputs: [{ name: "_txId", type: "string", internalType: "string" }],
        outputs: [],
        stateMutability: "nonpayable",
    },
    {
        type: "function",
        name: "transactions",
        inputs: [{ name: "", type: "string", internalType: "string" }],
        outputs: [
            { name: "transactionId", type: "string", internalType: "string" },
            { name: "amount", type: "uint256", internalType: "uint256" },
            {
                name: "status",
                type: "uint8",
                internalType: "enum EscrowVault.TransactionStatus",
            },
            { name: "createdAt", type: "uint256", internalType: "uint256" },
            { name: "updatedAt", type: "uint256", internalType: "uint256" },
        ],
        stateMutability: "view",
    },
    {
        type: "event",
        name: "FundsLocked",
        inputs: [
            {
                name: "transactionId",
                type: "string",
                indexed: true,
                internalType: "string",
            },
            {
                name: "status",
                type: "uint8",
                indexed: true,
                internalType: "enum EscrowVault.TransactionStatus",
            },
            {
                name: "amount",
                type: "uint256",
                indexed: false,
                internalType: "uint256",
            },
        ],
        anonymous: false,
    },
    {
        type: "event",
        name: "FundsRefunded",
        inputs: [
            {
                name: "transactionId",
                type: "string",
                indexed: true,
                internalType: "string",
            },
            {
                name: "status",
                type: "uint8",
                indexed: true,
                internalType: "enum EscrowVault.TransactionStatus",
            },
            {
                name: "amount",
                type: "uint256",
                indexed: false,
                internalType: "uint256",
            },
        ],
        anonymous: false,
    },
    {
        type: "event",
        name: "FundsReleased",
        inputs: [
            {
                name: "transactionId",
                type: "string",
                indexed: true,
                internalType: "string",
            },
            {
                name: "status",
                type: "uint8",
                indexed: true,
                internalType: "enum EscrowVault.TransactionStatus",
            },
            {
                name: "amount",
                type: "uint256",
                indexed: false,
                internalType: "uint256",
            },
        ],
        anonymous: false,
    },
] as const
