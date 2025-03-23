'use server';

import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

import { db } from '@/libs/DB';
import { contributionsSchema, type TContribution } from '@/models/Schema';

export const addContribution = async (data: TContribution) => {
  await db.insert(contributionsSchema).values({ ...data });
  revalidatePath('/projects');
};

export const updateContribution = async (data: TContribution) => {
  await db.update(contributionsSchema)
    .set({ ...data })
    .where(eq(contributionsSchema.id, data.id));
  revalidatePath('/projects');
};
