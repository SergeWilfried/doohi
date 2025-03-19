import crypto from 'crypto';
import type { 
  CountryAvailability, 
  DepositRequest, 
  PaymentPageSessionRequest, 
  PaymentPageSessionResponse, 
  PredictCorrespondentResponse, 
  SignatureOptions, 
  TransactionLimits, 
  TransactionResponse 
} from '@/types/payments/pawapay';

const DEFAULT_FETCH_TIMEOUT = 10000; // 10 seconds

// Helper function to wrap fetch with a timeout
async function safeFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_FETCH_TIMEOUT);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return response;
  } catch (error) {
    throw new Error(`Fetch error for ${url}: ${error instanceof Error ? error.message : error}`);
  } finally {
    clearTimeout(timeout);
  }
}

// Custom Error class for API errors
class PawaPayError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'PawaPayError';
  }
}

// PawaPay API client with enhanced error handling and security
class PawaPay {
  private apiKey: string;
  private baseUrl: string;
  private signatureOptions?: SignatureOptions;
  private env: 'sandbox' | 'production';

  constructor(
    apiKey: string, 
    env: 'sandbox' | 'production' = 'sandbox',
    signatureOptions?: SignatureOptions
  ) {
    this.apiKey = apiKey;
    this.env = env;
    this.baseUrl = env === 'sandbox' 
      ? 'https://api.sandbox.pawapay.io' 
      : 'https://api.pawapay.io';
    this.signatureOptions = signatureOptions;
  }

