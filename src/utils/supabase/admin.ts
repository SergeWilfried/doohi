import { Env } from '@/libs/Env';
import { stripe } from '@/utils/stripe/config';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import type { Database, Tables, TablesInsert } from 'types_db';

// Define types for your crowdfunding app
type Project = Tables<'projects'>;
type Donation = TablesInsert<'donations'>;
type RecurringDonation = TablesInsert<'recurring_donations'>;
type Donor = Tables<'donors'>;

// Configuration
const DEFAULT_CURRENCY = 'usd';
const DEFAULT_PAYMENT_METHODS = ['card'];

// Database client
const supabaseAdmin = createClient<Database>(
  Env.NEXT_PUBLIC_SUPABASE_URL || '',
  Env.SUPABASE_SERVICE_ROLE_KEY || ''
);

/**
 * Error handling wrapper for Supabase operations
 */
async function safeDbOperation<T>(
  operation: () => Promise<{ data: T | null; error: any }>,
  errorMessage: string
): Promise<T> {
  const { data, error } = await operation();
  if (error) throw new Error(errorMessage);
  return data as T;
}

/**
 * Project Operations
 */
const projectService = {
  async getById(projectId: string): Promise<Project> {
    return safeDbOperation(
      () => supabaseAdmin.from('projects').select('*').eq('id', projectId).single(),
      ''
    );
  },
  
  async updateFundingAmount(projectId: string, amount: number): Promise<void> {
    await safeDbOperation(
      () => supabaseAdmin.from('projects')
        .update({ 
          total_raised: supabaseAdmin.rpc('increment_funding', { amount, project_id: projectId })
        })
        .eq('id', projectId),
      'Failed to update funding amount for project ${projectId}'
    );
    console.log('Updated funding amount for project ${projectId} by ${amount}');
  }
};

/**
 * Donor Operations
 */
const donorService = {
  async createOrRetrieveDonor({
    email,
    userId,
    name
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
        const stripeCustomerId = existingDonor.stripe_customer_id || 
          await this.createStripeCustomer(existingDonor.id, email, name);
        
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
          stripe_customer_id: stripeCustomerId
        }]),
        'Donor creation failed for ${email}'
      );
      
      return newDonor;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error('Donor processing failed: ${error.message}');
      }
      throw error;
    }
  },
  
  async createStripeCustomer(donorId: string, email: string, name?: string): Promise<string> {
    const customerData = { 
      metadata: { donorId },
      email,
      name: name || undefined
    };
    
    const newCustomer = await stripe.customers.create(customerData);
    if (!newCustomer) throw new Error('Stripe customer creation failed.');
    return newCustomer.id;
  },
  
  async updateStripeCustomerId(donorId: string, stripeCustomerId: string): Promise<void> {
    await safeDbOperation(
      () => supabaseAdmin.from('donors')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('id', donorId),
      'Failed to update Stripe customer ID for donor ${donorId}'
    );
  }
};

/**
 * Donation Operations
 */
const donationService = {
  async recordOneTimeDonation({
    projectId,
    donorId,
    amount,
    paymentIntentId,
    currency = DEFAULT_CURRENCY,
    message = null,
    isAnonymous = false
  }: {
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
      project_id: projectId,
      donor_id: donorId,
      amount,
      currency,
      payment_intent_id: paymentIntentId,
      message,
      is_anonymous: isAnonymous,
      created_at: new Date().toISOString()
    };
    
    await safeDbOperation(
      () => supabaseAdmin.from('donations').insert([donation]),
      'Failed to record donation for project ${projectId}'
    );
    
    // Update project funding total
    await projectService.updateFundingAmount(projectId, amount);
    
    return donation.id;
  },
  
  async createOneTimePaymentIntent({
    projectId,
    stripeCustomerId,
    amount,
    currency = DEFAULT_CURRENCY,
    paymentMethods = DEFAULT_PAYMENT_METHODS
  }: {
    projectId: string;
    stripeCustomerId: string;
    amount: number;
    currency?: string;
    paymentMethods?: string[];
  }): Promise<Stripe.PaymentIntent> {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      customer: stripeCustomerId,
      payment_method_types: paymentMethods,
      metadata: { projectId },
      confirm: false
    });
    
    return paymentIntent;
  }
};

/**
 * Recurring Donation Operations
 */
