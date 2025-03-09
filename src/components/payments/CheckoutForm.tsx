/* eslint-disable tailwindcss/no-custom-classname */
'use client';

import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider,
} from '@stripe/react-stripe-js';
import React, { useState } from 'react';
import type Stripe from 'stripe';

import { createCheckoutSession } from '@/app/actions/stripe';
import getStripe from '@/utils/get-stripejs';
import { formatAmountForDisplay } from '@/utils/stripe-helpers';
import { AMOUNT_STEP, CURRENCY, MAX_AMOUNT, MIN_AMOUNT } from '@/utils/StripeConfig';

import { Button } from '../ui/button';
import { CustomDonationInput } from './CustomDonationInput';
import StripeTestCards from './StripeTestCards';

type CheckoutFormProps = {
  uiMode: Stripe.Checkout.SessionCreateParams.UiMode;
};

export default function CheckoutForm(props: CheckoutFormProps): JSX.Element {
  const [loading] = useState<boolean>(false);
  const [input, setInput] = useState<{ customDonation: number }>({
    customDonation: Math.round(MAX_AMOUNT / AMOUNT_STEP),
  });
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  const handleInputChange: React.ChangeEventHandler<HTMLInputElement> = (
    e,
  ): void =>
    setInput({
      ...input,
      [e.currentTarget.name]: e.currentTarget.value,
    });

  const formAction = async (data: FormData): Promise<void> => {
    const uiMode = data.get(
      'uiMode',
    ) as Stripe.Checkout.SessionCreateParams.UiMode;
    const { client_secret, url } = await createCheckoutSession(data);

    if (uiMode === 'embedded') {
      return setClientSecret(client_secret);
    }

    window.location.assign(url as string);
  };

  return (
    <>
      <form action={formAction}>
        <input type="hidden" name="uiMode" value={props.uiMode} />
        <CustomDonationInput
          className="checkout-style"
          name="customDonation"
          min={MIN_AMOUNT}
          max={MAX_AMOUNT}
          step={AMOUNT_STEP}
          currency={CURRENCY}
          onChange={handleInputChange}
          value={input.customDonation}
        />
        <StripeTestCards />
        <Button
          className="checkout-style-background"
          type="submit"
          disabled={loading}
        >
          Donate
          {' '}
          {formatAmountForDisplay(input.customDonation, CURRENCY)}
        </Button>
      </form>
      {clientSecret
        ? (
            <EmbeddedCheckoutProvider
              stripe={getStripe()}
              options={{ clientSecret }}
            >
              <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
          )
        : null}
    </>
  );
}
