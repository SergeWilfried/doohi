// ----------------- Project Operations -----------------

import { and, asc, count, desc, eq, gt, isNull, like, sql } from 'drizzle-orm';

import { db } from '@/libs/DB';
import type { Project } from '@/types/types';

import { projectMediaSchema, projectsSchema, projectStats, projectTagsSchema, publishersSchema, tagsSchema } from './Schema';

type ProjectFilters = {
  categoryId: string;
  publisherId: string;
  featured: boolean;
  search: string;
  status: string;
  sort: string;
};
export const projectOperations = {
  // Create project
  create: async (projectData: Project) => {
    return db.insert(projectsSchema).values({ ...projectData, currency: 'USD', status: 'active', publisherType: 'user', updatedAt: new Date() }).returning();
  },

  // Find project by ID
  findById: async (id: string) => {
    return db.query.projectsSchema.findFirst({
      where: eq(projectsSchema.id, id),
    });
  },

  // Update project
  update: async (id: string, projectData: Project) => {
    return db
      .update(projectsSchema)
      .set({ ...projectData, currency: 'USD', status: 'active', publisherType: 'user', updatedAt: new Date() })
      .where(eq(projectsSchema.id, id))
      .returning();
  },

  // Soft delete project
  softDelete: async (id: string) => {
    return db
      .update(projectsSchema)
      .set({ deletedAt: new Date() })
      .where(eq(projectsSchema.id, id))
      .returning();
  },

  // Update project funding status
  updateFunding: async (id: string, amount: number) => {
    const project = await db.query.projectsSchema.findFirst({
      where: eq(projectsSchema.id, id),
    });

    if (!project) {
      return null;
    }

    const newRaised = Number.parseFloat(project.raised) + Number.parseFloat(amount.toString());

    return db
      .update(projectsSchema)
      .set({
        raised: newRaised.toString(),
        updatedAt: new Date(),
      })
      .where(eq(projectsSchema.id, id))
      .returning();
  },

  // Increment view count
  incrementViewCount: async (id: string) => {
    return db
      .update(projectsSchema)
      .set({
        viewCount: sql`${projectsSchema.viewCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(projectsSchema.id, id));
  },

  // List projects with pagination and filters
  list: async (page = 1, limit = 10, filters: ProjectFilters = {
    categoryId: '',
    publisherId: '',
    featured: false,
    search: '',
    status: '',
    sort: '',
  }) => {
    const offset = (page - 1) * limit;

    const conditions = [isNull(projectsSchema.deletedAt)];

    if (filters.publisherId) {
      conditions.push(like(publishersSchema.id, `%${filters.publisherId}%`));
    }

    if (filters.search) {
      conditions.push(like(publishersSchema.name, `%${filters.search}%`));
    }

    // Apply sorting
    let orderByClause;
    switch (filters.sort) {
      case 'newest':
        orderByClause = desc(projectsSchema.createdAt);
        break;
      case 'ending_soon':
        orderByClause = asc(projectsSchema.endDate);
        break;
      case 'most_funded':
        orderByClause = desc(projectsSchema.raised);
        break;
      case 'most_backed':
        // This would need a join or subquery, simplified version:
        orderByClause = desc(projectsSchema.raised);
        break;
      default:
        orderByClause = desc(projectsSchema.createdAt);
    }

    // Query publishers
    const projects = await db
      .select()
      .from(projectsSchema)
      .where(and(...conditions))
      .orderBy(desc(orderByClause))
      .limit(limit)
      .offset(offset);

    // Count total publishers (using the same conditions)
    const totalCount = await db
      .select({ count: count() })
      .from(projectsSchema)
      .where(and(...conditions));

    return {
      projects,
      pagination: {
        total: totalCount[0]?.count,
        page,
        limit,
        pages: Math.ceil(totalCount[0]!.count / limit),
      },
    };
  },

  // Get featured projects
  getFeaturedProjects: async (limit = 6) => {
    return db
      .select()
      .from(projectsSchema)
      .where(
        and(
          isNull(projectsSchema.deletedAt),
          eq(projectsSchema.featured, true),
          eq(projectsSchema.status, 'active'),
        ),
      )
      .orderBy(desc(projectsSchema.createdAt))
      .limit(limit);
  },

  // Get ending soon projects
  getEndingSoonProjects: async (limit = 6) => {
    return db
      .select()
      .from(projectsSchema)
      .where(
        and(
          isNull(projectsSchema.deletedAt),
          eq(projectsSchema.status, 'active'),
          gt(projectsSchema.endDate, new Date()),
        ),
      )
      .orderBy(asc(projectsSchema.endDate))
      .limit(limit);
  },

  // Get projects by category
  getProjectsByCategory: async (categoryId: string, limit = 10) => {
    return db
      .select()
      .from(projectsSchema)
      .where(
        and(
          isNull(projectsSchema.deletedAt),
          eq(projectsSchema.categoryId, categoryId),
          eq(projectsSchema.status, 'active'),
        ),
      )
      .orderBy(desc(projectsSchema.createdAt))
      .limit(limit);
  },

  // Find projects by tag
  getProjectsByTag: async (tagId: string, page = 1, limit = 10) => {
    const offset = (page - 1) * limit;

    const projects = await db
      .select({
        project: projectsSchema,
      })
      .from(projectsSchema)
      .innerJoin(
        projectTagsSchema,
        and(
          eq(projectsSchema.id, projectTagsSchema.projectId),
          eq(projectTagsSchema.tagId, tagId),
        ),
      )
      .where(
        and(
          isNull(projectsSchema.deletedAt),
          eq(projectsSchema.status, 'active'),
        ),
      )
      .orderBy(desc(projectsSchema.createdAt))
      .limit(limit)
      .offset(offset);

    const totalCount = await db
      .select({ count: count() })
      .from(projectsSchema)
      .innerJoin(
        projectTagsSchema,
        and(
          eq(projectsSchema.id, projectTagsSchema.projectId),
          eq(projectTagsSchema.tagId, tagId),
        ),
      )
      .where(
        and(
          isNull(projectsSchema.deletedAt),
          eq(projectsSchema.status, 'active'),
        ),
      );

    return {
      projects: projects.map(p => p.project),
      pagination: {
        total: totalCount[0]?.count,
        page,
        limit,
        pages: Math.ceil(totalCount[0]!.count / limit),
      },
    };
  },

  // Get project statistics
  getProjectStats: async (id: string) => {
    const results = await db
      .select()
      .from(projectStats)
      .where(eq(projectStats.id, id))
      .limit(1);

    return results[0] || null;
  },
  // Update project status
  updateStatus: async (id: string, status: any) => {
    return db
      .update(projectsSchema)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(projectsSchema.id, id))
      .returning();
  },
};

// ----------------- Project Media Operations -----------------

export const projectMediaOperations = {
  // Add media to project
  create: async (mediaData: any) => {
    return db.insert(projectMediaSchema).values(mediaData).returning();
  },

  // Find media by ID
  findById: async (id: string) => {
    return db.query.projectMediaSchema.findFirst({
      where: eq(projectMediaSchema.id, id),
    });
  },

  // Update media
  update: async (id: string, mediaData: any) => {
    return db
      .update(projectMediaSchema)
      .set({ ...mediaData, updatedAt: new Date() })
      .where(eq(projectMediaSchema.id, id))
      .returning();
  },

  // Delete media
  delete: async (id: string) => {
    return db
      .delete(projectMediaSchema)
      .where(eq(projectMediaSchema.id, id))
      .returning();
  },

  // Get all media for a project
  getProjectMedia: async (projectId: string) => {
    return db
      .select()
      .from(projectMediaSchema)
      .where(eq(projectMediaSchema.projectId, projectId))
      .orderBy(asc(projectMediaSchema.displayOrder));
  },

  // Reorder media for a project
  reorderMedia: async (mediaItems: [any]) => {
    const results = [];

    for (const item of mediaItems) {
      const result = await db
        .update(projectMediaSchema)
        .set({
          displayOrder: item.displayOrder,
          updatedAt: new Date(),
        })
        .where(eq(projectMediaSchema.id, item.id))
        .returning();

      results.push(result[0]);
    }

    return results;
  },
};

// ----------------- Project Tags Operations -----------------

export const projectTagsOperations = {
  // Add tag to project
  addTagToProject: async (projectId: string, tagId: string) => {
    return db
      .insert(projectTagsSchema)
      .values({ projectId, tagId })
      .returning();
  },

  // Remove tag from project
  removeTagFromProject: async (projectId: string, tagId: string) => {
    return db
      .delete(projectTagsSchema)
      .where(
        and(
          eq(projectTagsSchema.projectId, projectId),
          eq(projectTagsSchema.tagId, tagId),
        ),
      );
  },

  // Get all tags for a project
  getProjectTags: async (projectId: string) => {
    return db
      .select({
        id: tagsSchema.id,
        name: tagsSchema.name,
      })
      .from(projectTagsSchema)
      .innerJoin(
        tagsSchema,
        eq(projectTagsSchema.tagId, tagsSchema.id),
      )
      .where(
        and(
          eq(projectTagsSchema.projectId, projectId),
          isNull(tagsSchema.deletedAt),
        ),
      );
  },

  // Set multiple tags for a project (remove existing and add new ones)
  setProjectTags: async (projectId: string, tagIds: []) => {
    // First remove all existing tags
    await db
      .delete(projectTagsSchema)
      .where(eq(projectTagsSchema.projectId, projectId));

    // Then add the new tags
    const tagEntries = tagIds.map(tagId => ({
      projectId,
      tagId,
    }));

    return db
      .insert(projectTagsSchema)
      .values(tagEntries)
      .returning();
  },
};
