import 'server-only';

import Stripe from 'stripe';

import { Env } from './Env';

export const stripe = new Stripe(Env.STRIPE_SECRET_KEY as string, {
  // https://github.com/stripe/stripe-node#configuration
  apiVersion: '2024-06-20',
  appInfo: {
    name: 'nextjs-with-stripe-typescript-demo',
    url: 'https://nextjs-with-stripe-typescript-demo.vercel.app',
  },
});
