// libs/pawapayWebhookHandler.ts
import type { NextApiRequest } from 'next';
import { Env } from '../Env';
import { PawaPay } from '@/services/pawapay/pawapay';
import { NextResponse } from 'next/server';

// Disable body parsing here too (if not already handled by the catch-all route)
export const config = {
  api: {
    bodyParser: false,
  },
};

const getRawBody = async (req: NextApiRequest): Promise<string> => {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk:any) => {
      data += chunk;
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
};

export async function handlePawapayWebhook(req: NextApiRequest): Promise<Response> {
  // Retrieve the raw body for signature verification
  let rawBody: string;
  try {
    rawBody = await getRawBody(req);
  } catch (error) {
    console.error('Error reading raw body:', error);
    return new Response(JSON.stringify({ error: 'Failed to read request body' }), { status: 500 });
  }
  
  // Get headers from request (ensuring proper casing)
  const headers = req.headers as Record<string, string>;
  
  // Instantiate your PawaPay class
  const pawapay = new PawaPay(
    Env.PAWAPAY_API_KEY as string,
    Env.NODE_ENV === 'production' ? 'production' : 'sandbox'
  );
  
  const publicKey = Env.PAWAPAY_PUBLIC_KEY as string;
  if (!publicKey) {
    console.error('Missing PawaPay public key');
    return new Response(JSON.stringify({ error: 'Server configuration error' }), { status: 500 });
  }
  
  // Validate the callback signature using your helper method
  if (!pawapay.validateCallbackSignature(headers, rawBody, publicKey)) {
    console.error('Invalid PawaPay callback signature');
    return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 400 });
  }
  
  // Parse the webhook event payload
  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch (error) {
    console.error('Error parsing webhook payload:', error);
    return new Response(JSON.stringify({ error: 'Invalid JSON payload' }), { status: 400 });
  }
  
  console.info('Received PawaPay webhook event:', event);
  
  // Process the event based on its type
  try {
    switch (event.type) {
      case 'deposit.completed': {
        // Handle deposit completed event (e.g., update order status)
        console.info('Deposit completed:', event.data);
        break;
      }
      case 'payout.completed': {
        // Handle payout completed event
        console.info('Payout completed:', event.data);
        break;
      }
      default:
        console.warn('Unhandled PawaPay event type:', event.type);
    }
  } catch (error) {
    console.error('Error processing PawaPay event:', error);
    return NextResponse.json({ error: 'Event processing error' }, { status: 500 });
  }
  
  // Acknowledge receipt of the event
  return NextResponse.json({ received: true }, { status: 200 });
}
