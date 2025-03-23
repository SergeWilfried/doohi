'use server';

import { eq } from 'drizzle-orm';
import { revalidateTag } from 'next/cache';

import { db } from '@/libs/DB';
import { projectsSchema, type TProject } from '@/models/Schema';

/// FIXME
export const createProject = async (data: TProject) => {
  const response = await db.insert(projectsSchema).values({ ...data, status: 'active', currency: 'USD', publisherType: 'user' });
  revalidateTag('projects');
  return response;
};

export const updateProject = async (data: TProject) => {
  const response = await db.update(projectsSchema)
    .set({ ...data })
    .where(eq(projectsSchema.id, data.id));
  revalidateTag('projects');
  return response;
};
