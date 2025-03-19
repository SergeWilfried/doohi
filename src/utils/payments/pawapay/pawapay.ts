import crypto from 'crypto';


// PawaPay API client with proper URL and signature support
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
    const headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      ...additionalHeaders
    };
    
    return headers;
  }

  // Helper method to generate Content-Digest header
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
    
    // Create signature base
    const signatureBase = [
      `"@method": ${method}`,
      `"@authority": ${authority}`,
      `"@path": ${path}`,
      `"signature-date": ${timestamp}`,
      `"content-digest": ${contentDigest}`,
      `"content-type": ${contentType}`,
      `"@signature-params": ("@method" "@authority" "@path" "signature-date" "content-digest" "content-type");alg="${this.signatureOptions.algorithm}";keyid="${this.signatureOptions.keyId}";created=${createdTime};expires=${expiresTime}`
    ].join('\n');

    // Sign the signature base
    let signature: string;
    const { privateKey, algorithm } = this.signatureOptions;

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
  async checkAvailability(country: string): Promise<MMOAvailability[]> {
    try {
      const response = await fetch(`${this.baseUrl}/availability?country=${country}`, {
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to check availability: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Error checking MMO availability:', error);
      throw error;
    }
  }

  // Predict the correspondent (MMO) for a specific phone number
  async predictCorrespondent(msisdn: string, country: string): Promise<string> {
    try {
      const response = await fetch(
        `${this.baseUrl}/predict-correspondent?msisdn=${msisdn}&country=${country}`, 
        { headers: this.getHeaders() }
      );

      if (!response.ok) {
        throw new Error(`Failed to predict correspondent: ${response.statusText}`);
      }

      const result = await response.json();
      return result.correspondent;
    } catch (error) {
      console.error('Error predicting correspondent:', error);
      throw error;
    }
  }

  // Get active configuration
  async getActiveConfiguration(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/active-configuration`, {
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to get active configuration: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Error getting active configuration:', error);
      throw error;
    }
  }

  // Get transaction limits for a specific MMO
  async getTransactionLimits(mmoId: string, country: string): Promise<TransactionLimits> {
    try {
      const response = await fetch(
        `${this.baseUrl}/configuration/limits?mmoId=${mmoId}&country=${country}`, 
        { headers: this.getHeaders() }
      );

      if (!response.ok) {
        throw new Error(`Failed to get transaction limits: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Error getting transaction limits:', error);
      throw error;
    }
  }

  // Initiate a deposit
  async initiateDeposit(depositId: string, payload: any): Promise<TransactionResponse> {
    try {
      const path = '/deposits';
      const headers = this.getHeaders();
      
      // Add signature headers if signature options are configured
      if (this.signatureOptions) {
        const signatureHeaders = await this.signRequest('POST', path, payload);
        Object.assign(headers, signatureHeaders);
      }

      const response = await fetch(`${this.baseUrl}${path}`, {
        method: 'POST',
        headers: {
          ...headers,
          'Idempotency-Key': depositId
        },
        body: JSON.stringify({
          depositId,
          ...payload
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to initiate deposit: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Error initiating deposit:', error);
      throw error;
    }
  }

  // Check deposit status
  async checkDepositStatus(depositId: string): Promise<TransactionResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/deposits/${depositId}/status`, {
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to check deposit status: ${response.statusText}`);
      }

      return response.json();
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
      
      // Add signature headers if signature options are configured
      if (this.signatureOptions) {
        const signatureHeaders = await this.signRequest('POST', path, payload);
        Object.assign(headers, signatureHeaders);
      }

      const response = await fetch(`${this.baseUrl}${path}`, {
        method: 'POST',
        headers: {
          ...headers,
          'Idempotency-Key': payoutId
        },
        body: JSON.stringify({
          payoutId,
          ...payload
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to initiate payout: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Error initiating payout:', error);
      throw error;
    }
  }

  // Check payout status
  async checkPayoutStatus(payoutId: string): Promise<TransactionResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/payouts/${payoutId}/status`, {
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to check payout status: ${response.statusText}`);
      }

      return response.json();
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
      
      // Add signature headers if signature options are configured
      if (this.signatureOptions) {
        const signatureHeaders = await this.signRequest('POST', path, payload);
        Object.assign(headers, signatureHeaders);
      }

      const response = await fetch(`${this.baseUrl}${path}`, {
        method: 'POST',
        headers: {
          ...headers,
          'Idempotency-Key': bulkPayoutId
        },
        body: JSON.stringify({
          bulkPayoutId,
          ...payload
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to initiate bulk payout: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Error initiating bulk payout:', error);
      throw error;
    }
  }

  // Resend callback for deposit
  async resendDepositCallback(depositId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/deposits/${depositId}/callback/resend`, {
        method: 'POST',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to resend deposit callback: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error resending deposit callback:', error);
      throw error;
    }
  }

  // Resend callback for payout
  async resendPayoutCallback(payoutId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/payouts/${payoutId}/callback/resend`, {
        method: 'POST',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to resend payout callback: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error resending payout callback:', error);
      throw error;
    }
  }

  // Validate a callback signature
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
        return false;
      }
      
      // Verify content digest
      const calculatedDigest = this.generateContentDigest(body);
      if (contentDigest !== calculatedDigest) {
        return false;
      }
      
      // Extract signature parameters
      const signatureMatch = signature.match(/sig-pp=:(.+):/);
      if (!signatureMatch) {
        return false;
      }
      
      const signatureValue = signatureMatch[1];
      
      // Extract algorithm from signature input
      const algorithmMatch = signatureInput.match(/alg="([^"]+)"/);
      if (!algorithmMatch) {
        return false;
      }
      
      const algorithm = algorithmMatch[1];
      
      // Create signature base from signature input parameters
      // This is a simplified implementation - in a real scenario you would need
      // to parse the signature-input header to get all components
      
      // For demonstration purposes only - you would need to implement proper parsing
      // of the signature base according to the signature input
      
      return true; // This is a placeholder - actual implementation would verify the signature
    } catch (error) {
      console.error('Error validating callback signature:', error);
      return false;
    }
  }

  // Create a Payment Page session
async createPaymentPageSession(payload: {
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
}): Promise<{ redirectUrl: string }> {
  try {
    const path = '/v1/widget/sessions';
    const headers = this.getHeaders();

    // Add signature headers if signature options are configured
    if (this.signatureOptions) {
      const signatureHeaders = await this.signRequest('POST', path, payload);
      Object.assign(headers, signatureHeaders);
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: {
        ...headers,
        'Idempotency-Key': payload.depositId
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Failed to create payment page session: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error('Error creating payment page session:', error);
    throw error;
  }
}
  // Check deposit status
async checkDepositStatus(depositId: string): Promise<any> {
  try {
    const response = await fetch(`${this.baseUrl}/deposits/${depositId}`, {
      headers: this.getHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to check deposit status: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error('Error checking deposit status:', error);
    throw error;
  }
}
}
