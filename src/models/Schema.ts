import { relations, sql } from 'drizzle-orm';
import {
  bigint,
  boolean,
  date,
  decimal,
  index,
  integer,
  json,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import * as zod from 'zod';

// Define enums
export const userRoleEnum = pgEnum('user_role', ['backer', 'publisher', 'admin']);
export const publisherTypeEnum = pgEnum('publisher_type', ['user', 'organization']);
export const fulfillmentStatusEnum = pgEnum('fulfillment_status', ['pending', 'fulfilled', 'canceled']);
export const moderationStatusEnum = pgEnum('moderation_status', ['pending', 'approved', 'rejected']);
export const projectStatusEnum = pgEnum('project_status', ['draft', 'active', 'funded', 'expired', 'canceled']);
export const currencyEnum = pgEnum('currency', ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD']);
export const notificationTypeEnum = pgEnum('notification_type', ['project_update', 'comment', 'funding_goal', 'reward_fulfillment', 'system']);
export const mediaTypeEnum = pgEnum('media_type', ['image', 'video', 'document']);

// Base table mixin with common timestamp fields
const timestamps = {
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  deletedAt: timestamp('deleted_at', { mode: 'date' }),
};

// Categories table
export const categoriesSchema = pgTable(
  'categories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull().unique(),
    description: text('description'),
    iconUrl: text('icon_url'),
    displayOrder: integer('display_order'),
    ...timestamps,
  },
);

// Tags table
export const tagsSchema = pgTable(
  'tags',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull().unique(),
    ...timestamps,
  },
);

// Organizations table
export const organizationsSchema = pgTable(
  'organizations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull().unique(),
    description: text('description'),
    contactEmail: text('contact_email'),
    contactPhone: text('contact_phone'),
    websiteUrl: text('website_url'),
    logoUrl: text('logo_url'),
    verified: boolean('verified').default(false),
    ...timestamps,
  },
);
export const organizationSchema = pgTable(
  'organization',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull().unique(),
    description: text('description'),
    contactEmail: text('contact_email'),
    contactPhone: text('contact_phone'),
    websiteUrl: text('website_url'),
    logoUrl: text('logo_url'),
    verified: boolean('verified').default(false),
    stripeCustomerId: text('stripe_customer_id'),
    stripeSubscriptionId: text('stripe_subscription_id'),
    stripeSubscriptionPriceId: text('stripe_subscription_price_id'),
    stripeSubscriptionStatus: text('stripe_subscription_status'),
    stripeSubscriptionCurrentPeriodEnd: bigint(
      'stripe_subscription_current_period_end',
      { mode: 'number' },
    ),
    ...timestamps,
  },
  (table) => {
    return {
      stripeCustomerIdIdx: uniqueIndex('stripe_customer_id_idx').on(
        table.stripeCustomerId,
      ),
    };
  },
);
// Users table
export const usersSchema = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    email: text('email').notNull(),
    passwordHash: text('password_hash').notNull(),
    role: userRoleEnum('role').notNull().default('backer'),
    organizationId: uuid('organization_id').references(() => organizationsSchema.id),
    emailVerified: boolean('email_verified').default(false),
    emailVerificationToken: text('email_verification_token'),
    passwordResetToken: text('password_reset_token'),
    passwordResetExpires: timestamp('password_reset_expires', { mode: 'date' }),
    mfaEnabled: boolean('mfa_enabled').default(false),
    mfaSecret: text('mfa_secret'),
    profileImageUrl: text('profile_image_url'),
    bio: text('bio'),
    preferences: json('preferences'),
    lastLoginAt: timestamp('last_login_at', { mode: 'date' }),
    ...timestamps,
  },
  (table) => {
    return {
      emailIdx: uniqueIndex('email_idx').on(table.email),
    };
  },
);

// User follows table
export const userFollowsSchema = pgTable(
  'user_follows',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    followerId: uuid('follower_id').references(() => usersSchema.id).notNull(),
    followingId: uuid('following_id').references(() => usersSchema.id).notNull(),
    ...timestamps,
  },
  (table) => {
    return {
      followerIdx: index('follower_idx').on(table.followerId),
      followingIdx: index('following_idx').on(table.followingId),
      uniqueFollowIdx: uniqueIndex('unique_follow_idx').on(table.followerId, table.followingId),
    };
  },
);

