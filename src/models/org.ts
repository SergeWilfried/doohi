// ----------------- Organization Operations -----------------

import { count, eq, isNull, like } from 'drizzle-orm';

import { db } from '@/libs/DB';
import type { Organization } from '@/types/types';

import { organizationSchema } from './Schema';

export const organizationOperations = {
  // Create new organization
  create: async (orgData: Organization) => {
    return db.insert(organizationSchema).values(orgData).returning();
  },

  // Find organization by ID
  findById: async (id: string) => {
    return db.query.organizationSchema.findFirst({
      where: eq(organizationSchema.id, id),
    });
  },

  // Update organization
  update: async (id: string, orgData: Organization) => {
    return db
      .update(organizationSchema)
      .set({ ...orgData, updatedAt: new Date() })
      .where(eq(organizationSchema.id, id))
      .returning();
  },

  // Soft delete organization
  softDelete: async (id: string) => {
    return db
      .update(organizationSchema)
      .set({ deletedAt: new Date() })
      .where(eq(organizationSchema.id, id))
      .returning();
  },

  // List organizations with pagination and filters
  list: async (page = 1, limit = 10, filters = {}) => {
    const offset = (page - 1) * limit;

    let query = db.select().from(organizationSchema).where(isNull(organizationSchema.deletedAt));

    // Apply filters
    if (filters.verified !== undefined) {
      query = query.where(eq(organizationSchema.verified, filters.verified));
    }

    if (filters.search) {
      query = query.where(like(organizationSchema.name, `%${filters.search}%`));
    }

    const orgs = await query.limit(limit).offset(offset);
    const totalCount = await db
      .select({ count: count() })
      .from(organizationSchema)
      .where(isNull(organizationSchema.deletedAt));

    return {
      organizations: orgs,
      pagination: {
        total: totalCount[0].count,
        page,
        limit,
        pages: Math.ceil(totalCount[0].count / limit),
      },
    };
  },

  // Find by Stripe customer ID
  findByStripeCustomerId: async (stripeCustomerId: string) => {
    return db.query.organizationSchema.findFirst({
      where: eq(organizationSchema.stripeCustomerId, stripeCustomerId),
    });
  },

  // Update subscription details
  updateSubscription: async (id: string, subscriptionData: Organization) => {
    return db
      .update(organizationSchema)
      .set({
        ...subscriptionData,
        updatedAt: new Date(),
      })
      .where(eq(organizationSchema.id, id))
      .returning();
  },
};
