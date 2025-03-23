'use server';

import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { revalidateTag } from 'next/cache';

import { db } from '@/libs/DB';
import { commentsSchema, type TComment } from '@/models/Schema';
import { checkRole } from '@/utils/roles';

export const getComment = async (id: string) => {
  const comment = await db
    .select()
    .from(commentsSchema)
    .where(eq(commentsSchema.id, id))
    .limit(1);
  return comment[0];
};

export const getAllComments = async () => {
  const comments = await db
    .select()
    .from(commentsSchema);
  return comments;
};

// Helper function to check if user can delete comment
async function canDeleteComment(commentId: string) {
  const { sessionClaims } = await auth();
  if (!sessionClaims) {
    throw new Error('Unauthorized: No session found');
  }

  // Admins can delete any comment
  if (await checkRole('admin')) {
    return true;
  }

  // Users can only delete their own comments
  const comment = await getComment(commentId);
  if (!comment) {
    throw new Error('Comment not found');
  }

  return comment.userId === (sessionClaims.metadata as { userId: string }).userId;
}

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

export const deleteComment = async (id: string) => {
  const canDelete = await canDeleteComment(id);
  if (!canDelete) {
    throw new Error('Unauthorized: Cannot delete this comment');
  }

  const response = await db.delete(commentsSchema)
    .where(eq(commentsSchema.id, id));
  revalidateTag('comments');
  return response;
};
