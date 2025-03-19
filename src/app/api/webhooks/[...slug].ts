// pages/api/webhooks/[...slug].ts
import { handlePawapayWebhook } from '@/libs/PawapayWebhookHandler';
import { handleStripeWebhook } from '@/libs/stripeWebhookHandler';
import { NextApiRequest, NextApiResponse } from 'next';

export const config = {
  api: {
    bodyParser: false, // Disable automatic body parsing for raw payload access
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only process POST requests
  if (req.method !== 'POST') {
    console.error(`❌ Invalid method ${req.method} - Only POST allowed`);
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  // Extract provider from URL path
  const { slug } = req.query;
  if (!slug || !Array.isArray(slug) || slug.length === 0) {
    console.error('❌ No provider specified in URL');
    return res.status(400).json({ error: 'No provider specified' });
  }
  const provider = slug[0].toLowerCase();

  try {
    let response;
    switch (provider) {
      case 'stripe': {
        response = await handleStripeWebhook(req);
        break;
      }
      case 'pawapay': {
        response = await handlePawapayWebhook(req);
        break;
      }
      default: {
        console.error(`❌ Unknown webhook provider: ${provider}`);
        return res.status(400).json({ error: 'Unknown webhook provider' });
      }
    }
    
    // Return the response received from the provider handler
    const responseBody = await response.json();
    return res.status(response.status).json(responseBody);
  } catch (error) {
    console.error('❌ Error processing webhook:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
