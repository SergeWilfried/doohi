import { createClient } from '@supabase/supabase-js';
import { RateLimit } from 'express-rate-limit';
import { DatabaseError } from 'pg';
import type Stripe from 'stripe';
import type { Database, Tables, TablesInsert } from 'types_db';

import { Env } from '@/libs/Env';
import { stripe } from '@/utils/stripe/config';

// Define types for your crowdfunding app
type Project = Tables<'projects'>;
type Donation = TablesInsert<'donations'>;
type RecurringDonation = TablesInsert<'recurring_donations'>;
type Donor = Tables<'donors'>;

/**
 * Type definitions for donation processing responses
 */
export type DonationResponse = {
  donationId: string;
  clientSecret?: string;
};

/**
 * Type definitions for webhook handlers
 */
export type WebhookHandlers = {
  handlePaymentIntentSucceeded: (paymentIntent: Stripe.PaymentIntent) => Promise<void>;
  handleInvoicePaid: (invoice: Stripe.Invoice) => Promise<void>;
  handleSubscriptionUpdated: (subscription: Stripe.Subscription) => Promise<void>;
};

// Configuration
const DEFAULT_CURRENCY = 'usd';
const DEFAULT_PAYMENT_METHODS = ['card'];

// Database client
const supabaseAdmin = createClient<Database>(
  Env.NEXT_PUBLIC_SUPABASE_URL ?? throwError('Missing SUPABASE_URL'),
  Env.SUPABASE_SERVICE_ROLE_KEY ?? throwError('Missing SERVICE_ROLE_KEY'),
);

/**
 * Error handling wrapper for Supabase operations
 */
async function safeDbOperation<T>(
  operation: () => PromiseLike<{ data: T | null; error: any }>,
  errorMessage: string,
): Promise<T> {
  const result = await operation();
  if (result.error) {
    throw new Error(errorMessage);
  }
  return result.data as T;
}

/**
 * Project service for managing project-related operations
 * @type {object}
 */
export const projectService = {
  /**
   * Retrieve a project by its ID
   * @param {string} projectId - The ID of the project to retrieve
   * @returns {Promise<Project>} The project data
   */
  async getById(projectId: string): Promise<Project> {
    return safeDbOperation(
      () => supabaseAdmin.from('projects').select('*').eq('id', projectId).single(),
      `Failed to retrieve project ${projectId}`,
    );
  },

  /**
   * Update the funding amount for a project
   * @param {string} projectId - The ID of the project to update
   * @param {number} amount - The amount to add to the project's funding
   * @returns {Promise<void>}
   */
  async updateFundingAmount(projectId: string, amount: number): Promise<void> {
    await safeDbOperation(
      () => supabaseAdmin.from('projects')
        .update({
          total_raised: supabaseAdmin.rpc('increment_funding', { amount, project_id: projectId }),
        })
        .eq('id', projectId),
      `Failed to update funding amount for project ${projectId}`,
    );
  },
};

/**
 * Donor service for managing donor-related operations
 * @type {object}
 */
