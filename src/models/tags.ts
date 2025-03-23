import { and, asc, count, desc, eq, isNull, like } from 'drizzle-orm';

import { db } from '@/libs/DB';
import type { Tag } from '@/types/types';

import { projectTagsSchema, tagsSchema } from './Schema';

// ----------------- Tag Operations -----------------

export const tagOperations = {
  // Create tag
  create: async (tagData: Tag) => {
    return db.insert(tagsSchema).values(tagData).returning();
  },

  // Find tag by ID
  findById: async (id: string) => {
    return db.query.tagsSchema.findFirst({
      where: eq(tagsSchema.id, id),
    });
  },

  // Find tag by name (exact match)
  findByName: async (name: string) => {
    return db.query.tagsSchema.findFirst({
      where: eq(tagsSchema.name, name),
    });
  },

  // Update tag
  update: async (id: string, tagData: Tag) => {
    return db
      .update(tagsSchema)
      .set({ ...tagData, updatedAt: new Date() })
      .where(eq(tagsSchema.id, id))
      .returning();
  },

  // Soft delete tag
  softDelete: async (id: string) => {
    return db
      .update(tagsSchema)
      .set({ deletedAt: new Date() })
      .where(eq(tagsSchema.id, id))
      .returning();
  },

  // List all tags
  listAll: async () => {
    return db
      .select()
      .from(tagsSchema)
      .where(isNull(tagsSchema.deletedAt))
      .orderBy(asc(tagsSchema.name));
  },

  // Search tags by partial name match
  search: async (searchTerm: string) => {
    return db
      .select()
      .from(tagsSchema)
      .where(
        and(
          isNull(tagsSchema.deletedAt),
          like(tagsSchema.name, `%${searchTerm}%`),
        ),
      )
      .orderBy(asc(tagsSchema.name));
  },

  // Get popular tags with project counts
  getPopularTags: async (limit = 10) => {
    return db
      .select({
        id: tagsSchema.id,
        name: tagsSchema.name,
        projectCount: count(projectTagsSchema.projectId),
      })
      .from(tagsSchema)
      .leftJoin(
        projectTagsSchema,
        eq(tagsSchema.id, projectTagsSchema.tagId),
      )
      .where(isNull(tagsSchema.deletedAt))
      .groupBy(tagsSchema.id)
      .orderBy(desc(count(projectTagsSchema.projectId)))
      .limit(limit);
  },
};
