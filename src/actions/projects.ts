'use server';

import { revalidatePath } from 'next/cache';

import { db } from '@/libs/DB';
import { projectsSchema } from '@/models/Schema';
import type { Project } from '@/types/types';

export const createProject = async (data: Project) => {
  await db.insert(projectsSchema).values({ ...data, status: 'active', currency: 'USD', publisherType: 'user' });
  revalidatePath('/projects');
};
