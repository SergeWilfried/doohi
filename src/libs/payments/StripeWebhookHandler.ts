// libs/stripeWebhookHandler.ts
import type { Stripe } from 'stripe';
import { stripe } from '@/libs/payments/stripe';
import { Env } from '@/libs/Env';
import { NextResponse } from 'next/server';

export async function handleStripeWebhook(req: Request): Promise<NextResponse> {
  let event: Stripe.Event;
  
  // Validate that the signature header is present
  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    console.error('❌ Missing stripe-signature header');
    return NextResponse.json(
      { message: 'Missing signature header' },
      { status: 400 }
    );
  }
  
  // Attempt to extract the raw body and verify the signature
  try {
    const rawBody = await (await req.blob()).text();
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      Env.STRIPE_WEBHOOK_SECRET as string
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error(`❌ Stripe signature verification failed: ${errorMessage}`);
    return NextResponse.json(
      { message: 'Webhook signature verification failed' },
      { status: 400 }
    );
  }
  
  console.info(`✅ Stripe event received: ${event.id}`);

  // Only process allowed events
  const permittedEvents: string[] = [
    'checkout.session.completed',
    'payment_intent.succeeded',
    'payment_intent.payment_failed',
  ];
  if (!permittedEvents.includes(event.type)) {
    console.warn(`Event type ${event.type} not permitted`);
    return NextResponse.json(
      { message: 'Event type not handled' },
      { status: 400 }
    );
  }
  
  // Process the event payload securely
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.info(`💰 Checkout session completed with payment status: ${session.payment_status}`);
        // TODO: Process the session (e.g., update DB, send notifications)
        break;
      }
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.error(`❌ Payment failed: ${paymentIntent.last_payment_error?.message}`);
        // TODO: Handle the failed payment logic
        break;
      }
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.info(`💰 Payment succeeded with status: ${paymentIntent.status}`);
        // TODO: Handle successful payment logic
        break;
      }
      default:
        // This should not happen due to our permittedEvents check
        throw new Error(`Unhandled event type: ${event.type}`);
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error(`❌ Error processing Stripe event: ${errorMessage}`);
    return NextResponse.json(
      { message: 'Error processing webhook event' },
      { status: 500 }
    );
  }
  
  return NextResponse.json({ message: 'Event processed' }, { status: 200 });
}
