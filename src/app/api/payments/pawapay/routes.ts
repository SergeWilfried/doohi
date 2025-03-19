import { Env } from '@/libs/Env';
import { PawaPay } from '@/services/pawapay/pawapay';
import type { SignatureOptions } from '@/types/payments/Pawapay';
import { NextRequest, NextResponse } from 'next/server';

// Load config from environment variables
const getConfig = () => {
  const apiKey = Env.PAWAPAY_API_KEY;
  if (!apiKey) {
    throw new Error('PAWAPAY_API_KEY environment variable is not set');
  }
  
  const env = (Env.PAWAPAY_ENVIRONMENT || 'sandbox') as 'sandbox' | 'production';
  
  // Optional signature configuration
  let signatureOptions: SignatureOptions | undefined;
  
  const privateKey = Env.PAWAPAY_PRIVATE_KEY;
  const keyId = Env.PAWAPAY_KEY_ID;
  const algorithm = Env.PAWAPAY_SIGNATURE_ALGORITHM as SignatureOptions['algorithm'] || 'ecdsa-p256-sha256';
  
  if (privateKey && keyId) {
    signatureOptions = {
      privateKey,
      keyId,
      algorithm
    };
  }
  
  return { apiKey, env, signatureOptions };
};

// Create PawaPay client instance with proper error handling
let pawaPay: PawaPay;
try {
  const config = getConfig();
  pawaPay = new PawaPay(config.apiKey, config.env, config.signatureOptions);
} catch (error) {
  console.error('Failed to initialize PawaPay client:', error);
  // In a production application, we might want to handle this more gracefully
  pawaPay = new PawaPay('invalid-api-key', 'sandbox');
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const country = searchParams.get('country');
  const action = searchParams.get('action');

  if (!country) {
    return NextResponse.json({ error: 'Country parameter is required' }, { status: 400 });
  }

  try {
    // Handle different GET actions
    switch (action) {
      case 'predictCorrespondent': {
        const msisdn = searchParams.get('msisdn');
        if (!msisdn) {
          return NextResponse.json({ error: 'MSISDN parameter is required' }, { status: 400 });
        }
        const correspondent = await pawaPay.predictCorrespondent(msisdn, country);
        return NextResponse.json({ correspondent });
      }
      
      case 'configuration': {
        const config = await pawaPay.getActiveConfiguration();
        return NextResponse.json(config);
      }
      
      case 'limits': {
        const mmoId = searchParams.get('mmoId');
        if (!mmoId) {
          return NextResponse.json({ error: 'mmoId parameter is required' }, { status: 400 });
        }
        const limits = await pawaPay.getTransactionLimits(mmoId, country);
        return NextResponse.json(limits);
      }
      
      case 'depositStatus': {
        const depositId = searchParams.get('depositId');
        if (!depositId) {
          return NextResponse.json({ error: 'depositId parameter is required' }, { status: 400 });
        }
        const status = await pawaPay.checkDepositStatus(depositId);
        return NextResponse.json(status);
      }
      
      case 'payoutStatus': {
        const payoutId = searchParams.get('payoutId');
        if (!payoutId) {
          return NextResponse.json({ error: 'payoutId parameter is required' }, { status: 400 });
        }
        const status = await pawaPay.checkPayoutStatus(payoutId);
        return NextResponse.json(status);
      }
      
      // Default to availability check
      default:
        const availability = await pawaPay.checkAvailability(country);
        return NextResponse.json(availability);
    }
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process request' }, 
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = request.nextUrl.searchParams.get('action');
    
    switch (action) {
      case 'deposit': {
        const { depositId, ...payload } = body;
        
        if (!depositId) {
          return NextResponse.json(
            { error: 'depositId is required' }, 
            { status: 400 }
          );
        }
        
        // First check if the MMO is available (if correspondent is provided)
        if (payload.correspondent && payload.country) {
          const availability = await pawaPay.checkAvailability(payload.country);
          const mmo = availability.find(m => m.mmoId === payload.correspondent);
          
          if (mmo && !mmo.available) {
            return NextResponse.json(
              { error: `MMO ${mmo.name} is currently unavailable`, status: mmo.status }, 
              { status: 503 }
            );
          }
        }
        
        // Initiate the deposit
        const response = await pawaPay.initiateDeposit(depositId, payload);
        return NextResponse.json(response);
      }
      
      case 'payout': {
        const { payoutId, ...payload } = body;
        
        if (!payoutId) {
          return NextResponse.json(
            { error: 'payoutId is required' }, 
            { status: 400 }
          );
        }
        
        // First check if the MMO is available (if correspondent is provided)
        if (payload.correspondent && payload.country) {
          const availability = await pawaPay.checkAvailability(payload.country);
          const mmo = availability.find(m => m.mmoId === payload.correspondent);
          
          if (mmo && !mmo.available) {
            return NextResponse.json(
              { error: `MMO ${mmo.name} is currently unavailable`, status: mmo.status }, 
              { status: 503 }
            );
          }
        }
        
        // Initiate the payout
        const response = await pawaPay.initiatePayout(payoutId, payload);
        return NextResponse.json(response);
      }
      
      case 'bulkPayout': {
        const { bulkPayoutId, ...payload } = body;
        
        if (!bulkPayoutId) {
          return NextResponse.json(
            { error: 'bulkPayoutId is required' }, 
            { status: 400 }
          );
        }
        
        // Initiate the bulk payout
        const response = await pawaPay.initiateBulkPayout(bulkPayoutId, payload);
        return NextResponse.json(response);
      }
      
      case 'resendCallback': {
        const { type, id } = body;
        
        if (!type || !id) {
          return NextResponse.json(
            { error: 'type and id parameters are required' }, 
            { status: 400 }
          );
        }
        
        if (type === 'deposit') {
          await pawaPay.resendDepositCallback(id);
        } else if (type === 'payout') {
          await pawaPay.resendPayoutCallback(id);
        } else {
          return NextResponse.json(
            { error: 'Invalid type. Must be "deposit" or "payout"' }, 
            { status: 400 }
          );
        }
        
        return NextResponse.json({ success: true });
      }
      
      default: {
        return NextResponse.json(
          { error: 'Invalid action. Specify "action" in query parameters' }, 
          { status: 400 }
        );
      }
    }
  } catch (error: any) {
    console.error('API Error:', error);
    
    // Special handling for network errors to avoid discrepancies
    if (error.name === 'TypeError' || error.name === 'NetworkError') {
      return NextResponse.json(
        { 
          error: 'Network error occurred. Please check transaction status before retrying.',
          action: 'CHECK_STATUS'
        }, 
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to process request' }, 
      { status: 500 }
    );
  }
}

// This is a webhook handler for callbacks from PawaPay
// In src/libs/Env.ts

export const serverEnv = {
  PAWAPAY_PRIVATE_KEY: z.string().min(1),
  PAWAPAY_API_KEY: z.string().min(1),
  PAWAPAY_KEY_ID: z.string().min(1),
  PAWAPAY_SIGNATURE_ALGORITHM: z.string().min(1),
  PAWAPAY_ENVIRONMENT: z.string().min(1),
  PAWAPAY_PUBLIC_KEY: z.string().optional(),
}

export const runtimeEnv = {
  PAWAPAY_PRIVATE_KEY: process.env.PAWAPAY_PRIVATE_KEY,
  PAWAPAY_API_KEY: process.env.PAWAPAY_API_KEY,
  PAWAPAY_KEY_ID: process.env.PAWAPAY_KEY_ID,
  PAWAPAY_SIGNATURE_ALGORITHM: process.env.PAWAPAY_SIGNATURE_ALGORITHM,
  PAWAPAY_ENVIRONMENT: process.env.PAWAPAY_ENVIRONMENT,
  PAWAPAY_PUBLIC_KEY: process.env.PAWAPAY_PUBLIC_KEY,
}
