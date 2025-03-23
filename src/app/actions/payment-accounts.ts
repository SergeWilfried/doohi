'use server';

import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { revalidateTag } from 'next/cache';

import {
  paymentAccountsSchema,
  type TNewPaymentAccount,
  type TPaymentAccount,
} from '@/models/Schema';
import { checkRole } from '@/utils/roles';

import { db } from '../../libs/DB';

// Custom error for unauthorized access

// Helper function to check if user has access to publisher's payment accounts
async function canAccessPublisherPaymentAccounts(publisherId: string) {
  const { sessionClaims } = await auth();
  if (!sessionClaims) {
    throw new Error('Unauthorized: No session found');
  }

  // Admin has full access to all publisher accounts
  if (await checkRole('admin')) {
    return true;
  }

  // Publisher can only access their own accounts
  if (await checkRole('publisher')) {
    return (sessionClaims.metadata as { publisherId: string }).publisherId === publisherId;
  }

  throw new Error('Unauthorized: Insufficient permissions');
}

/**
 * Create a new payment account
 */
export const createPaymentAccount = async (data: TNewPaymentAccount) => {
  const hasAccess = await canAccessPublisherPaymentAccounts(data.publisherId);
  if (!hasAccess) {
    throw new Error('Unauthorized access');
  }

  const insertedAccount = await db.insert(paymentAccountsSchema).values({ ...data });
  revalidateTag('payment-accounts');
  return insertedAccount;
};

/**
 * Get a payment account by ID
 */
export const getPaymentAccount = async (id: string) => {
  const account = await db
    .select()
    .from(paymentAccountsSchema)
    .where(eq(paymentAccountsSchema.id, id))
    .limit(1);

  if (!account[0]) {
    return null;
  }

  const hasAccess = await canAccessPublisherPaymentAccounts(account[0].publisherId);
  if (!hasAccess) {
    throw new Error('Unauthorized access');
  }

  return account[0];
};

/**
 * Get all payment accounts for a publisher
 */
export const getPublisherPaymentAccounts = async (publisherId: string) => {
  const hasAccess = await canAccessPublisherPaymentAccounts(publisherId);
  if (!hasAccess) {
    throw new Error('Unauthorized access');
  }

  const accounts = await db
    .select()
    .from(paymentAccountsSchema)
    .where(eq(paymentAccountsSchema.publisherId, publisherId));
  return accounts;
};

/**
 * Update a payment account
 */
export const updatePaymentAccount = async (data: TPaymentAccount) => {
  const hasAccess = await canAccessPublisherPaymentAccounts(data.publisherId);
  if (!hasAccess) {
    throw new Error('Unauthorized access');
  }

  const response = await db.update(paymentAccountsSchema)
    .set({ ...data })
    .where(eq(paymentAccountsSchema.id, data.id));
  revalidateTag('payment-accounts');
  return response;
};

/**
 * Delete a payment account
 */
export const deletePaymentAccount = async (id: string) => {
  const account = await getPaymentAccount(id);
  if (!account) {
    throw new Error('Payment account not found');
  }

  const hasAccess = await canAccessPublisherPaymentAccounts(account.publisherId);
  if (!hasAccess) {
    throw new Error('Unauthorized access');
  }

  const response = await db.update(paymentAccountsSchema)
    .set({ deletedAt: new Date() })
    .where(eq(paymentAccountsSchema.id, id));
  revalidateTag('payment-accounts');
  return response;
};