// Publishers table
export const publishersSchema = pgTable(
  'publishers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    description: text('description').notNull(),
    totalProjects: integer('total_projects').notNull().default(0),
    totalFundsRaised: numeric('total_funds_raised').notNull().default('0'),
    defaultCurrency: currencyEnum('default_currency').default('USD'),
    trustScore: integer('trust_score').notNull().default(0),
    yearFounded: integer('year_founded').notNull(),
    socialLinks: json('social_links'),
    verified: boolean('verified').default(false),
    ...timestamps,
  },
);

// Projects table
export const projectsSchema = pgTable(
  'projects',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    title: text('title').notNull(),
    subtitle: text('subtitle'),
    description: text('description').notNull(),
    goal: numeric('goal').notNull(),
    minimumPledge: numeric('minimum_pledge').notNull().default('1'),
    raised: numeric('raised').notNull().default('0'),
    currency: currencyEnum('currency').default('USD'),
    daysLeft: integer('days_left'),
    endDate: timestamp('end_date', { mode: 'date' }).notNull(),
    status: projectStatusEnum('status').notNull().default('draft'),
    featuredImage: text('featured_image'),
    publisherId: uuid('publisher_id').references(() => publishersSchema.id),
    categoryId: uuid('category_id').references(() => categoriesSchema.id),
    publisherType: publisherTypeEnum('publisher_type').notNull().default('user'),
    featured: boolean('featured').default(false),
    viewCount: integer('view_count').default(0),
    conversionRate: numeric('conversion_rate').default('0'),
    risks: text('risks'),
    faq: json('faq'),
    ...timestamps,
  },
  (table) => {
    return {
      publisherIdIdx: index('idx_projects_publisher_id').on(table.publisherId),
      categoryIdIdx: index('idx_projects_category_id').on(table.categoryId),
      statusIdx: index('idx_projects_status').on(table.status),
      featuredIdx: index('idx_projects_featured').on(table.featured),
      endDateIdx: index('idx_projects_end_date').on(table.endDate),
    };
  },
);

// Project media table
export const projectMediaSchema = pgTable(
  'project_media',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id').references(() => projectsSchema.id).notNull(),
    mediaType: mediaTypeEnum('media_type').notNull(),
    url: text('url').notNull(),
    title: text('title'),
    description: text('description'),
    displayOrder: integer('display_order').default(0),
    ...timestamps,
  },
  (table) => {
    return {
      projectIdIdx: index('idx_project_media_project_id').on(table.projectId),
    };
  },
);

// Project tags table (many-to-many)
export const projectTagsSchema = pgTable(
  'project_tags',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id').references(() => projectsSchema.id).notNull(),
    tagId: uuid('tag_id').references(() => tagsSchema.id).notNull(),
    ...timestamps,
  },
  (table) => {
    return {
      projectIdIdx: index('idx_project_tags_project_id').on(table.projectId),
      tagIdIdx: index('idx_project_tags_tag_id').on(table.tagId),
      uniqueProjectTagIdx: uniqueIndex('unique_project_tag_idx').on(table.projectId, table.tagId),
    };
  },
);

// Backers table
export const backersSchema = pgTable(
  'backers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => usersSchema.id),
    totalAmountPledged: numeric('total_amount_pledged').notNull().default('0'),
    projectsBacked: integer('projects_backed').notNull().default(0),
    bio: text('bio'),
    preferences: json('preferences'),
    ...timestamps,
  },
  (table) => {
    return {
      userIdIdx: index('idx_backers_user_id').on(table.userId),
    };
  },
);

// Addresses table
export const addressesSchema = pgTable(
  'addresses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => usersSchema.id).notNull(),
    name: text('name').notNull(),
    line1: text('line1').notNull(),
    line2: text('line2'),
    city: text('city').notNull(),
    state: text('state'),
    postalCode: text('postal_code').notNull(),
    country: text('country').notNull(),
    phone: text('phone'),
    isDefault: boolean('is_default').default(false),
    ...timestamps,
  },
  (table) => {
    return {
      userIdIdx: index('idx_addresses_user_id').on(table.userId),
    };
  },
);

// Rewards table
export const rewardsSchema = pgTable(
  'rewards',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id').references(() => projectsSchema.id).notNull(),
    title: text('title').notNull(),
    description: text('description').notNull(),
    amountRequired: numeric('amount_required').notNull(),
    currency: currencyEnum('currency').default('USD'),
    quantityAvailable: integer('quantity_available').notNull(),
    quantityClaimed: integer('quantity_claimed').default(0),
    estimatedDeliveryDate: timestamp('estimated_delivery_date', { mode: 'date' }),
    shippingRequired: boolean('shipping_required').default(false),
    shippingRestrictions: json('shipping_restrictions'),
    fulfillmentStatus: fulfillmentStatusEnum('fulfillment_status').notNull().default('pending'),
    ...timestamps,
  },
  (table) => {
    return {
      projectIdIdx: index('idx_rewards_project_id').on(table.projectId),
    };
  },
);

