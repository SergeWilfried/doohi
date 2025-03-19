import { NextRequest, NextResponse } from 'next/server';

// Load config from environment variables
const getConfig = () => {
  const apiKey = process.env.PAWAPAY_API_KEY;
  if (!apiKey) {
    throw new Error('PAWAPAY_API_KEY environment variable is not set');
  }
  
  const env = (process.env.PAWAPAY_ENVIRONMENT || 'sandbox') as 'sandbox' | 'production';
  
  // Optional signature configuration
  let signatureOptions: SignatureOptions | undefined;
  
  const privateKey = process.env.PAWAPAY_PRIVATE_KEY;
  const keyId = process.env.PAWAPAY_KEY_ID;
  const algorithm = process.env.PAWAPAY_SIGNATURE_ALGORITHM as SignatureOptions['algorithm'] || 'ecdsa-p256-sha256';
  
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
  // In a production application, you might want to handle this more gracefully
  pawaPay = new PawaPay('invalid-api-key', 'sandbox');
}

// Next.js API routes
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
export async function handleCallback(request: NextRequest) {
  try {
    const body = await request.json();
    const headers = Object.fromEntries(request.headers.entries());
    
    // Get public key from environment or config
    const publicKey = process.env.PAWAPAY_PUBLIC_KEY;
    
    // Validate signature if public key is available
    if (publicKey && !pawaPay.validateCallbackSignature(headers, body, publicKey)) {
      console.error('Invalid callback signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
    
    // Process the callback based on its type
    const isDeposit = 'depositId' in body;
    const isPayout = 'payoutId' in body;
    
    if (isDeposit) {
      // Process deposit callback
      console.log(`Received deposit callback for ${body.depositId}, status: ${body.status}`);
      // Here you would update your database or trigger other business logic
    } else if (isPayout) {
      // Process payout callback
      console.log(`Received payout callback for ${body.payoutId}, status: ${body.status}`);
      // Here you would update your database or trigger other business logic
    } else {
      console.warn('Unknown callback type', body);
    }
    
    // Always respond with 200 OK to acknowledge receipt
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing callback:', error);
    // Still return 200 to prevent PawaPay from retrying unnecessarily
    // You might want to log this error to your monitoring system
    return NextResponse.json({ received: true, error: 'Error processing callback' });
  }
}
