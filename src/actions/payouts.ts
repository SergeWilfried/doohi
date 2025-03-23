'use server';

import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

import { db } from '@/libs/DB';
import { payoutsSchema, type TPayout } from '@/models/Schema';

export const createPayout = async (data: TPayout) => {
  await db.insert(payoutsSchema).values({ ...data });
  revalidatePath('/payouts');
};

export const updatePayout = async (data: TPayout) => {
  await db.update(payoutsSchema)
    .set({ ...data })
    .where(eq(payoutsSchema.id, data.id));
  revalidatePath('/payouts');
};
