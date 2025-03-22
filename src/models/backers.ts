import { and, count, desc, eq, isNull } from 'drizzle-orm';

import { db } from '@/libs/DB';
import type { Backer } from '@/types/types';

import { backersSchema, contributionsSchema, projectsSchema } from './Schema';
// ----------------- Backer Operations -----------------

export const backerOperations = {
  // Create backer
  create: async (backerData: Backer) => {
    return db.insert(backersSchema).values(backerData).returning();
  },

  // Find backer by ID
  findById: async (id: string) => {
    return db.query.backersSchema.findFirst({
      where: eq(backersSchema.id, id),
    });
  },

  // Find backer by user ID
  findByUserId: async (userId: string) => {
    return db.query.backersSchema.findFirst({
      where: eq(backersSchema.userId, userId),
    });
  },

  // Update backer
  update: async (id: string, backerData: Backer) => {
    return db
      .update(backersSchema)
      .set({ ...backerData, updatedAt: new Date() })
      .where(eq(backersSchema.id, id))
      .returning();
  },

  // Soft delete backer
  softDelete: async (id: string) => {
    return db
      .update(backersSchema)
      .set({ deletedAt: new Date() })
      .where(eq(backersSchema.id, id))
      .returning();
  },

  // Update backer statistics
  updateStats: async (id: string, amount: string) => {
    const backer = await db.query.backersSchema.findFirst({
      where: eq(backersSchema.id, id),
    });

    if (!backer) {
      return null;
    }

    return db
      .update(backersSchema)
      .set({
        totalAmountPledged: (Number.parseFloat(backer.totalAmountPledged) + Number.parseFloat(amount)).toString(),
        projectsBacked: backer.projectsBacked + 1,
        updatedAt: new Date(),
      })
      .where(eq(backersSchema.id, id))
      .returning();
  },

  // Get projects backed by user
  getBackedProjects: async (userId: string, page = 1, limit = 10) => {
    const offset = (page - 1) * limit;

    const backer = await db.query.backersSchema.findFirst({
      where: eq(backersSchema.userId, userId),
    });

    if (!backer) {
      return { projects: [], pagination: { total: 0, page, limit, pages: 0 } };
    }

    const backedProjects = await db
      .select({
        project: projectsSchema,
        contributionAmount: contributionsSchema.amount,
        contributionDate: contributionsSchema.createdAt,
      })
      .from(contributionsSchema)
      .innerJoin(
        projectsSchema,
        eq(contributionsSchema.projectId, projectsSchema.id),
      )
      .where(
        and(
          eq(contributionsSchema.backerId, backer.id),
          isNull(contributionsSchema.deletedAt),
          isNull(projectsSchema.deletedAt),
        ),
      )
      .orderBy(desc(contributionsSchema.createdAt))
      .limit(limit)
      .offset(offset);

    const totalCount = await db
      .select({ count: count() })
      .from(contributionsSchema)
      .where(
        and(
          eq(contributionsSchema.backerId, backer.id),
          isNull(contributionsSchema.deletedAt),
        ),
      );

    return {
      projects: backedProjects,
      pagination: {
        total: totalCount[0]?.count,
        page,
        limit,
        pages: Math.ceil(totalCount[0]!.count / limit),
      },
    };
  },

  // Get top backers
  getTopBackers: async (limit = 10) => {
    return db
      .select()
      .from(backersSchema)
      .where(isNull(backersSchema.deletedAt))
      .orderBy(desc(backersSchema.totalAmountPledged))
      .limit(limit);
  },
};
