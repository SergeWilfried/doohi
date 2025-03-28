'use server';

import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { revalidateTag } from 'next/cache';

import { db } from '@/libs/DB';
import { ProjectSchema, projectsSchema, type TProject } from '@/models/Schema';
import { checkRole } from '@/utils/roles';

export const getProject = async (id: string, skipAccessCheck = false) => {
  const project = await db
    .select()
    .from(projectsSchema)
    .where(eq(projectsSchema.id, id))
    .limit(1);

  if (!project[0]) {
    return null;
  }
  if (!skipAccessCheck) {
    await canAccessProject(id);
  }
  return project[0];
};
export const getProjects = async () => {
  const response = await db
    .select()
    .from(projectsSchema);
  console.warn( 'response', response)
  const parsed = response.map(item => ProjectSchema.parse(item));
  return parsed;
};
// Helper function to check if user has access to projects
async function canAccessProject(projectId?: string) {
  const { sessionClaims } = await auth();
  if (!sessionClaims) {
    throw new Error('Unauthorized: No session found');
  }

  // Admin has full access to all projects
  if (await checkRole('admin')) {
    return true;
  }

  // Publisher can only access their own projects
  if (await checkRole('publisher')) {
    if (!projectId) {
      return true;
    } // For listing projects
    const project = await getProject(projectId, true);
    return project?.publisherId === (sessionClaims.metadata as { publisherId: string }).publisherId;
  }

  throw new Error('Unauthorized: Insufficient permissions');
}

/// FIXME
export const createProject = async (data: TProject) => {
  await canAccessProject();
  const response = await db.insert(projectsSchema).values({ ...data, status: 'active', currency: 'USD', publisherType: 'user' });
  revalidateTag('projects');
  return response;
};

export const updateProject = async (data: TProject) => {
  await canAccessProject(data.id);
  const response = await db.update(projectsSchema)
    .set({ ...data })
    .where(eq(projectsSchema.id, data.id));
  revalidateTag('projects');
  return response;
};

export const deleteProject = async (id: string) => {
  await canAccessProject(id);
  const response = await db
    .update(projectsSchema)
    .set({ status: 'expired' })
    .where(eq(projectsSchema.id, id));
  revalidateTag('projects');
  return response;
};