export const donorService = {
  /**
   * Create a new donor or retrieve an existing one
   * @param {object} params - The donor parameters
   * @param {string} params.email - The donor's email address
   * @param {string} [params.userId] - Optional user ID for the donor
   * @param {string} [params.name] - Optional name for the donor
   * @returns {Promise<Donor>} The donor data
   */
  async createOrRetrieveDonor({
    email,
    userId,
    name,
  }: {
    email: string;
    userId?: string;
    name?: string;
  }): Promise<Donor> {
    try {
      // Check if donor exists in Supabase by email
      const { data: existingDonor } = await supabaseAdmin
        .from('donors')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      // If donor exists, get or create Stripe customer
      if (existingDonor) {
        // If Stripe customer ID exists, retrieve it, otherwise create new
        const stripeCustomerId = existingDonor.stripe_customer_id
          || await this.createStripeCustomer(existingDonor.id, email, name);

        // If we needed to create a new Stripe customer, update the donor record
        if (!existingDonor.stripe_customer_id) {
          await this.updateStripeCustomerId(existingDonor.id, stripeCustomerId);
        }

        return existingDonor;
      }

      // If donor doesn't exist, create both donor and Stripe customer
      const donorId = userId || crypto.randomUUID();
      const stripeCustomerId = await this.createStripeCustomer(donorId, email, name);

      // Create donor record
      const newDonor = await safeDbOperation(
        () => supabaseAdmin.from('donors').insert([{
          id: donorId,
          email,
          name: name || email.split('@')[0],
          stripe_customer_id: stripeCustomerId,
        }]),
        `Donor creation failed for ${email}`,
      );

      return newDonor;
    } catch (error) {
      if (error instanceof Error) {
        throw new TypeError(`Donor processing failed: ${error.message}`);
      }
      throw error;
    }
  },

  /**
   * Create a new Stripe customer for a donor
   * @param {string} donorId - The ID of the donor
   * @param {string} email - The donor's email address
   * @param {string} [name] - Optional name for the donor
   * @returns {Promise<string>} The Stripe customer ID
   */
  async createStripeCustomer(donorId: string, email: string, name?: string): Promise<string> {
    const customerData = {
      metadata: { donorId },
      email,
      name: name || undefined,
    };

    const newCustomer = await stripe.customers.create(customerData);
    if (!newCustomer) {
      throw new Error('Stripe customer creation failed.');
    }
    return newCustomer.id;
  },

  /**
   * Update a donor's Stripe customer ID
   * @param {string} donorId - The ID of the donor
   * @param {string} stripeCustomerId - The Stripe customer ID
   * @returns {Promise<void>}
   */
  async updateStripeCustomerId(donorId: string, stripeCustomerId: string): Promise<void> {
    await safeDbOperation(
      () => supabaseAdmin.from('donors')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('id', donorId),
      `Failed to update Stripe customer ID for donor ${donorId}`,
    );
  },
};

/**
 * Donation service for managing one-time donation operations
 * @type {object}
 */
export const donationService = {
  /**
   * Record a one-time donation
   * @param {object} params - The donation parameters
   * @returns {Promise<string>} The donation ID
   */
  async recordOneTimeDonation(params: {
    projectId: string;
    donorId: string;
    amount: number;
    paymentIntentId: string;
    currency?: string;
    message?: string | null;
    isAnonymous?: boolean;
  }): Promise<string> {
    // Create donation record
    const donation: Donation = {
      id: crypto.randomUUID(),
      project_id: params.projectId,
      donor_id: params.donorId,
      amount: params.amount,
      currency: params.currency || DEFAULT_CURRENCY,
      payment_intent_id: params.paymentIntentId,
      message: params.message,
      is_anonymous: params.isAnonymous || false,
      created_at: new Date().toISOString(),
    };

    await safeDbOperation(
      () => supabaseAdmin.from('donations').insert([donation]).select().single(),
      `Failed to record donation for project ${params.projectId}`,
    );

    // Update project funding total
    await projectService.updateFundingAmount(params.projectId, params.amount);

    return donation.id;
  },

  /**
   * Create a payment intent for a one-time donation
   * @param {object} params - The payment intent parameters
   * @returns {Promise<Stripe.PaymentIntent>} The Stripe payment intent
   */
  async createOneTimePaymentIntent(params: {
    projectId: string;
    stripeCustomerId: string;
    amount: number;
    currency?: string;
    paymentMethods?: string[];
  }): Promise<Stripe.PaymentIntent> {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: params.amount * 100, // Convert to cents
      currency: params.currency || DEFAULT_CURRENCY,
      customer: params.stripeCustomerId,
      payment_method_types: params.paymentMethods || DEFAULT_PAYMENT_METHODS,
      metadata: { projectId: params.projectId },
      confirm: false,
    });

    return paymentIntent;
  },
};

/**
 * Service for managing recurring donation operations
 * @type {object}
 */
