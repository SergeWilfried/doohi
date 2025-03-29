import { and, asc, count, eq, isNull } from 'drizzle-orm';

import { db } from '@/libs/DB';
import type { Category } from '@/types/types';

import { categoriesSchema, CategorySchema, projectsSchema } from './Schema';

// ----------------- Category Operations -----------------

export const categoryOperations = {
  // Create category
  create: async (categoryData: Category) => {
    return db.insert(categoriesSchema).values(categoryData).returning();
  },

  // Find category by ID
  findById: async (id: string) => {
    const response = db.query.categoriesSchema.findFirst({
      where: eq(categoriesSchema.id, id),
    });
    const parsed = CategorySchema.parse(response);
    return parsed;
  },

  // Update category
  update: async (id: string, categoryData: Category) => {
    return db
      .update(categoriesSchema)
      .set({ ...categoryData, updatedAt: new Date() })
      .where(eq(categoriesSchema.id, id))
      .returning();
  },

  // Soft delete category
  softDelete: async (id: string) => {
    return db
      .update(categoriesSchema)
      .set({ deletedAt: new Date() })
      .where(eq(categoriesSchema.id, id))
      .returning();
  },

  // List all active categories ordered by display order
  listAll: async () => {
    return db
      .select()
      .from(categoriesSchema)
      .where(isNull(categoriesSchema.deletedAt))
      .orderBy(asc(categoriesSchema.displayOrder));
  },

  // Get category with project counts
  getCategoriesWithProjectCounts: async () => {
    return db
      .select({
        id: categoriesSchema.id,
        name: categoriesSchema.name,
        description: categoriesSchema.description,
        iconUrl: categoriesSchema.iconUrl,
        projectCount: count(projectsSchema.id),
      })
      .from(categoriesSchema)
      .leftJoin(
        projectsSchema,
        and(
          eq(categoriesSchema.id, projectsSchema.categoryId),
          isNull(projectsSchema.deletedAt),
        ),
      )
      .where(isNull(categoriesSchema.deletedAt))
      .groupBy(categoriesSchema.id)
      .orderBy(asc(categoriesSchema.displayOrder));
  },
};
