import { and, count, desc, eq, gte, isNull, like } from 'drizzle-orm';

import { db } from '@/libs/DB';
import type { Publisher } from '@/types/types';

import { PublisherSchema, publishersSchema } from './Schema';

// ----------------- Publisher Operations -----------------

type PublisherFilters = {
  verified?: boolean;
  search?: string;
  status?: string;
  minTrustScore?: number;
};

export const publisherOperations = {
  // Create publisher
  create: async (publisherData: Publisher) => {
    return db.insert(publishersSchema).values({ ...publisherData, defaultCurrency: 'USD', updatedAt: new Date() }).returning();
  },

  // Find publisher by ID (excluding soft-deleted records)
  findById: async (id: string) => {
    const response = db.query.publishersSchema.findFirst({
      where: and(eq(publishersSchema.id, id), isNull(publishersSchema.deletedAt)),
    });
    const parsed = PublisherSchema.parse(response);
    return parsed;
  },

  // Update publisher (only if not deleted)
  update: async (id: string, publisherData: Publisher) => {
    const publisher = await db.query.publishersSchema.findFirst({
      where: and(eq(publishersSchema.id, id), isNull(publishersSchema.deletedAt)),
    });

    if (!publisher) {
      throw new Error(`Publisher with ID ${id} not found or has been deleted`);
    }

    // Exclude ID from update
    const { id: _, ...updateData } = publisherData;

    return db
      .update(publishersSchema)
      .set({ ...updateData, defaultCurrency: 'USD', updatedAt: new Date() })
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
  list: async (
    page = 1,
    limit = 10,
    filters: PublisherFilters = { verified: undefined, search: '', status: '', minTrustScore: 0 },
  ) => {
    const offset = (page - 1) * limit;

    // Build filter conditions
    const conditions = [isNull(publishersSchema.deletedAt)];

    if (filters.verified !== undefined) {
      conditions.push(eq(publishersSchema.verified, filters.verified));
    }
    if (filters.search) {
      conditions.push(like(publishersSchema.name, `%${filters.search}%`));
    }
    if (filters.minTrustScore !== undefined) {
      conditions.push(gte(publishersSchema.trustScore, filters.minTrustScore));
    }

    // Query publishers
    const publishers = await db
      .select()
      .from(publishersSchema)
      .where(and(...conditions))
      .orderBy(desc(publishersSchema.totalFundsRaised))
      .limit(limit)
      .offset(offset);

    // Count total publishers (using the same conditions)
    const totalCount = await db
      .select({ count: count() })
      .from(publishersSchema)
      .where(and(...conditions));

    return {
      publishers,
      pagination: {
        total: totalCount[0]?.count || 0,
        page,
        limit,
        pages: Math.ceil((totalCount[0]?.count || 1) / limit),
      },
    };
  },

  // Update publisher statistics
  updateStats: async (id: string, stats: { totalProjects?: number; totalFundsRaised?: string }) => {
    const publisher = await db.query.publishersSchema.findFirst({
      where: and(eq(publishersSchema.id, id), isNull(publishersSchema.deletedAt)),
    });

    if (!publisher) {
      throw new Error(`Publisher with ID ${id} not found or has been deleted`);
    }

    // Only update fields that are provided in stats
    const updateData: any = { updatedAt: new Date() };
    if (stats.totalProjects !== undefined) {
      updateData.totalProjects = stats.totalProjects;
    }
    if (stats.totalFundsRaised !== undefined) {
      updateData.totalFundsRaised = stats.totalFundsRaised;
    }

    return db
      .update(publishersSchema)
      .set(updateData)
      .where(eq(publishersSchema.id, id))
      .returning(); // Use without arguments
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
