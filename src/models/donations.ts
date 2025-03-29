
import { and, asc, count, desc, eq, isNull, like } from 'drizzle-orm';

import { db } from '@/libs/DB';
import type { Project } from '@/types/types';
import { contributionsSchema, type TContribution } from './Schema';

type DonationsFilters = {
  id: string;
  backerId: string; // fixed typo: was "bakerId"
  paymentStatus: string;
  amount: number;
  featured: boolean;
  refunded: boolean;
  anonymous: boolean;
  search: string;
  status: string;
  sort: string;
};

export const donationsOperations = {
  // Create donation
  create: async (donation: TContribution) => {
    // Note: setting paymentStatus explicitly if needed
    return db
      .insert(contributionsSchema)
      .values({ ...donation, currency: 'USD', paymentStatus: donation.paymentStatus || 'pending', updatedAt: new Date() })
      .returning();
  },

  // Find donation by ID
  findById: async (id: string) => {
    return db.query.contributionsSchema.findFirst({
      where: eq(contributionsSchema.id, id),
    });
  },

  // Update donation
  update: async (id: string, donation: Project) => {
    return db
      .update(contributionsSchema)
      .set({ ...donation, currency: 'USD', updatedAt: new Date() })
      .where(eq(contributionsSchema.id, id))
      .returning();
  },

  // Soft delete donation
  softDelete: async (id: string) => {
    return db
      .update(contributionsSchema)
      .set({ deletedAt: new Date() })
      .where(eq(contributionsSchema.id, id))
      .returning();
  },

  // Refund donation
  refund: async (id: string) => {
    // Optionally: Verify current paymentStatus before refunding.
    const donation = await db.query.contributionsSchema.findFirst({
      where: eq(contributionsSchema.id, id),
    });
    if (!donation || donation.paymentStatus !== 'paid') {
      return null;
    }
    return db
      .update(contributionsSchema)
      .set({
        refunded: true,
        paymentStatus: 'refunded',
        updatedAt: new Date(),
      })
      .where(eq(contributionsSchema.id, id))
      .returning();
  },

  // List donations with pagination and filters
  list: async (
    page = 1,
    limit = 10,
    filters: DonationsFilters = {
      id: '',
      backerId: '',
      paymentStatus: '',
      amount: 0,
      featured: false,
      refunded: false,
      anonymous: false,
      search: '',
      status: '',
      sort: ''
    },
  ) => {
    const offset = (page - 1) * limit;

    const conditions = [isNull(contributionsSchema.deletedAt)];

    if (filters.backerId) {
      conditions.push(like(contributionsSchema.backerId, `%${filters.backerId}%`));
    }

    if (filters.search) {
      // Assuming you want to search in message field, adjust accordingly if a name field exists.
      conditions.push(like(contributionsSchema.message, `%${filters.search}%`));
    }

    // Apply sorting
    let orderByClause;
    switch (filters.sort) {
      case 'newest':
        orderByClause = desc(contributionsSchema.createdAt);
        break;
      // If endDate is defined in the future, add it to the schema; otherwise, remove or adjust this case.
      case 'ending_soon':
        // orderByClause = asc(contributionsSchema.endDate);
        // For now, fallback to createdAt if endDate is not available:
        orderByClause = asc(contributionsSchema.createdAt);
        break;
      case 'most_funded':
        orderByClause = desc(contributionsSchema.amount);
        break;
      case 'most_backed':
        // "raised" is not defined in the schema. To implement this, an aggregation or join would be needed.
        // For now, fallback to createdAt:
        orderByClause = desc(contributionsSchema.createdAt);
        break;
      default:
        orderByClause = desc(contributionsSchema.createdAt);
    }

    // Query donations
    const donations = await db
      .select()
      .from(contributionsSchema)
      .where(and(...conditions))
      .orderBy(orderByClause)
      .limit(limit)
      .offset(offset);

    // Count total donations (using the same conditions)
    const totalCount = await db
      .select({ count: count() })
      .from(contributionsSchema)
      .where(and(...conditions));

    return {
      donations,
      pagination: {
        total: totalCount[0]?.count,
        page,
        limit,
        pages: Math.ceil(totalCount[0]!.count / limit),
      },
    };
  },

  // Get refunded donations
  getRefundedDonations: async (limit = 6) => {
    return db
      .select()
      .from(contributionsSchema)
      .where(
        and(
          isNull(contributionsSchema.deletedAt),
          eq(contributionsSchema.refunded, true),
          eq(contributionsSchema.paymentStatus, 'refunded'),
        ),
      )
      .orderBy(desc(contributionsSchema.createdAt))
      .limit(limit);
  },

  // Get completed donations
  getCompletedDonations: async (limit = 6) => {
    return db
      .select()
      .from(contributionsSchema)
      .where(
        and(
          isNull(contributionsSchema.deletedAt),
          eq(contributionsSchema.refunded, false),
          eq(contributionsSchema.paymentStatus, 'paid'),
        ),
      )
      .orderBy(desc(contributionsSchema.createdAt))
      .limit(limit);
  },

  // Update donation status
  updateStatus: async (id: string, status: any) => {
    return db
      .update(contributionsSchema)
      .set({
        paymentStatus: status,
        updatedAt: new Date(),
      })
      .where(eq(contributionsSchema.id, id))
      .returning();
  },
  getDonationsByDateRange: async (startDate: Date, endDate: Date, limit = 10, page = 1) => {
    const offset = (page - 1) * limit;
    const conditions = [
      isNull(contributionsSchema.deletedAt),
      contributionsSchema.createdAt.gte(startDate),
      contributionsSchema.createdAt.lte(endDate),
    ];
  
    const donations = await db
      .select()
      .from(contributionsSchema)
      .where(and(...conditions))
      .orderBy(desc(contributionsSchema.createdAt))
      .limit(limit)
      .offset(offset);
  
    const totalCount = await db
      .select({ count: count() })
      .from(contributionsSchema)
      .where(and(...conditions));
  
    return {
      donations,
      pagination: {
        total: totalCount[0]?.count,
        page,
        limit,
        pages: Math.ceil(totalCount[0]!.count / limit),
      },
    };
  },
  getDonationSummaryByProject: async (projectId: string) => {
    const summary = await db
      .select({
        totalAmount: contributionsSchema.amount.sum(),
        totalDonations: count(),
      })
      .from(contributionsSchema)
      .where(
        and(
          isNull(contributionsSchema.deletedAt),
          eq(contributionsSchema.projectId, projectId)
        )
      );
  
    return summary[0];
  },
  getDonationsByBacker: async (backerId: string, limit = 10, page = 1) => {
    const offset = (page - 1) * limit;
    const conditions = [
      isNull(contributionsSchema.deletedAt),
      eq(contributionsSchema.backerId, backerId),
    ];
  
    const donations = await db
      .select()
      .from(contributionsSchema)
      .where(and(...conditions))
      .orderBy(desc(contributionsSchema.createdAt))
      .limit(limit)
      .offset(offset);
  
    const totalCount = await db
      .select({ count: count() })
      .from(contributionsSchema)
      .where(and(...conditions));
  
    return {
      donations,
      pagination: {
        total: totalCount[0]?.count,
        page,
        limit,
        pages: Math.ceil(totalCount[0]!.count / limit),
      },
    };
  },
  getDonationsByProject: async (projectId: string, limit = 10, page = 1) => {
    const offset = (page - 1) * limit;
    const conditions = [
      isNull(contributionsSchema.deletedAt),
      eq(contributionsSchema.projectId, projectId),
    ];
  
    const donations = await db
      .select()
      .from(contributionsSchema)
      .where(and(...conditions))
      .orderBy(desc(contributionsSchema.createdAt))
      .limit(limit)
      .offset(offset);
  
    const totalCount = await db
      .select({ count: count() })
      .from(contributionsSchema)
      .where(and(...conditions));
  
    return {
      donations,
      pagination: {
        total: totalCount[0]?.count,
        page,
        limit,
        pages: Math.ceil(totalCount[0]!.count / limit),
      },
    };
  },
        
};