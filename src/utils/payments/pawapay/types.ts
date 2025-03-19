// Define interfaces for request and response types
interface PaymentPageSessionRequest {
  depositId: string;
  returnUrl: string;
  statementDescription?: string;
  amount?: string;
  msisdn?: string;
  language?: 'EN' | 'FR';
  country?: string;
  reason?: string;
  metadata?: Array<{
    fieldName: string;
    fieldValue: string;
    isPII?: boolean;
  }>;
}

interface PaymentPageSessionResponse {
  redirectUrl: string;
}

interface DepositRequest {
  amount: string;
  currency: string;
  country: string;
  msisdn: string;
  statementDescription?: string;
  metadata?: Array<{
    fieldName: string;
    fieldValue: string;
    isPII?: boolean;
  }>;
  reason?: string;
  correspondent?: string;
}

interface TransactionResponse {
  transactionId: string;
  status: string;
  statusReason?: string;
  expectedSettlementTime?: string;
  // Add other fields as per the API response
}

interface MMOAvailability {
  mmoId: string;
  name: string;
  status: 'AVAILABLE' | 'DEGRADED' | 'UNAVAILABLE';
  statusReason?: string;
}

interface SignatureOptions {
  keyId: string;
  privateKey: string;
  algorithm: 'rsa-v1_5-sha256' | 'rsa-pss-sha512' | 'ecdsa-p256-sha256' | 'ecdsa-p384-sha384';
}


export type TransactionLimits = {
  mmoId: string;
  country: string;
  currency: string;
  minAmount: number;
  maxAmount: number;
};

export type TransactionStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';