export const recurringDonationService = {
  /**
   * Create a new recurring donation
   * @param {object} params - The recurring donation parameters
   * @returns {Promise<string>} The recurring donation ID
   */
  async createRecurringDonation(params: {
    projectId: string;
    donorId: string;
    amount: number;
    subscriptionId: string;
    currency?: string;
    message?: string | null;
    isAnonymous?: boolean;
    frequency?: 'week' | 'month' | 'year';
  }): Promise<string> {
    // Create recurring donation record
    const recurringDonation: RecurringDonation = {
      id: crypto.randomUUID(),
      project_id: params.projectId,
      donor_id: params.donorId,
      amount: params.amount,
      currency: params.currency || DEFAULT_CURRENCY,
      subscription_id: params.subscriptionId,
      message: params.message,
      is_anonymous: params.isAnonymous || false,
      frequency: params.frequency || 'month',
      status: 'active',
      created_at: new Date().toISOString(),
    };

    await safeDbOperation(
      () => supabaseAdmin.from('recurring_donations').insert([recurringDonation]),
      `Failed to create recurring donation for project ${params.projectId}`,
    );

    // Record first payment as a one-time donation
    await donationService.recordOneTimeDonation({
      projectId: params.projectId,
      donorId: params.donorId,
      amount: params.amount,
      paymentIntentId: `sub_first_payment_${params.subscriptionId}`,
      currency: params.currency,
      message: params.message,
      isAnonymous: params.isAnonymous,
    });

    return recurringDonation.id;
  },

  /**
   * Create a subscription for recurring donations
   * @param {object} params - The subscription parameters
   * @returns {Promise<Stripe.Subscription>} The Stripe subscription
   */
  async createSubscription(params: {
    projectId: string;
    stripeCustomerId: string;
    amount: number;
    currency?: string;
    interval?: 'week' | 'month' | 'year';
    paymentMethodId: string;
  }): Promise<Stripe.Subscription> {
    // Create a subscription
    const subscription = await stripe.subscriptions.create({
      customer: params.stripeCustomerId,
      items: [
        {
          price_data: {
            currency: params.currency || DEFAULT_CURRENCY,
            product_data: {
              name: `${params.interval || 'month'}ly donation to project ${params.projectId}`,
              metadata: { projectId: params.projectId },
            },
            unit_amount: params.amount * 100, // Convert to cents
            recurring: {
              interval: params.interval || 'month',
            },
          },
        },
      ],
      default_payment_method: params.paymentMethodId,
      metadata: { projectId: params.projectId },
      expand: ['latest_invoice.payment_intent'],
    });

    return subscription;
  },

  /**
   * Update the status of a recurring donation
   * @param {string} subscriptionId - The Stripe subscription ID
   * @param {'active' | 'paused' | 'canceled'} status - The new status
   * @returns {Promise<void>}
   */
  async updateRecurringDonationStatus(
    subscriptionId: string,
    status: 'active' | 'paused' | 'canceled',
  ): Promise<void> {
    await safeDbOperation(
      () => supabaseAdmin.from('recurring_donations')
        .update({ status })
        .eq('subscription_id', subscriptionId),
      `Failed to update recurring donation status for subscription ${subscriptionId}`,
    );
  },

  /**
   * Handle subscription updates from Stripe
   * @param {Stripe.Subscription} subscription - The updated subscription
   * @returns {Promise<void>}
   */
  async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
    const status = subscription.status === 'active'
      ? 'active'
      : subscription.status === 'canceled' ? 'canceled' : 'paused';

    await this.updateRecurringDonationStatus(subscription.id, status);
  },

  /**
   * Process a recurring payment
   * @param {string} subscriptionId - The Stripe subscription ID
   * @param {string} invoiceId - The Stripe invoice ID
   * @param {string} paymentIntentId - The Stripe payment intent ID
   * @param {number} amount - The payment amount
   * @returns {Promise<void>}
   */
  async processRecurringPayment(
    subscriptionId: string,
    invoiceId: string,
    paymentIntentId: string,
    amount: number,
  ): Promise<void> {
    // Find the recurring donation
    const { data: recurringDonation } = await supabaseAdmin
      .from('recurring_donations')
      .select('*')
      .eq('subscription_id', subscriptionId)
      .single();

    if (!recurringDonation) {
      throw new Error(`Recurring donation not found for subscription ${subscriptionId}`);
    }

    // Record the payment
    await donationService.recordOneTimeDonation({
      projectId: recurringDonation.project_id,
      donorId: recurringDonation.donor_id,
      amount,
      paymentIntentId,
      currency: recurringDonation.currency,
      message: recurringDonation.message,
      isAnonymous: recurringDonation.is_anonymous,
    });

    // Update the last payment date
    await safeDbOperation(
      () => supabaseAdmin.from('recurring_donations')
        .update({ last_payment_at: new Date().toISOString() })
        .eq('id', recurringDonation.id),
      `Failed to update last payment date for recurring donation ${recurringDonation.id}`,
    );
  },
};

