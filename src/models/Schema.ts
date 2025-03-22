import {
  bigint,
  boolean,
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

// View for project funding status
export const projectFundingStatusView = {
  name: 'project_funding_status',
  query: `
    SELECT 
      p.id,
      p.title,
      p.goal,
      p.raised,
      p.currency,
      p.status,
      p.end_date,
      CASE
        WHEN p.raised >= p.goal THEN 'fully funded'
        WHEN p.raised < p.goal AND p.end_date > NOW() THEN 'in progress'
        WHEN p.raised < p.goal AND p.end_date <= NOW() THEN 'unfunded'
        ELSE 'unknown'
      END AS funding_status,
      (p.raised / p.goal * 100)::numeric(5,2) AS funding_percentage
    FROM projects p
    WHERE p.deleted_at IS NULL
  `,
};

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
