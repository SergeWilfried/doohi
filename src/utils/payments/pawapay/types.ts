export type MMOAvailability = {
  mmoId: string;
  country: string;
  name: string;
  available: boolean;
  status: 'OPERATIONAL' | 'DEGRADED' | 'OUTAGE';
};

export type TransactionLimits = {
  mmoId: string;
  country: string;
  currency: string;
  minAmount: number;
  maxAmount: number;
};

export type TransactionStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export type TransactionResponse = {
  id: string;
  status: TransactionStatus;
  message?: string;
};
