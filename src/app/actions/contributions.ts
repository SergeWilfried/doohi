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

export const addContribution = async (data: TContribution) => {
  const response = await db.insert(contributionsSchema).values({ ...data });
  revalidateTag('contributions');
  return response;
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