/**
 * Process a donation for a project, handling both one-time and recurring donations.
 *
 * @param {object} params - The donation parameters
 * @param {string} params.projectId - The ID of the project receiving the donation
 * @param {string} params.email - The donor's email address
 * @param {number} params.amount - The donation amount
 * @param {string} [params.currency] - The currency of the donation
 * @param {boolean} [params.isRecurring] - Whether this is a recurring donation
 * @param {string} [params.userId] - Optional user ID for the donor
 * @param {string} [params.name] - Optional name for the donor
 * @param {string|null} [params.message] - Optional message with the donation
 * @param {boolean} [params.isAnonymous] - Whether the donation is anonymous
 * @param {string} params.paymentMethodId - The Stripe payment method ID
 * @param {'week'|'month'|'year'} [params.frequency] - Frequency for recurring donations
 *
 * @returns {Promise<DonationResponse>} The donation ID and client secret
 * @throws {Error} If donation processing fails
 */
export const processDonation = async ({
  projectId,
  email,
  amount,
  currency = DEFAULT_CURRENCY,
  isRecurring = false,
  userId = undefined,
  name = undefined,
  message = null,
  isAnonymous = false,
  paymentMethodId,
  frequency = 'month',
}: {
  projectId: string;
  email: string;
  amount: number;
  currency?: string;
  isRecurring?: boolean;
  userId?: string;
  name?: string;
  message?: string | null;
  isAnonymous?: boolean;
  paymentMethodId: string;
  frequency?: 'week' | 'month' | 'year';
}): Promise<DonationResponse> => {
  try {
    // Ensure project exists
    await projectService.getById(projectId);

    // Create or retrieve donor
    const { donorId, stripeCustomerId } = await donorService.createOrRetrieveDonor({
      email,
      userId,
      name,
    });

    // Attach payment method to customer if provided
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: stripeCustomerId,
    });

    // Set payment method as default for the customer
    await stripe.customers.update(stripeCustomerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    let paymentIntentId: string | null = null;
    let subscriptionId: string | null = null;

    // Handle one-time vs recurring donation
    if (isRecurring) {
      // Create a subscription
      const subscription = await stripe.subscriptions.create({
        customer: stripeCustomerId,
        items: [{
          price_data: {
            currency,
            product_data: {
              name: `Donation to Project ${projectId}`,
            },
            unit_amount: amount * 100, // Convert to cents
            recurring: {
              interval: frequency,
            },
          },
        }],
        payment_behavior: 'default_incomplete',
        payment_settings: {
          payment_method_types: ['card'],
          save_default_payment_method: 'on_subscription',
        },
        expand: ['latest_invoice.payment_intent'],
      });

      subscriptionId = subscription.id;
      paymentIntentId = subscription.latest_invoice?.payment_intent?.id || null;
    } else {
      // Create a payment intent for one-time donation
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount * 100, // Convert to cents
        currency,
        customer: stripeCustomerId,
        payment_method: paymentMethodId,
        off_session: true,
        confirm: true,
        description: `Donation to Project ${projectId}`,
      });

      paymentIntentId = paymentIntent.id;
    }

    // Add proper null checking for payment processing
    if (!paymentIntentId && !subscriptionId) {
      throw new Error('Neither payment intent nor subscription was created');
    }

    // Create donation record in database
    const donationData = {
      projectId,
      donorId,
      amount,
      currency,
      isRecurring,
      message,
      isAnonymous,
      paymentIntentId: paymentIntentId!,
      stripeSubscriptionId: subscriptionId,
      frequency: isRecurring ? frequency : null,
      status: 'pending',
    };

    const donation = await donationService.recordOneTimeDonation(donationData);

    // Return donation ID and client secret if applicable
    let clientSecret = null;
    if (isRecurring) {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId as string, {
        expand: ['latest_invoice.payment_intent'],
      });
      clientSecret = subscription.latest_invoice?.payment_intent?.client_secret || null;
    } else {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId as string);
      clientSecret = paymentIntent.client_secret;
    }

    return {
      donationId: donation,
      clientSecret: clientSecret || undefined,
    };
  } catch (error) {
    if (error instanceof Stripe.errors.StripeError) {
      throw new TypeError(`Payment processing failed: ${error.message}`);
    } else if (error instanceof DatabaseError) {
      throw new TypeError(`Database operation failed: ${error.message}`);
    }
    throw new Error(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Webhook handlers for processing Stripe events
 * @type {WebhookHandlers}
 */
export const webhookHandlers: WebhookHandlers = {
  /**
   * Handle successful payment intent events
   * @param {Stripe.PaymentIntent} paymentIntent - The successful payment intent
   * @returns {Promise<void>}
   */
  handlePaymentIntentSucceeded: async (paymentIntent: Stripe.PaymentIntent): Promise<void> => {
    const projectId = paymentIntent.metadata.projectId!;

    // Check if this is a one-time donation (not associated with a subscription)
    if (!paymentIntent.invoice) {
      // For one-time payments, we need to find the donor from the customer
      const { data: donor } = await supabaseAdmin
        .from('donors')
        .select('*')
        .eq('stripe_customer_id', paymentIntent.customer)
        .single();

      if (!donor) {
        throw new Error(`Donor not found for customer ${paymentIntent.customer}`);
      }

      // Record the donation
      await donationService.recordOneTimeDonation({
        projectId,
        donorId: donor.id,
        amount: paymentIntent.amount,
        paymentIntentId: paymentIntent.id,
        currency: paymentIntent.currency,
      });
    }
    // If it has an invoice, it's part of a subscription and handled by the invoice.paid event
  },

  /**
   * Handle paid invoice events
   * @param {Stripe.Invoice} invoice - The paid invoice
   * @returns {Promise<void>}
   */
  handleInvoicePaid: async (invoice: Stripe.Invoice): Promise<void> => {
    if (!invoice.subscription || !invoice.payment_intent) {
      return;
    }

    await recurringDonationService.processRecurringPayment(
      invoice.subscription as string,
      invoice.id,
      invoice.payment_intent as string,
      invoice.amount_paid,
    );
  },

  /**
   * Handle subscription update events
   * @param {Stripe.Subscription} subscription - The updated subscription
   * @returns {Promise<void>}
   */
  handleSubscriptionUpdated: async (subscription: Stripe.Subscription): Promise<void> => {
    await recurringDonationService.handleSubscriptionUpdated(subscription);
  },
};

// Add validation for donation amounts
export const validateDonationAmount = (amount: number, currency: string) => {
  const minAmount = currency === 'JPY' ? 100 : 1;
  const maxAmount = currency === 'JPY' ? 999999 : 999999;
  if (amount < minAmount || amount > maxAmount) {
    throw new Error(`Invalid donation amount for ${currency}`);
  }
};

// Add rate limiting
export const rateLimiter = new RateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

// Add retry logic for critical operations
export const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delay = 1000,
): Promise<T> => {
  let lastError = new Error('Operation failed');
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error occurred');
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * 2 ** i));
      }
    }
  }
  throw new Error(lastError.message);
};