// First declare the table type
export const commentsSchema = pgTable(
  'comments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id').references(() => projectsSchema.id).notNull(),
    userId: uuid('user_id').references(() => usersSchema.id).notNull(),
    commentText: text('comment_text').notNull(),
    // Use a self-reference with an arrow function to avoid the circular reference issue
    parentCommentId: uuid('parent_comment_id').references((): any => commentsSchema.id),
    moderationStatus: moderationStatusEnum('moderation_status').notNull().default('pending'),
    ...timestamps,
  },
  (table) => {
    return {
      projectIdIdx: index('idx_comments_project_id').on(table.projectId),
      userIdIdx: index('idx_comments_user_id').on(table.userId),
      parentCommentIdIdx: index('idx_comments_parent_comment_id').on(table.parentCommentId),
    };
  },
);

// Updates table
export const updatesSchema = pgTable(
  'updates',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id').references(() => projectsSchema.id).notNull(),
    title: text('title').notNull(),
    updateText: text('update_text').notNull(),
    isPublic: boolean('is_public').default(true),
    ...timestamps,
  },
  (table) => {
    return {
      projectIdIdx: index('idx_updates_project_id').on(table.projectId),
    };
  },
);

// Contributions table
export const contributionsSchema = pgTable(
  'contributions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    backerId: uuid('backer_id').references(() => backersSchema.id).notNull(),
    projectId: uuid('project_id').references(() => projectsSchema.id).notNull(),
    rewardId: uuid('reward_id').references(() => rewardsSchema.id),
    amount: numeric('amount').notNull(),
    currency: currencyEnum('currency').default('USD'),
    addressId: uuid('address_id').references(() => addressesSchema.id),
    anonymous: boolean('anonymous').default(false),
    message: text('message'),
    transactionId: text('transaction_id'),
    paymentStatus: text('payment_status').notNull().default('pending'),
    refunded: boolean('refunded').default(false),
    ...timestamps,
  },
  (table) => {
    return {
      backerIdIdx: index('idx_contributions_backer_id').on(table.backerId),
      projectIdIdx: index('idx_contributions_project_id').on(table.projectId),
      rewardIdIdx: index('idx_contributions_reward_id').on(table.rewardId),
    };
  },
);

// Notifications table
export const notificationsSchema = pgTable(
  'notifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => usersSchema.id).notNull(),
    type: notificationTypeEnum('type').notNull(),
    title: text('title').notNull(),
    message: text('message').notNull(),
    read: boolean('read').default(false),
    data: json('data'),
    ...timestamps,
  },
  (table) => {
    return {
      userIdIdx: index('idx_notifications_user_id').on(table.userId),
      readIdx: index('idx_notifications_read').on(table.read),
    };
  },
);

// Analytics events table
export const analyticsEventsSchema = pgTable(
  'analytics_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => usersSchema.id),
    projectId: uuid('project_id').references(() => projectsSchema.id),
    eventType: text('event_type').notNull(),
    eventData: json('event_data'),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => {
    return {
      userIdIdx: index('idx_analytics_events_user_id').on(table.userId),
      projectIdIdx: index('idx_analytics_events_project_id').on(table.projectId),
      eventTypeIdx: index('idx_analytics_events_event_type').on(table.eventType),
      createdAtIdx: index('idx_analytics_events_created_at').on(table.createdAt),
    };
  },
);

export const projectStats = pgTable('project_statistics', {
  id: text('id'),
  title: text('title'),
  backer_count: integer('backer_count'),
  average_contribution: decimal('average_contribution', { precision: 10, scale: 2 }),
  goal: decimal('goal'),
  raised: decimal('raised'),
  currency: text('currency'),
  percentage_funded: decimal('percentage_funded', { precision: 5, scale: 2 }),
  comment_count: integer('comment_count'),
  update_count: integer('update_count'),
  view_count: integer('view_count'),
  conversion_rate: decimal('conversion_rate'),
  status: text('status'),
  created_at: timestamp('created_at'),
  end_date: timestamp('end_date'),
  days_remaining: integer('days_remaining'),
});

// Define payout status enum
export const payoutStatusEnum = pgEnum('payout_status', [
  'pending',
  'processing',
  'completed',
  'failed',
  'canceled',
]);

