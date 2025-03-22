import { and, count, eq, isNull, like } from 'drizzle-orm';

import { db } from '@/libs/DB';
import type { User } from '@/types/types';

import { usersSchema } from './Schema';
// ----------------- User Operations -----------------

type UserFilters = {
  verified: boolean;
  search: string;
  status: string;
  organizationId: string;
  role: string;
};

export const userOperations = {
  // Create new user
  create: async (userData: User) => {
    return db.insert(usersSchema).values(userData).returning();
  },

  // Find user by ID
  findById: async (id: string) => {
    return db.query.usersSchema.findFirst({
      where: eq(usersSchema.id, id),
    });
  },

  // Find user by email
  findByEmail: async (email: string) => {
    return db.query.usersSchema.findFirst({
      where: eq(usersSchema.email, email),
    });
  },

  // Update user
  update: async (id: string, userData: User) => {
    return db
      .update(usersSchema)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(usersSchema.id, id))
      .returning();
  },

  // Soft delete user
  softDelete: async (id: string) => {
    return db
      .update(usersSchema)
      .set({ deletedAt: new Date() })
      .where(eq(usersSchema.id, id))
      .returning();
  },

  // List users with pagination
  list: async (page = 1, limit = 10, filters: UserFilters = {
    verified: false,
    search: '',
    status: '',
    organizationId: '',
    role: '',
  }) => {
    const offset = (page - 1) * limit;
    const conditions = [isNull(usersSchema.deletedAt)];

    if (filters.role !== undefined) {
      conditions.push(like(usersSchema.role, `%${filters.role}%`));
    }
    if (filters.organizationId !== undefined) {
      conditions.push(eq(usersSchema.organizationId, filters.organizationId));
    }
    // Query publishers
    const users = await db
      .select()
      .from(usersSchema)
      .where(and(...conditions))
      .limit(limit)
      .offset(offset);

    // Count total publishers (using the same conditions)
    const totalCount = await db
      .select({ count: count() })
      .from(usersSchema)
      .where(and(...conditions));
    return {
      users,
      pagination: {
        total: totalCount[0]?.count,
        page,
        limit,
        pages: Math.ceil(totalCount[0]!.count / limit),
      },
    };
  },

  // Update password
  updatePassword: async (id: string, passwordHash: string) => {
    return db
      .update(usersSchema)
      .set({
        passwordHash,
        updatedAt: new Date(),
        passwordResetToken: null,
        passwordResetExpires: null,
      })
      .where(eq(usersSchema.id, id))
      .returning();
  },

  // Verify email
  verifyEmail: async (token: string) => {
    const user = await db.query.usersSchema.findFirst({
      where: eq(usersSchema.emailVerificationToken, token),
    });

    if (!user) {
      return null;
    }

    return db
      .update(usersSchema)
      .set({
        emailVerified: true,
        emailVerificationToken: null,
        updatedAt: new Date(),
      })
      .where(eq(usersSchema.id, user.id))
      .returning();
  },
};
