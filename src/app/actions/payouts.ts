'use server';
import { currentUser } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { revalidateTag } from 'next/cache';

import { db } from '@/libs/DB';
import { payoutsSchema, type TPayout, type TUser } from '@/models/Schema';
import { checkRole } from '@/utils/roles';

// Helper function to check if user has access to payout
async function hasPayoutAccess(user: TUser, payoutPublisherId: string): Promise<boolean> {
  // Use checkRole for admin check
  const isAdmin = await checkRole('admin');
  if (isAdmin) {
    return true;
  }

  // Use checkRole for publisher check
  const isPublisher = await checkRole('publisher');
  if (isPublisher) {
    return user.id === payoutPublisherId;
  }

  return false;
}

// Helper to get current user or throw error
async function getCurrentUser() {
  const user = await currentUser();
  if (!user) { // Fixed the logic - throw when user is null
    throw new Error('Authentication required');
  }
  return user as TUser;
}

export const createPayout = async (data: TPayout) => {
  const user = await getCurrentUser();

  // Check roles using checkRole utility
  const isAdmin = await checkRole('admin');
  const isPublisher = await checkRole('publisher');

  if (!isAdmin && !isPublisher) {
    throw new Error('Unauthorized: Insufficient permissions');
  }

  // Publishers can only create payouts for themselves
  if (isPublisher && user.id !== data.publisherId) {
    throw new Error('Unauthorized: Cannot create payout for another publisher');
  }

  const response = await db.insert(payoutsSchema).values({ ...data });
  revalidateTag('payouts');
  return response;
};

export const updatePayout = async (data: TPayout) => {
  const user = await getCurrentUser();

  // Check access permissions
  if (!(await hasPayoutAccess(user, data.publisherId))) {
    throw new Error('Unauthorized: Cannot update this payout');
  }

  const response = await db.update(payoutsSchema)
    .set({ ...data })
    .where(eq(payoutsSchema.id, data.id));
  revalidateTag('payouts');
  return response;
};

export const getAllPayouts = async () => {
  const user = await getCurrentUser();

  const isAdmin = await checkRole('admin');
  const isPublisher = await checkRole('publisher');

  if (isAdmin) {
    return await db.select().from(payoutsSchema);
  }

  if (isPublisher) {
    return await db.select()
      .from(payoutsSchema)
      .where(eq(payoutsSchema.publisherId, user.id));
  }

  throw new Error('Unauthorized: Insufficient permissions');
};

export const getPayoutById = async (id: string) => {
  const user = await getCurrentUser();

  const payout = await db.select()
    .from(payoutsSchema)
    .where(eq(payoutsSchema.id, id))
    .limit(1);

  if (!payout[0]) {
    throw new Error('Payout not found');
  }

  // Check access permissions
  if (!(await hasPayoutAccess(user, payout[0].publisherId))) {
    throw new Error('Unauthorized: Cannot view this payout');
  }

  return payout[0];
};

export const deletePayout = async (id: string) => {
  const user = await getCurrentUser();

  // First get the payout to check permissions
  const payout = await getPayoutById(id);

  // Check access permissions
  if (!(await hasPayoutAccess(user, payout.publisherId))) {
    throw new Error('Unauthorized: Cannot delete this payout');
  }

  const response = await db.delete(payoutsSchema)
    .where(eq(payoutsSchema.id, id));
  revalidateTag('payouts');
  return response;
};
