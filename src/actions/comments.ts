'use server';

import { eq } from 'drizzle-orm';
import { revalidateTag } from 'next/cache';

import { db } from '@/libs/DB';
import { commentsSchema, type TComment } from '@/models/Schema';

export const addComment = async (data: TComment) => {
  const insertedComment = await db.insert(commentsSchema).values({ ...data });
  // Invalidate cache
  revalidateTag('comments');

  return insertedComment;
};

export const updateComment = async (data: TComment) => {
  const response = await db.update(commentsSchema)
    .set({ ...data })
    .where(eq(commentsSchema.id, data.id));
  revalidateTag('comments');
  return response;
};
