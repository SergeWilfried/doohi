'use server';

import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

import { db } from '@/libs/DB';
import { projectsSchema, type TProject } from '@/models/Schema';
import type { Project } from '@/types/types';

/// FIXME
export const createProject = async (data: Project) => {
  await db.insert(projectsSchema).values({ ...data, status: 'active', currency: 'USD', publisherType: 'user' });
  revalidatePath('/projects');
};

export const updateProject = async (data: TProject) => {
  await db.update(projectsSchema)
    .set({ ...data })
    .where(eq(projectsSchema.id, data.id));
  revalidatePath('/payouts');
};
