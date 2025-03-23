'use server';

import { eq } from 'drizzle-orm';
import { revalidateTag } from 'next/cache';

import { db } from '@/libs/DB';
import { contributionsSchema, type TContribution } from '@/models/Schema';

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
