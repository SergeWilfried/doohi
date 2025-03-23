'use server';

import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { revalidateTag } from 'next/cache';

import { db } from '@/libs/DB';
import { contributionsSchema, type TContribution } from '@/models/Schema';
import { checkRole } from '@/utils/roles';

// Helper function to check if user has delete permissions
async function canDeleteContribution() {
  const { sessionClaims } = await auth();
  if (!sessionClaims) {
    throw new Error('Unauthorized: No session found');
  }

  // Only admins can delete contributions
  if (await checkRole('admin')) {
    return true;
  }

  throw new Error('Unauthorized: Only admins can delete contributions');
}

// Add this helper function near the top of the file
async function canAddContribution() {
  const { sessionClaims } = await auth();
  if (!sessionClaims) {
    throw new Error('Unauthorized: No session found');
  }

  // Allow both admins and publishers to add contributions
  const isAdmin = await checkRole('admin');
  const isPublisher = await checkRole('publisher');

  if (!isAdmin && !isPublisher) {
    throw new Error('Unauthorized: Insufficient permissions');
  }

  return true;
}

export const addContribution = async (publisherId: string, userId: string, data: TContribution) => {
  // Permission check
  await canAddContribution();

  // Input validation
  if (!data.amount || Number(data.amount) <= 0) {
    throw new Error('Invalid contribution amount');
  }

  if (!publisherId) {
    throw new Error('Publisher ID is required');
  }

  if (!userId) {
    throw new Error('User ID is required');
  }

  try {
    const response = await db.insert(contributionsSchema).values({
      ...data,
      createdAt: new Date(), // Ensure we set the creation timestamp
    });
    revalidateTag('contributions');
    return response;
  } catch (error) {
    // Handle specific database errors if needed
    throw new Error(`Failed to add contribution: ${(error as Error).message}`);
  }
};

export const updateContribution = async (data: TContribution) => {
  const response = await db.update(contributionsSchema)
    .set({ ...data })
    .where(eq(contributionsSchema.id, data.id));
  revalidateTag('contributions');
  return response;
};

export const getContribution = async (id: string) => {
  const response = await db
    .select()
    .from(contributionsSchema)
    .where(eq(contributionsSchema.id, id))
    .limit(1);
  return response[0];
};

export const getAllContributions = async () => {
  const response = await db
    .select()
    .from(contributionsSchema);
  return response;
};

export const deleteContribution = async (id: string) => {
  await canDeleteContribution();
  const response = await db
    .delete(contributionsSchema)
    .where(eq(contributionsSchema.id, id));
  revalidateTag('contributions');
  return response;
};
