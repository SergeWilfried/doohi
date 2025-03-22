import { count, desc, eq, gte, isNull, like } from 'drizzle-orm';

import { db } from '@/libs/DB';
import type { Publisher } from '@/types/types';

import { publishersSchema } from './Schema';
// ----------------- Publisher Operations -----------------

export const publisherOperations = {
  // Create publisher
  create: async (publisherData: Publisher) => {
    return db.insert(publishersSchema).values(publisherData).returning();
  },

  // Find publisher by ID
  findById: async (id: string) => {
    return db.query.publishersSchema.findFirst({
      where: eq(publishersSchema.id, id),
    });
  },

  // Update publisher
  update: async (id: string, publisherData: Publisher) => {
    // Check if publisher exists and is not deleted
    const publisher = await db.query.publishersSchema.findFirst({
      where: (publishers) => {
        return eq(publishers.id, id) && isNull(publishers.deletedAt);
      },
    });
    
    if (!publisher) {
      throw new Error(`Publisher with ID ${id} not found or has been deleted`);
    }
    
    // Remove id from update data to prevent accidental ID change
    const { id: _, ...updateData } = publisherData;
    
    return db
      .update(publishersSchema)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(publishersSchema.id, id))
      .returning();
  },

  // Soft delete publisher
  softDelete: async (id: string) => {
    return db
      .update(publishersSchema)
      .set({ deletedAt: new Date() })
      .where(eq(publishersSchema.id, id))
      .returning();
  },

  // List publishers with pagination and filters
  list: async (page = 1, limit = 10, filters = {}) => {
    const offset = (page - 1) * limit;

    let query = db.select().from(publishersSchema).where(isNull(publishersSchema.deletedAt));

    // Apply filters
    if (filters.verified !== undefined) {
      query = query.where(eq(publishersSchema.verified, filters.verified));
    }

    if (filters.search) {
      query = query.where(like(publishersSchema.name, `%${filters.search}%`));
    }

    if (filters.minTrustScore !== undefined) {
      query = query.where(gte(publishersSchema.trustScore, filters.minTrustScore));
    }

    const publishers = await query
      .orderBy(desc(publishersSchema.totalFundsRaised))
      .limit(limit)
      .offset(offset);

    const totalCount = await db
      .select({ count: count() })
      .from(publishersSchema)
      .where(isNull(publishersSchema.deletedAt));

    return {
      publishers,
      pagination: {
        total: totalCount[0].count,
        page,
        limit,
        pages: Math.ceil(totalCount[0].count / limit),
      },
    };
  },

  // Update publisher statistics
  updateStats: async (id, { totalProjects, totalFundsRaised }) => {
    return db
      .update(publishersSchema)
      .set({
        totalProjects,
        totalFundsRaised,
        updatedAt: new Date(),
      })
      .where(eq(publishersSchema.id, id))
      .returning();
  },

  // Get top publishers by funds raised
  getTopPublishers: async (limit = 10) => {
    return db
      .select()
      .from(publishersSchema)
      .where(isNull(publishersSchema.deletedAt))
      .orderBy(desc(publishersSchema.totalFundsRaised))
      .limit(limit);
  },
};