// Define payout method enum
export const payoutMethodEnum = pgEnum('payout_method', [
  'bank_transfer',
  'paypal',
  'stripe',
  'check',
  'crypto',
]);

// Define payout frequency enum
export const payoutFrequencyEnum = pgEnum('payout_frequency', [
  'one_time',
  'weekly',
  'biweekly',
  'monthly',
]);

// Payment accounts table to store publisher payment details
export const paymentAccountsSchema = pgTable(
  'payment_accounts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    publisherId: uuid('publisher_id').references(() => publishersSchema.id).notNull(),
    accountType: payoutMethodEnum('account_type').notNull(),
    accountName: text('account_name').notNull(),
    accountEmail: text('account_email'),
    accountDetails: text('account_details'),
    routingNumber: text('routing_number'),
    accountNumber: text('account_number'),
    bankName: text('bank_name'),
    bankAddress: text('bank_address'),
    swiftCode: text('swift_code'),
    paypalEmail: text('paypal_email'),
    stripeAccountId: text('stripe_account_id'),
    isVerified: boolean('is_verified').default(false),
    isDefault: boolean('is_default').default(false),
    verificationDocuments: text('verification_documents'),
    ...timestamps,
  },
  (table) => {
    return {
      publisherIdIdx: index('idx_payment_accounts_publisher_id').on(table.publisherId),
      uniqueDefaultAccount: uniqueIndex('unique_default_account_per_publisher').on(
        table.publisherId,
        table.isDefault,
      ).where(sql`${table.isDefault} = true`),
    };
  },
);

// Relations for payment accounts
export const paymentAccountsRelations = relations(paymentAccountsSchema, ({ one }) => ({
  publisher: one(publishersSchema, {
    fields: [paymentAccountsSchema.publisherId],
    references: [publishersSchema.id],
  }),
}));

// Payout schedules table
export const payoutSchedulesSchema = pgTable(
  'payout_schedules',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    publisherId: uuid('publisher_id').references(() => publishersSchema.id).notNull(),
    projectId: uuid('project_id').references(() => projectsSchema.id),
    frequency: payoutFrequencyEnum('frequency').notNull(),
    nextPayoutDate: date('next_payout_date').notNull(),
    minimumPayoutAmount: numeric('minimum_payout_amount').notNull().default('100'),
    isActive: boolean('is_active').default(true),
    dayOfWeek: integer('day_of_week'), // 0-6 for weekly
    dayOfMonth: integer('day_of_month'), // 1-31 for monthly
    ...timestamps,
  },
  (table) => {
    return {
      publisherIdIdx: index('idx_payout_schedules_publisher_id').on(table.publisherId),
      projectIdIdx: index('idx_payout_schedules_project_id').on(table.projectId),
    };
  },
);

// Relations for payout schedules
export const payoutSchedulesRelations = relations(payoutSchedulesSchema, ({ one }) => ({
  publisher: one(publishersSchema, {
    fields: [payoutSchedulesSchema.publisherId],
    references: [publishersSchema.id],
  }),
  project: one(projectsSchema, {
    fields: [payoutSchedulesSchema.projectId],
    references: [projectsSchema.id],
  }),
}));

// Payouts table for actual payouts
export const payoutsSchema = pgTable(
  'payouts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    publisherId: uuid('publisher_id').references(() => publishersSchema.id).notNull(),
    projectId: uuid('project_id').references(() => projectsSchema.id),
    paymentAccountId: uuid('payment_account_id').references(() => paymentAccountsSchema.id).notNull(),
    amount: numeric('amount').notNull(),
    fee: numeric('fee').notNull().default('0'),
    netAmount: numeric('net_amount').notNull(),
    currency: text('currency').notNull().default('USD'),
    status: payoutStatusEnum('status').notNull().default('pending'),
    scheduledDate: date('scheduled_date'),
    processedDate: timestamp('processed_date', { mode: 'date' }),
    transactionId: text('transaction_id'),
    reference: text('reference'),
    notes: text('notes'),
    processedBy: uuid('processed_by').references(() => usersSchema.id),
    failureReason: text('failure_reason'),
    batchId: text('batch_id'), // For grouping multiple payouts processed together
    ...timestamps,
  },
  (table) => {
    return {
      publisherIdIdx: index('idx_payouts_publisher_id').on(table.publisherId),
      projectIdIdx: index('idx_payouts_project_id').on(table.projectId),
      paymentAccountIdIdx: index('idx_payouts_payment_account_id').on(table.paymentAccountId),
      statusIdx: index('idx_payouts_status').on(table.status),
      scheduledDateIdx: index('idx_payouts_scheduled_date').on(table.scheduledDate),
      batchIdIdx: index('idx_payouts_batch_id').on(table.batchId),
    };
  },
);

