'use server';

import { eq } from 'drizzle-orm';
import { revalidateTag } from 'next/cache';

import { db } from '@/libs/DB';
import { payoutsSchema, type TPayout } from '@/models/Schema';

export const createPayout = async (data: TPayout) => {
  const response = await db.insert(payoutsSchema).values({ ...data });
  revalidateTag('payouts');
  return response;
};

export const updatePayout = async (data: TPayout) => {
  const response = await db.update(payoutsSchema)
    .set({ ...data })
    .where(eq(payoutsSchema.id, data.id));
  revalidateTag('payouts');
  return response;
};
