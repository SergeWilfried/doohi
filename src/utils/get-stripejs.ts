/**
 * This is a singleton to ensure we only instantiate Stripe once.
 */
import type { Stripe } from '@stripe/stripe-js';
import { loadStripe } from '@stripe/stripe-js';

import { Env } from '@/libs/Env';

let stripePromise: Promise<Stripe | null>;

export default function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    stripePromise = loadStripe(
      Env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string,
    );
  }

  return stripePromise;
}