// Relations for payouts
export const payoutsRelations = relations(payoutsSchema, ({ one }) => ({
  publisher: one(publishersSchema, {
    fields: [payoutsSchema.publisherId],
    references: [publishersSchema.id],
  }),
  project: one(projectsSchema, {
    fields: [payoutsSchema.projectId],
    references: [projectsSchema.id],
  }),
  paymentAccount: one(paymentAccountsSchema, {
    fields: [payoutsSchema.paymentAccountId],
    references: [paymentAccountsSchema.id],
  }),
  processor: one(usersSchema, {
    fields: [payoutsSchema.processedBy],
    references: [usersSchema.id],
  }),
}));

// Tax information table
export const taxInformationSchema = pgTable(
  'tax_information',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    publisherId: uuid('publisher_id').references(() => publishersSchema.id).notNull(),
    taxIdType: text('tax_id_type').notNull(), // SSN, EIN, VAT, etc.
    taxIdNumber: text('tax_id_number').notNull(),
    legalName: text('legal_name').notNull(),
    businessType: text('business_type'), // Individual, LLC, Corporation, etc.
    taxCountry: text('tax_country').notNull(),
    taxState: text('tax_state'),
    taxFormSubmitted: boolean('tax_form_submitted').default(false),
    taxFormType: text('tax_form_type'), // W-9, W-8BEN, etc.
    taxFormSubmissionDate: timestamp('tax_form_submission_date', { mode: 'date' }),
    taxFormVerified: boolean('tax_form_verified').default(false),
    taxFormVerificationDate: timestamp('tax_form_verification_date', { mode: 'date' }),
    taxWithholdingRate: numeric('tax_withholding_rate').default('0'),
    ...timestamps,
  },
  (table) => {
    return {
      publisherIdIdx: index('idx_tax_information_publisher_id').on(table.publisherId),
      uniquePublisherTaxInfo: uniqueIndex('unique_publisher_tax_info').on(table.publisherId),
    };
  },
);

// Relations for tax information
export const taxInformationRelations = relations(taxInformationSchema, ({ one }) => ({
  publisher: one(publishersSchema, {
    fields: [taxInformationSchema.publisherId],
    references: [publishersSchema.id],
  }),
}));

// Payout logs for detailed tracking and auditing
export const payoutLogsSchema = pgTable(
  'payout_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    payoutId: uuid('payout_id').references(() => payoutsSchema.id).notNull(),
    action: text('action').notNull(), // created, updated, processed, failed, etc.
    status: payoutStatusEnum('status').notNull(),
    message: text('message'),
    metadata: text('metadata'),
    performedBy: uuid('performed_by').references(() => usersSchema.id),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => {
    return {
      payoutIdIdx: index('idx_payout_logs_payout_id').on(table.payoutId),
      actionIdx: index('idx_payout_logs_action').on(table.action),
      statusIdx: index('idx_payout_logs_status').on(table.status),
      createdAtIdx: index('idx_payout_logs_created_at').on(table.createdAt),
    };
  },
);

// Relations for Categories
export const categoriesRelations = relations(categoriesSchema, ({ many }) => ({
  projects: many(projectsSchema),
}));

// Relations for Tags
export const tagsRelations = relations(tagsSchema, ({ many }) => ({
  projectTags: many(projectTagsSchema),
}));

// Relations for Organizations
export const organizationsRelations = relations(organizationsSchema, ({ many }) => ({
  users: many(usersSchema),
}));

// Relations for Organization (single)
export const organizationRelations = relations(organizationSchema, ({ many }) => ({
  users: many(usersSchema),
}));

// Relations for Users
export const usersRelations = relations(usersSchema, ({ one, many }) => ({
  organization: one(organizationsSchema, {
    fields: [usersSchema.organizationId],
    references: [organizationsSchema.id],
  }),
  addresses: many(addressesSchema),
  notifications: many(notificationsSchema),
  comments: many(commentsSchema),
  followers: many(userFollowsSchema, { relationName: 'followers' }),
  following: many(userFollowsSchema, { relationName: 'following' }),
  backerProfile: one(backersSchema, {
    fields: [usersSchema.id],
    references: [backersSchema.userId],
  }),
  analyticsEvents: many(analyticsEventsSchema),
}));