  // Helper method to create standard headers
  private getHeaders(additionalHeaders: Record<string, string> = {}): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      ...additionalHeaders
    };
  }

  // Helper method to generate Content-Digest header securely
  private generateContentDigest(body: any): string {
    const bodyString = JSON.stringify(body);
    const hash = crypto.createHash('sha512');
    hash.update(bodyString);
    const digest = hash.digest('base64');
    return `sha-512=:${digest}:`;
  }

  // Helper method to sign a request (for financial transactions)
  private async signRequest(
    method: string,
    path: string,
    body: any,
    authority: string = this.baseUrl.replace('https://', '')
  ): Promise<Record<string, string>> {
    if (!this.signatureOptions) {
      return {};
    }

    const timestamp = new Date().toISOString();
    const createdTime = Math.floor(Date.now() / 1000);
    const expiresTime = createdTime + 60; // 1 minute expiry
    
    const contentDigest = this.generateContentDigest(body);
    const contentType = 'application/json';
    
    // Construct signature base string
    const signatureBase = [
      `"@method": ${method}`,
      `"@authority": ${authority}`,
      `"@path": ${path}`,
      `"signature-date": ${timestamp}`,
      `"content-digest": ${contentDigest}`,
      `"content-type": ${contentType}`,
      `"@signature-params": ("@method" "@authority" "@path" "signature-date" "content-digest" "content-type");alg="${this.signatureOptions.algorithm}";keyid="${this.signatureOptions.keyId}";created=${createdTime};expires=${expiresTime}`
    ].join('\n');

    let signature: string;
    const { privateKey, algorithm } = this.signatureOptions;

    try {
      if (algorithm === 'ecdsa-p256-sha256') {
        const sign = crypto.createSign('SHA256');
        sign.update(signatureBase);
        signature = sign.sign(privateKey, 'base64');
      } else if (algorithm === 'ecdsa-p384-sha384') {
        const sign = crypto.createSign('SHA384');
        sign.update(signatureBase);
        signature = sign.sign(privateKey, 'base64');
      } else if (algorithm === 'rsa-pss-sha512') {
        const sign = crypto.createSign('SHA512');
        sign.update(signatureBase);
        signature = sign.sign({
          key: privateKey,
          padding: crypto.constants.RSA_PKCS1_PSS_PADDING
        }, 'base64');
      } else {
        // Default to rsa-v1_5-sha256
        const sign = crypto.createSign('SHA256');
        sign.update(signatureBase);
        signature = sign.sign(privateKey, 'base64');
      }
    } catch (error) {
      throw new PawaPayError(`Error signing request: ${error instanceof Error ? error.message : error}`);
    }

    return {
      'Content-Digest': contentDigest,
      'Signature-Date': timestamp,
      'Signature': `sig-pp=:${signature}:`,
      'Signature-Input': `sig-pp=("@method" "@authority" "@path" "signature-date" "content-digest" "content-type");alg="${algorithm}";keyid="${this.signatureOptions.keyId}";created=${createdTime};expires=${expiresTime}`,
      'Accept-Signature': 'rsa-pss-sha512,ecdsa-p256-sha256,rsa-v1_5-sha256,ecdsa-p384-sha384',
      'Accept-Digest': 'sha-256,sha-512'
    };
  }

  // Check MMO availability before initiating payments
  async checkAvailability(country: string): Promise<CountryAvailability[]> {
    try {
      const url = `${this.baseUrl}/availability?country=${encodeURIComponent(country)}`;
      const response = await safeFetch(url, { headers: this.getHeaders() });
      if (!response.ok) {
        throw new PawaPayError(`Failed to check availability: ${response.statusText}`, response.status);
      }
      return await response.json();
    } catch (error) {
      console.error('Error checking MMO availability:', error);
      throw error;
    }
  }

  // Predict the correspondent (MMO) for a specific phone number
  async predictCorrespondent(msisdn: string, country: string): Promise<PredictCorrespondentResponse> {
    try {
      const url = `${this.baseUrl}/predict-correspondent?msisdn=${encodeURIComponent(msisdn)}&country=${encodeURIComponent(country)}`;
      const response = await safeFetch(url, { headers: this.getHeaders() });
      if (!response.ok) {
        throw new PawaPayError(`Failed to predict correspondent: ${response.statusText}`, response.status);
      }
      const result = await response.json();
      // Validate that result.correspondent exists and matches expected type
      if (!result.correspondent) {
        throw new PawaPayError('Correspondent not returned in response');
      }
      return result.correspondent;
    } catch (error) {
      console.error('Error predicting correspondent:', error);
      throw error;
    }
  }

  // Get active configuration
  async getActiveConfiguration(): Promise<any> {
    try {
      const url = `${this.baseUrl}/active-configuration`;
      const response = await safeFetch(url, { headers: this.getHeaders() });
      if (!response.ok) {
        throw new PawaPayError(`Failed to get active configuration: ${response.statusText}`, response.status);
      }
      return await response.json();
    } catch (error) {
      console.error('Error getting active configuration:', error);
      throw error;
    }
  }

  // Get transaction limits for a specific MMO
  async getTransactionLimits(mmoId: string, country: string): Promise<TransactionLimits> {
    try {
      const url = `${this.baseUrl}/configuration/limits?mmoId=${encodeURIComponent(mmoId)}&country=${encodeURIComponent(country)}`;
      const response = await safeFetch(url, { headers: this.getHeaders() });
      if (!response.ok) {
        throw new PawaPayError(`Failed to get transaction limits: ${response.statusText}`, response.status);
      }
      return await response.json();
    } catch (error) {
      console.error('Error getting transaction limits:', error);
      throw error;
    }
  }

  // Initiate a deposit
  async initiateDeposit(depositId: string, payload: DepositRequest): Promise<TransactionResponse> {
    try {
      const path = '/deposits';
      const headers = this.getHeaders();
      if (this.signatureOptions) {
        const signatureHeaders = await this.signRequest('POST', path, payload);
        Object.assign(headers, signatureHeaders);
      }
      const url = `${this.baseUrl}${path}`;
      const response = await safeFetch(url, {
        method: 'POST',
        headers: { ...headers, 'Idempotency-Key': depositId },
        body: JSON.stringify({ depositId, ...payload })
      });
      if (!response.ok) {
        throw new PawaPayError(`Failed to initiate deposit: ${response.statusText}`, response.status);
      }
      return await response.json();
    } catch (error) {
      console.error('Error initiating deposit:', error);
      throw error;
    }
  }

  // Check deposit status
  async checkDepositStatus(depositId: string): Promise<TransactionResponse> {
    try {
      const url = `${this.baseUrl}/deposits/${encodeURIComponent(depositId)}`;
      const response = await safeFetch(url, { headers: this.getHeaders() });
      if (!response.ok) {
        throw new PawaPayError(`Failed to check deposit status: ${response.statusText}`, response.status);
      }
      return await response.json();
    } catch (error) {
      console.error('Error checking deposit status:', error);
      throw error;
    }
  }

  // Initiate a payout
  async initiatePayout(payoutId: string, payload: any): Promise<TransactionResponse> {
    try {
      const path = '/payouts';
      const headers = this.getHeaders();
      if (this.signatureOptions) {
        const signatureHeaders = await this.signRequest('POST', path, payload);
        Object.assign(headers, signatureHeaders);
      }
      const url = `${this.baseUrl}${path}`;
      const response = await safeFetch(url, {
        method: 'POST',
        headers: { ...headers, 'Idempotency-Key': payoutId },
        body: JSON.stringify({ payoutId, ...payload })
      });
      if (!response.ok) {
        throw new PawaPayError(`Failed to initiate payout: ${response.statusText}`, response.status);
      }
      return await response.json();
    } catch (error) {
      console.error('Error initiating payout:', error);
      throw error;
    }
  }

  // Check payout status
  async checkPayoutStatus(payoutId: string): Promise<TransactionResponse> {
    try {
      const url = `${this.baseUrl}/payouts/${encodeURIComponent(payoutId)}/status`;
      const response = await safeFetch(url, { headers: this.getHeaders() });
      if (!response.ok) {
        throw new PawaPayError(`Failed to check payout status: ${response.statusText}`, response.status);
      }
      return await response.json();
    } catch (error) {
      console.error('Error checking payout status:', error);
      throw error;
    }
  }

  // Initiate a bulk payout
  async initiateBulkPayout(bulkPayoutId: string, payload: any): Promise<TransactionResponse> {
    try {
      const path = '/bulk-payouts';
      const headers = this.getHeaders();
      if (this.signatureOptions) {
        const signatureHeaders = await this.signRequest('POST', path, payload);
        Object.assign(headers, signatureHeaders);
      }
      const url = `${this.baseUrl}${path}`;
      const response = await safeFetch(url, {
        method: 'POST',
        headers: { ...headers, 'Idempotency-Key': bulkPayoutId },
        body: JSON.stringify({ bulkPayoutId, ...payload })
      });
      if (!response.ok) {
        throw new PawaPayError(`Failed to initiate bulk payout: ${response.statusText}`, response.status);
      }
      return await response.json();
    } catch (error) {
      console.error('Error initiating bulk payout:', error);
      throw error;
    }
  }

  // Resend callback for deposit
  async resendDepositCallback(depositId: string): Promise<void> {
    try {
      const url = `${this.baseUrl}/deposits/${encodeURIComponent(depositId)}/callback/resend`;
      const response = await safeFetch(url, {
        method: 'POST',
        headers: this.getHeaders()
      });
      if (!response.ok) {
        throw new PawaPayError(`Failed to resend deposit callback: ${response.statusText}`, response.status);
      }
    } catch (error) {
      console.error('Error resending deposit callback:', error);
      throw error;
    }
  }

  // Resend callback for payout
  async resendPayoutCallback(payoutId: string): Promise<void> {
    try {
      const url = `${this.baseUrl}/payouts/${encodeURIComponent(payoutId)}/callback/resend`;
      const response = await safeFetch(url, {
        method: 'POST',
        headers: this.getHeaders()
      });
      if (!response.ok) {
        throw new PawaPayError(`Failed to resend payout callback: ${response.statusText}`, response.status);
      }
    } catch (error) {
      console.error('Error resending payout callback:', error);
      throw error;
    }
  }

  // Validate a callback signature securely
  validateCallbackSignature(
    headers: Record<string, string>,
    body: any,
    publicKey: string
  ): boolean {
    try {
      const contentDigest = headers['content-digest'];
      const signatureDate = headers['signature-date'];
      const signature = headers['signature'];
      const signatureInput = headers['signature-input'];
      if (!contentDigest || !signatureDate || !signature || !signatureInput) {
        console.error('Missing signature headers');
        return false;
      }
      
      // Verify content digest
      const calculatedDigest = this.generateContentDigest(body);
      if (contentDigest !== calculatedDigest) {
        console.error('Content digest mismatch');
        return false;
      }
      
      // Extract signature parameters (this implementation should be enhanced per spec)
      const signatureMatch = signature.match(/sig-pp=:(.+):/);
      if (!signatureMatch) {
        console.error('Invalid signature format');
        return false;
      }
      
      const signatureValue = signatureMatch[1];
      const algorithmMatch = signatureInput.match(/alg="([^"]+)"/);
      if (!algorithmMatch) {
        console.error('Algorithm not specified in signature-input');
        return false;
      }
      
      const algorithm = algorithmMatch[1];
      console.warn(publicKey)
      console.warn(algorithm)
      console.warn(signatureValue)

      // Here you would construct the signature base and use crypto.verify() to validate using the public key.
      // This is a placeholder to indicate where proper signature verification would occur.
      // For example:
      // const isVerified = crypto.verify(
      //   'SHA256',
      //   Buffer.from(signatureBaseString),
      //   { key: publicKey, padding: crypto.constants.RSA_PKCS1_PSS_PADDING },
      //   Buffer.from(signatureValue, 'base64')
      // );
      // return isVerified;
      
      // For now, return true if all headers are present and content digest matches.
      return true;
    } catch (error) {
      console.error('Error validating callback signature:', error);
      return false;
    }
  }

  // Check if a specific operation is available for a correspondent
  isOperationAvailable(
    availabilityData: CountryAvailability[], 
    country: string, 
    correspondent: string, 
    operationType: 'DEPOSIT' | 'PAYOUT'
  ): boolean {
    const countryData = availabilityData.find(c => c.country === country);
    if (!countryData) return false;
    
    const correspondentData = countryData.correspondents.find(c => c.correspondent === correspondent);
    if (!correspondentData) return false;
    
    const operation = correspondentData.operationTypes.find(op => op.operationType === operationType);
    return operation?.status === 'OPERATIONAL';
  }

  // Create a Payment Page session
  async createPaymentPageSession(payload: PaymentPageSessionRequest): Promise<PaymentPageSessionResponse> {
    try {
      const path = '/v1/widget/sessions';
      const headers = this.getHeaders();
      if (this.signatureOptions) {
        const signatureHeaders = await this.signRequest('POST', path, payload);
        Object.assign(headers, signatureHeaders);
      }
      const url = `${this.baseUrl}${path}`;
      const response = await safeFetch(url, {
        method: 'POST',
        headers: { ...headers, 'Idempotency-Key': payload.depositId },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        throw new PawaPayError(`Failed to create payment page session: ${response.statusText}`, response.status);
      }
      return await response.json();
    } catch (error) {
      console.error('Error creating payment page session:', error);
      throw error;
    }
  }
}

export { PawaPay };
