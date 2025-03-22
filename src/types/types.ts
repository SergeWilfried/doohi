import type { currencyEnum, fulfillmentStatusEnum, mediaTypeEnum, moderationStatusEnum, notificationTypeEnum, projectStatusEnum, publisherTypeEnum, userRoleEnum } from '@/models/Schema';

import type { EnumValues } from './Enum';

// Enum types using the utility type
export type UserRole = EnumValues<typeof userRoleEnum>;
export type PublisherType = EnumValues<typeof publisherTypeEnum>;
export type FulfillmentStatus = EnumValues<typeof fulfillmentStatusEnum>;
export type ModerationStatus = EnumValues<typeof moderationStatusEnum>;
export type ProjectStatus = EnumValues<typeof projectStatusEnum>;
export type Currency = EnumValues<typeof currencyEnum>;
export type NotificationType = EnumValues<typeof notificationTypeEnum>;
export type MediaType = EnumValues<typeof mediaTypeEnum>;

// Common timestamp fields interface
export type Timestamps = {
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

// Categories
export type Category = {
  id: string;
  name: string;
  description: string | null;
  iconUrl: string | null;
  displayOrder: number | null;
} & Timestamps;

// Tags
export type Tag = {
  id: string;
  name: string;
} & Timestamps;

export type ProjectCategory = 'Education' | 'Community' | 'Technology' | 'Environment' | 'Arts & Culture' | 'Wellness';

// Organizations
export type Organization = {
  id: string;
  name: string;
  description: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  websiteUrl: string | null;
  logoUrl: string | null;
  verified: boolean;
} & Timestamps;

// Extended Organization with Stripe fields
export type OrganizationWithStripe = {
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripeSubscriptionPriceId: string | null;
  stripeSubscriptionStatus: string | null;
  stripeSubscriptionCurrentPeriodEnd: number | null;
} & Organization;

// Users
export type User = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  organizationId: string | null;
  emailVerified: boolean;
  emailVerificationToken: string | null;
  passwordResetToken: string | null;
  passwordResetExpires: Date | null;
  mfaEnabled: boolean;
  mfaSecret: string | null;
  profileImageUrl: string | null;
  bio: string | null;
  preferences: Record<string, any> | null;
  lastLoginAt: Date | null;
} & Timestamps;

// User follows
export type UserFollow = {
  id: string;
  followerId: string;
  followingId: string;
} & Timestamps;

// Publishers
export type Publisher = {
  id: string;
  name: string;
  description: string;
  totalProjects: number;
  totalFundsRaised: string;
  defaultCurrency: Currency | null;
  trustScore: number;
  yearFounded: number;
  socialLinks: Record<string, string> | null;
  verified: boolean;
} & Timestamps;

// Projects
export type Project = {
  id: string;
  title: string;
  subtitle: string | null;
  description: string;
  goal: string;
  minimumPledge: string;
  raised: string;
  currency: Currency;
  daysLeft: number | null;
  endDate: Date;
  status: ProjectStatus;
  featuredImage: string | null;
  publisherId: string | null;
  category: ProjectCategory; // Use the specific type here
  categoryId: string | null;
  publisherType: PublisherType;
  featured: boolean;
  viewCount: number;
  conversionRate: string;
  risks: string | null;
  faq: Array<{ question: string; answer: string }> | null;
} & Timestamps;

// Project media
export type ProjectMedia = {
  id: string;
  projectId: string;
  mediaType: MediaType;
  url: string;
  title: string | null;
  description: string | null;
  displayOrder: number | null;
} & Timestamps;

// Project tags
export type ProjectTag = {
  id: string;
  projectId: string;
  tagId: string;
} & Timestamps;

// Backers
export type Backer = {
  id: string;
  userId: string | null;
  totalAmountPledged: string;
  projectsBacked: number;
  bio: string | null;
  preferences: Record<string, any> | null;
} & Timestamps;

// Addresses
export type Address = {
  id: string;
  userId: string;
  name: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string | null;
  postalCode: string;
  country: string;
  phone: string | null;
  isDefault: boolean;
} & Timestamps;

// Rewards
export type Reward = {
  id: string;
  projectId: string;
  title: string;
  description: string;
  amountRequired: string;
  currency: Currency | null;
  quantityAvailable: number;
  quantityClaimed: number | null;
  estimatedDeliveryDate: Date | null;
  shippingRequired: boolean;
  shippingRestrictions: Record<string, any> | null;
  fulfillmentStatus: FulfillmentStatus;
} & Timestamps;

// Comments
export type Comment = {
  id: string;
  projectId: string;
  userId: string;
  commentText: string;
  parentCommentId: string | null;
  moderationStatus: ModerationStatus;
} & Timestamps;

// Updates
export type Update = {
  id: string;
  projectId: string;
  title: string;
  updateText: string;
  isPublic: boolean;
} & Timestamps;

// Contributions
export type Contribution = {
  id: string;
  backerId: string;
  projectId: string;
  rewardId: string | null;
  amount: string;
  currency: Currency | null;
  addressId: string | null;
  anonymous: boolean;
  message: string | null;
  transactionId: string | null;
  paymentStatus: string;
  refunded: boolean;
} & Timestamps;

// Notifications
export type Notification = {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  data: Record<string, any> | null;
} & Timestamps;

// Analytics events
export type AnalyticsEvent = {
  id: string;
  userId: string | null;
  projectId: string | null;
  eventType: string;
  eventData: Record<string, any> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
};

// View interfaces
export type ProjectFundingStatus = {
  id: string;
  title: string;
  goal: string;
  raised: string;
  currency: Currency | null;
  status: ProjectStatus;
  endDate: Date;
  fundingStatus: 'fully funded' | 'in progress' | 'unfunded' | 'unknown';
  fundingPercentage: string;
};

export type ProjectStatistics = {
  id: string;
  title: string;
  backer_count: number;
  average_contribution: number;
  goal: number;
  raised: number;
  currency: string;
  percentage_funded: number;
  comment_count: number;
  update_count: number;
  view_count: number;
  conversion_rate: number;
  status: string;
  created_at: Date;
  end_date: Date;
  days_remaining: number;
};