// Relations for User Follows
export const userFollowsRelations = relations(userFollowsSchema, ({ one }) => ({
  follower: one(usersSchema, {
    fields: [userFollowsSchema.followerId],
    references: [usersSchema.id],
    relationName: 'followers',
  }),
  following: one(usersSchema, {
    fields: [userFollowsSchema.followingId],
    references: [usersSchema.id],
    relationName: 'following',
  }),
}));

// Relations for Publishers
export const publishersRelations = relations(publishersSchema, ({ many, one }) => ({
  projects: many(projectsSchema),
  paymentAccounts: many(paymentAccountsSchema),
  payoutSchedules: many(payoutSchedulesSchema),
  payouts: many(payoutsSchema),
  taxInformation: one(taxInformationSchema, {
    fields: [publishersSchema.id],
    references: [taxInformationSchema.publisherId],
  }),
}));

// Relations for Projects
export const projectsRelations = relations(projectsSchema, ({ one, many }) => ({
  publisher: one(publishersSchema, {
    fields: [projectsSchema.publisherId],
    references: [publishersSchema.id],
  }),
  category: one(categoriesSchema, {
    fields: [projectsSchema.categoryId],
    references: [categoriesSchema.id],
  }),
  media: many(projectMediaSchema),
  projectTags: many(projectTagsSchema),
  rewards: many(rewardsSchema),
  comments: many(commentsSchema),
  updates: many(updatesSchema),
  contributions: many(contributionsSchema),
  analyticsEvents: many(analyticsEventsSchema),
  payouts: many(payoutsSchema),
  payoutSchedules: many(payoutSchedulesSchema),
}));

// Relations for Project Media
export const projectMediaRelations = relations(projectMediaSchema, ({ one }) => ({
  project: one(projectsSchema, {
    fields: [projectMediaSchema.projectId],
    references: [projectsSchema.id],
  }),
}));

// Relations for Project Tags
export const projectTagsRelations = relations(projectTagsSchema, ({ one }) => ({
  project: one(projectsSchema, {
    fields: [projectTagsSchema.projectId],
    references: [projectsSchema.id],
  }),
  tag: one(tagsSchema, {
    fields: [projectTagsSchema.tagId],
    references: [tagsSchema.id],
  }),
}));

// Relations for Backers
export const backersRelations = relations(backersSchema, ({ one, many }) => ({
  user: one(usersSchema, {
    fields: [backersSchema.userId],
    references: [usersSchema.id],
  }),
  contributions: many(contributionsSchema),
}));

// Relations for Addresses
export const addressesRelations = relations(addressesSchema, ({ one, many }) => ({
  user: one(usersSchema, {
    fields: [addressesSchema.userId],
    references: [usersSchema.id],
  }),
  contributions: many(contributionsSchema),
}));

// Relations for Rewards
export const rewardsRelations = relations(rewardsSchema, ({ one, many }) => ({
  project: one(projectsSchema, {
    fields: [rewardsSchema.projectId],
    references: [projectsSchema.id],
  }),
  contributions: many(contributionsSchema),
}));

// Relations for Comments
export const commentsRelations = relations(commentsSchema, ({ one, many }) => ({
  project: one(projectsSchema, {
    fields: [commentsSchema.projectId],
    references: [projectsSchema.id],
  }),
  user: one(usersSchema, {
    fields: [commentsSchema.userId],
    references: [usersSchema.id],
  }),
  parentComment: one(commentsSchema, {
    fields: [commentsSchema.parentCommentId],
    references: [commentsSchema.id],
  }),
  replies: many(commentsSchema),
}));

// Relations for Updates
export const updatesRelations = relations(updatesSchema, ({ one }) => ({
  project: one(projectsSchema, {
    fields: [updatesSchema.projectId],
    references: [projectsSchema.id],
  }),
}));

// Relations for Contributions
export const contributionsRelations = relations(contributionsSchema, ({ one }) => ({
  backer: one(backersSchema, {
    fields: [contributionsSchema.backerId],
    references: [backersSchema.id],
  }),
  project: one(projectsSchema, {
    fields: [contributionsSchema.projectId],
    references: [projectsSchema.id],
  }),
  reward: one(rewardsSchema, {
    fields: [contributionsSchema.rewardId],
    references: [rewardsSchema.id],
  }),
  address: one(addressesSchema, {
    fields: [contributionsSchema.addressId],
    references: [addressesSchema.id],
  }),
}));