const recurringDonationService = {
  async createRecurringDonation({
    projectId,
    donorId,
    amount,
    subscriptionId,
    currency = DEFAULT_CURRENCY,
    message = null,
    isAnonymous = false,
    frequency = 'month'
  }: {
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
      project_id: projectId,
      donor_id: donorId,
      amount,
      currency,
      subscription_id: subscriptionId,
      message,
      is_anonymous: isAnonymous,
      frequency,
      status: 'active',
      created_at: new Date().toISOString()
    };
    
    await safeDbOperation(
      () => supabaseAdmin.from('recurring_donations').insert([recurringDonation]),
      'Failed to create recurring donation for project ${projectId}'
    );
    
    // Record first payment as a one-time donation
    await donationService.recordOneTimeDonation({
      projectId,
      donorId,
      amount,
      paymentIntentId: 'sub_first_payment_${subscriptionId}',
      currency,
      message,
      isAnonymous
    });
    
    return recurringDonation.id;
  },
  
  async createSubscription({
    projectId,
    stripeCustomerId,
    amount,
    currency = DEFAULT_CURRENCY,
    interval = 'month',
    paymentMethodId
  }: {
    projectId: string;
    stripeCustomerId: string;
    amount: number;
    currency?: string;
    interval?: 'week' | 'month' | 'year';
    paymentMethodId: string;
  }): Promise<Stripe.Subscription> {
    // Create a subscription
    const subscription = await stripe.subscriptions.create({
      customer: stripeCustomerId,
      items: [
        {
          price_data: {
            currency,
            product_data: {
              name: '${interval}ly donation to project ${projectId}',
              metadata: { projectId }
            },
            unit_amount: amount,
            recurring: {
              interval
            }
          }
        }
      ],
      default_payment_method: paymentMethodId,
      metadata: { projectId },
      expand: ['latest_invoice.payment_intent']
    });
    
    return subscription;
  },
  
  async updateRecurringDonationStatus(
    subscriptionId: string,
    status: 'active' | 'paused' | 'canceled'
  ): Promise<void> {
    await safeDbOperation(
      () => supabaseAdmin.from('recurring_donations')
        .update({ status })
        .eq('subscription_id', subscriptionId),
      'Failed to update recurring donation status for subscription ${subscriptionId}'
    );
    
    console.log('Updated recurring donation status to ${status} for subscription ${subscriptionId}');
  },
  
  async handleSubscriptionUpdated(
    subscription: Stripe.Subscription
  ): Promise<void> {
    const status = subscription.status === 'active' ? 'active' : 
                  subscription.status === 'canceled' ? 'canceled' : 'paused';
    
    await this.updateRecurringDonationStatus(subscription.id, status);
  },
  
  async processRecurringPayment(
    subscriptionId: string,
    invoiceId: string,
    paymentIntentId: string,
    amount: number
  ): Promise<void> {
    // Find the recurring donation
    const { data: recurringDonation } = await supabaseAdmin
      .from('recurring_donations')
      .select('*')
      .eq('subscription_id', subscriptionId)
      .single();
    
    if (!recurringDonation) {
      throw new Error('Recurring donation not found for subscription ${subscriptionId}');
    }
    
    // Record the payment
    await donationService.recordOneTimeDonation({
      projectId: recurringDonation.project_id,
      donorId: recurringDonation.donor_id,
      amount,
      paymentIntentId,
      currency: recurringDonation.currency,
      message: recurringDonation.message,
      isAnonymous: recurringDonation.is_anonymous
    });
    
    // Update the last payment date
    await safeDbOperation(
      () => supabaseAdmin.from('recurring_donations')
        .update({ last_payment_at: new Date().toISOString() })
        .eq('id', recurringDonation.id),
      'Failed to update last payment date for recurring donation ${recurringDonation.id}'
    );
  }
};

/**
 * Webhook Handler Functions
 */
const webhookHandlers = {
  async handlePaymentIntentSucceeded(
    paymentIntent: Stripe.PaymentIntent
  ): Promise<void> {
    const projectId = paymentIntent.metadata.projectId;
    
    // Check if this is a one-time donation (not associated with a subscription)
    if (!paymentIntent.invoice) {
      // For one-time payments, we need to find the donor from the customer
      const { data: donor } = await supabaseAdmin
        .from('donors')
        .select('*')
        .eq('stripe_customer_id', paymentIntent.customer)
        .single();
      
      if (!donor) {
        throw new Error('Donor not found for customer ${paymentIntent.customer}');
      }
      
      // Record the donation
      await donationService.recordOneTimeDonation({
        projectId,
        donorId: donor.id,
        amount: paymentIntent.amount,
        paymentIntentId: paymentIntent.id,
        currency: paymentIntent.currency
      });
    }
    // If it has an invoice, it's part of a subscription and handled by the invoice.paid event
  },
  
  async handleInvoicePaid(
    invoice: Stripe.Invoice
  ): Promise<void> {
    if (!invoice.subscription || !invoice.payment_intent) return;
    
    await recurringDonationService.processRecurringPayment(
      invoice.subscription as string,
      invoice.id,
      invoice.payment_intent as string,
      invoice.amount_paid
    );
  },
  
  async handleSubscriptionUpdated(
    subscription: Stripe.Subscription
  ): Promise<void> {
    await recurringDonationService.handleSubscriptionUpdated(subscription);
  }
};


/** 
 * Main API Functions 
 */
const processDonation = async ({ 
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
  frequency = 'month' 
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
}): Promise<{ 
  donationId: string; 
  clientSecret?: string; 
}> => {
  try {
    // Ensure project exists
    await projectService.getById(projectId);

    // Create or retrieve donor
    const { donorId, stripeCustomerId } = await donorService.createOrRetrieveDonor({ 
      email, 
      userId, 
      name 
    });

    // Attach payment method to customer if provided
    await stripe.paymentMethods.attach(paymentMethodId, { 
      customer: stripeCustomerId 
    });

    // Set payment method as default for the customer
    await stripe.customers.update(stripeCustomerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId
      }
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
              name: 'Donation to Project ${projectId}',
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
        description: 'Donation to Project ${projectId}',
      });

      paymentIntentId = paymentIntent.id;
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
    console.error('Error processing donation:', error);
    throw new Error('Failed to process donation');
  }
};