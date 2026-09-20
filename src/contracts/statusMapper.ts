export enum ContractStatus {
  Pending = 0,
  Locked = 1,
  Completed = 2,
  Refunded = 3,
  Disputed = 4,
}

export type AppStatus = 'PENDING' | 'LOCKED' | 'COMPLETED' | 'REFUNDED' | 'DISPUTED'

export const ContractToAppStatus: Record<number, AppStatus> = {
  [ContractStatus.Pending]: 'PENDING',
  [ContractStatus.Locked]: 'LOCKED',
  [ContractStatus.Completed]: 'COMPLETED',
  [ContractStatus.Refunded]: 'REFUNDED',
  [ContractStatus.Disputed]: 'DISPUTED',
}

export const AppToContractStatus: Record<AppStatus, number> = {
  PENDING: ContractStatus.Pending,
  LOCKED: ContractStatus.Locked,
  COMPLETED: ContractStatus.Completed,
  REFUNDED: ContractStatus.Refunded,
  DISPUTED: ContractStatus.Disputed,
}