// Relations for Notifications
export const notificationsRelations = relations(notificationsSchema, ({ one }) => ({
  user: one(usersSchema, {
    fields: [notificationsSchema.userId],
    references: [usersSchema.id],
  }),
}));

// Relations for Analytics Events
export const analyticsEventsRelations = relations(analyticsEventsSchema, ({ one }) => ({
  user: one(usersSchema, {
    fields: [analyticsEventsSchema.userId],
    references: [usersSchema.id],
  }),
  project: one(projectsSchema, {
    fields: [analyticsEventsSchema.projectId],
    references: [projectsSchema.id],
  }),
}));

// Category types
export const CategorySchema = createSelectSchema(categoriesSchema);
export const NewCategorySchema = createInsertSchema(categoriesSchema).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});
export type TCategory = zod.infer<typeof CategorySchema>;
export type TNewCategory = zod.infer<typeof NewCategorySchema>;

// Tag types
export const TagSchema = createSelectSchema(tagsSchema);
export const NewTagSchema = createInsertSchema(tagsSchema).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});
export type TTag = zod.infer<typeof TagSchema>;
export type TNewTag = zod.infer<typeof NewTagSchema>;

// Organization types
export const OrganizationSchema = createSelectSchema(organizationsSchema);
export const NewOrganizationSchema = createInsertSchema(organizationsSchema).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});
export type TOrganization = zod.infer<typeof OrganizationSchema>;
export type TNewOrganization = zod.infer<typeof NewOrganizationSchema>;

// User types
export const UserSchema = createSelectSchema(usersSchema);
export const NewUserSchema = createInsertSchema(usersSchema).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  lastLoginAt: true,
});
export type TUser = zod.infer<typeof UserSchema>;
export type TNewUser = zod.infer<typeof NewUserSchema>;

// UserFollow types
export const UserFollowSchema = createSelectSchema(userFollowsSchema);
export const NewUserFollowSchema = createInsertSchema(userFollowsSchema).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});
export type TUserFollow = zod.infer<typeof UserFollowSchema>;
export type TNewUserFollow = zod.infer<typeof NewUserFollowSchema>;

// Publisher types
export const PublisherSchema = createSelectSchema(publishersSchema);
export const NewPublisherSchema = createInsertSchema(publishersSchema).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});
export type TPublisher = zod.infer<typeof PublisherSchema>;
export type TNewPublisher = zod.infer<typeof NewPublisherSchema>;

// Project types
export const ProjectSchema = createSelectSchema(projectsSchema);
export const NewProjectSchema = createInsertSchema(projectsSchema).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});
export type TProject = zod.infer<typeof ProjectSchema>;
export type TNewProject = zod.infer<typeof NewProjectSchema>;

// ProjectMedia types
export const ProjectMediaSchema = createSelectSchema(projectMediaSchema);
export const NewProjectMediaSchema = createInsertSchema(projectMediaSchema).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});
export type TProjectMedia = zod.infer<typeof ProjectMediaSchema>;
export type TNewProjectMedia = zod.infer<typeof NewProjectMediaSchema>;

// ProjectTag types
export const ProjectTagSchema = createSelectSchema(projectTagsSchema);
export const NewProjectTagSchema = createInsertSchema(projectTagsSchema).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});
export type TProjectTag = zod.infer<typeof ProjectTagSchema>;
export type TNewProjectTag = zod.infer<typeof NewProjectTagSchema>;

// Backer types
export const BackerSchema = createSelectSchema(backersSchema);
export const NewBackerSchema = createInsertSchema(backersSchema).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});
export type TBacker = zod.infer<typeof BackerSchema>;
export type TNewBacker = zod.infer<typeof NewBackerSchema>;

// Address types
export const AddressSchema = createSelectSchema(addressesSchema);
export const NewAddressSchema = createInsertSchema(addressesSchema).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});
export type TAddress = zod.infer<typeof AddressSchema>;
export type TNewAddress = zod.infer<typeof NewAddressSchema>;

// Reward types
export const RewardSchema = createSelectSchema(rewardsSchema);
export const NewRewardSchema = createInsertSchema(rewardsSchema).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});
export type TReward = zod.infer<typeof RewardSchema>;
export type TNewReward = zod.infer<typeof NewRewardSchema>;

// Comment types
export const CommentSchema = createSelectSchema(commentsSchema);
export const NewCommentSchema = createInsertSchema(commentsSchema).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});
export type TComment = zod.infer<typeof CommentSchema>;
export type TNewComment = zod.infer<typeof NewCommentSchema>;

