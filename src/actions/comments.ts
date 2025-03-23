'use server';

import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

import { db } from '@/libs/DB';
import { commentsSchema, type TComment } from '@/models/Schema';

export const addComment = async (data: TComment) => {
  await db.insert(commentsSchema).values({ ...data });
  revalidatePath('/comments');
};

export const updateComment = async (data: TComment) => {
  await db.update(commentsSchema)
    .set({ ...data })
    .where(eq(commentsSchema.id, data.id));
  revalidatePath('/projects');
};
