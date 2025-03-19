export const decimalRules: Record<string, number | null> = {
  "MTN_MOMO_BEN": null,
  "MOOV_BEN": null,
  "MOOV_BFA": null,
  "ORANGE_BFA": null,
  "MTN_MOMO_CMR": null,
  "ORANGE_CMR": null,
  "MTN_MOMO_CIV": null,
  "ORANGE_CIV": null,
  "VODACOM_MPESA_COD_CDF": null,
  "VODACOM_MPESA_COD_USD": 2,
  "AIRTEL_COD_CDF": 2,
  "AIRTEL_COD_USD": 2,
  "ORANGE_COD_CDF": 2,
  "ORANGE_COD_USD": 2,
  "AIRTEL_GAB": 2,
  "MTN_MOMO_GHA": 2,
  "AIRTELTIGO_GHA": 2,
  "VODAFONE_GHA": 2,
  "MPESA_KEN": null, // Deposits: Not supported, Payouts: 2 (Handled separately)
  "AIRTEL_MWI": 2,
  "TNM_MWI": 2,
  "VODACOM_MOZ": 2,
  "AIRTEL_NGA": null,
  "MTN_MOMO_NGA": 2,
  "AIRTEL_COG": null,
  "MTN_MOMO_COG": null,
  "AIRTEL_RWA": null,
  "MTN_MOMO_RWA": null,
  "FREE_SEN": null,
  "ORANGE_SEN": null,
  "ORANGE_SLE": 2,
  "AIRTEL_TZA": 2,
  "VODACOM_TZA": 2,
  "TIGO_TZA": null,
  "HALOTEL_TZA": null,
  "AIRTEL_OAPI_UGA": null,
  "MTN_MOMO_UGA": 2,
  "AIRTEL_OAPI_ZMB": 2,
  "MTN_MOMO_ZMB": 2,
  "ZAMTEL_ZMB": 2
};


// Define interfaces for request and response types
export interface PaymentPageSessionRequest {
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

export enum PawaPayCorrespondent {
  MTN_MOMO_BEN = "MTN_MOMO_BEN",
  MOOV_BEN = "MOOV_BEN",
  MOOV_BFA = "MOOV_BFA",
  ORANGE_BFA = "ORANGE_BFA",
  MTN_MOMO_CMR = "MTN_MOMO_CMR",
  ORANGE_CMR = "ORANGE_CMR",
  MTN_MOMO_CIV = "MTN_MOMO_CIV",
  ORANGE_CIV = "ORANGE_CIV",
  VODACOM_MPESA_COD = "VODACOM_MPESA_COD",
  AIRTEL_COD = "AIRTEL_COD",
  ORANGE_COD = "ORANGE_COD",
  AIRTEL_GAB = "AIRTEL_GAB",
  MTN_MOMO_GHA = "MTN_MOMO_GHA",
  AIRTELTIGO_GHA = "AIRTELTIGO_GHA",
  VODAFONE_GHA = "VODAFONE_GHA",
  MPESA_KEN = "MPESA_KEN",
  AIRTEL_MWI = "AIRTEL_MWI",
  TNM_MWI = "TNM_MWI",
  VODACOM_MOZ = "VODACOM_MOZ",
  AIRTEL_NGA = "AIRTEL_NGA",
  MTN_MOMO_NGA = "MTN_MOMO_NGA",
  AIRTEL_COG = "AIRTEL_COG",
  MTN_MOMO_COG = "MTN_MOMO_COG",
  AIRTEL_RWA = "AIRTEL_RWA",
  MTN_MOMO_RWA = "MTN_MOMO_RWA",
  FREE_SEN = "FREE_SEN",
  ORANGE_SEN = "ORANGE_SEN",
  ORANGE_SLE = "ORANGE_SLE",
  AIRTEL_TZA = "AIRTEL_TZA",
  VODACOM_TZA = "VODACOM_TZA",
  TIGO_TZA = "TIGO_TZA",
  HALOTEL_TZA = "HALOTEL_TZA",
  AIRTEL_OAPI_UGA = "AIRTEL_OAPI_UGA",
  MTN_MOMO_UGA = "MTN_MOMO_UGA",
  AIRTEL_OAPI_ZMB = "AIRTEL_OAPI_ZMB",
  MTN_MOMO_ZMB = "MTN_MOMO_ZMB",
  ZAMTEL_ZMB = "ZAMTEL_ZMB",
}

export interface PredictCorrespondentResponse {
  country: string;
  operator: string;
  correspondent: PawaPayCorrespondent,
  msisdn: string;
}

export interface PaymentPageSessionResponse {
  redirectUrl: string;
}

export interface DepositRequest {
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

export interface TransactionResponse {
  transactionId: string;
  status: string;
  statusReason?: string;
  expectedSettlementTime?: string;
  // Add other fields as per the API response
}

export interface SignatureOptions {
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

export interface OperationStatus {
  operationType: 'DEPOSIT' | 'PAYOUT';
  status: 'OPERATIONAL' | 'DELAYED' | 'CLOSED';
}

export interface Correspondent {
  correspondent: string;
  operationTypes: OperationStatus[];
}

export interface CountryAvailability {
  country: string;
  correspondents: Correspondent[];
}