// Update types
export const UpdateSchema = createSelectSchema(updatesSchema);
export const NewUpdateSchema = createInsertSchema(updatesSchema).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});
export type TUpdate = zod.infer<typeof UpdateSchema>;
export type TNewUpdate = zod.infer<typeof NewUpdateSchema>;

// Contribution types
export const ContributionSchema = createSelectSchema(contributionsSchema);
export const NewContributionSchema = createInsertSchema(contributionsSchema).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});
export type TContribution = zod.infer<typeof ContributionSchema>;
export type TNewContribution = zod.infer<typeof NewContributionSchema>;

// Notification types
export const NotificationSchema = createSelectSchema(notificationsSchema);
export const NewNotificationSchema = createInsertSchema(notificationsSchema).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});
export type TNotification = zod.infer<typeof NotificationSchema>;
export type TNewNotification = zod.infer<typeof NewNotificationSchema>;

// AnalyticsEvent types
export const AnalyticsEventSchema = createSelectSchema(analyticsEventsSchema);
export const NewAnalyticsEventSchema = createInsertSchema(analyticsEventsSchema).omit({
  id: true,
  createdAt: true,
});
export type TAnalyticsEvent = zod.infer<typeof AnalyticsEventSchema>;
export type TNewAnalyticsEvent = zod.infer<typeof NewAnalyticsEventSchema>;

// Project Statistics types
export const ProjectStatSchema = createSelectSchema(projectStats);
export type TProjectStat = zod.infer<typeof ProjectStatSchema>;

// Relations for payout logs
export const payoutLogsRelations = relations(payoutLogsSchema, ({ one }) => ({
  payout: one(payoutsSchema, {
    fields: [payoutLogsSchema.payoutId],
    references: [payoutsSchema.id],
  }),
  performer: one(usersSchema, {
    fields: [payoutLogsSchema.performedBy],
    references: [usersSchema.id],
  }),
}));

// Create Zod schemas for validation
export const PaymentAccountSchema = createSelectSchema(paymentAccountsSchema);
export const NewPaymentAccountSchema = createInsertSchema(paymentAccountsSchema).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});

export const PayoutScheduleSchema = createSelectSchema(payoutSchedulesSchema);
export const NewPayoutScheduleSchema = createInsertSchema(payoutSchedulesSchema).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});

export const PayoutSchema = createSelectSchema(payoutsSchema);
export const NewPayoutSchema = createInsertSchema(payoutsSchema).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
}).extend({
  // Additional validation for new payouts
  amount: zod.string().regex(/^\d+(\.\d{1,2})?$/, {
    message: 'Amount must be a valid currency amount with up to 2 decimal places',
  }),
  fee: zod.string().regex(/^\d+(\.\d{1,2})?$/, {
    message: 'Fee must be a valid currency amount with up to 2 decimal places',
  }),
  netAmount: zod.string().regex(/^\d+(\.\d{1,2})?$/, {
    message: 'Net amount must be a valid currency amount with up to 2 decimal places',
  }),
});

export const TaxInformationSchema = createSelectSchema(taxInformationSchema);
export const NewTaxInformationSchema = createInsertSchema(taxInformationSchema).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
}).extend({
  // Enhanced validation for tax ID based on country
  taxIdNumber: zod.string().min(8).max(20),
  taxWithholdingRate: zod.string().regex(/^\d+(\.\d{1,2})?$/, {
    message: 'Withholding rate must be a valid percentage with up to 2 decimal places',
  }),
});

export const PayoutLogSchema = createSelectSchema(payoutLogsSchema);
export const NewPayoutLogSchema = createInsertSchema(payoutLogsSchema).omit({
  id: true,
  createdAt: true,
});

// TypeScript type definitions
export type TPaymentAccount = zod.infer<typeof PaymentAccountSchema>;
export type TNewPaymentAccount = zod.infer<typeof NewPaymentAccountSchema>;

export type TPayoutSchedule = zod.infer<typeof PayoutScheduleSchema>;
export type TNewPayoutSchedule = zod.infer<typeof NewPayoutScheduleSchema>;

export type TPayout = zod.infer<typeof PayoutSchema>;
export type TNewPayout = zod.infer<typeof NewPayoutSchema>;

export type TTaxInformation = zod.infer<typeof TaxInformationSchema>;
export type TNewTaxInformation = zod.infer<typeof NewTaxInformationSchema>;

export type TPayoutLog = zod.infer<typeof PayoutLogSchema>;
export type TNewPayoutLog = zod.infer<typeof NewPayoutLogSchema>;
