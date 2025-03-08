import type { currencyEnum, fulfillmentStatusEnum, mediaTypeEnum, moderationStatusEnum, notificationTypeEnum, projectStatusEnum, publisherTypeEnum, userRoleEnum } from "@/models/Schema";
import type { EnumValues } from "./Enum";

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
export interface Timestamps {
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

// Categories
export interface Category extends Timestamps {
  id: string;
  name: string;
  description: string | null;
  iconUrl: string | null;
  displayOrder: number | null;
}

// Tags
export interface Tag extends Timestamps {
  id: string;
  name: string;
}

// Organizations
export interface Organization extends Timestamps {
  id: string;
  name: string;
  description: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  websiteUrl: string | null;
  logoUrl: string | null;
  verified: boolean;
}

// Extended Organization with Stripe fields
export interface OrganizationWithStripe extends Organization {
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripeSubscriptionPriceId: string | null;
  stripeSubscriptionStatus: string | null;
  stripeSubscriptionCurrentPeriodEnd: number | null;
}

// Users
export interface User extends Timestamps {
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
}

// User follows
export interface UserFollow extends Timestamps {
  id: string;
  followerId: string;
  followingId: string;
}

// Publishers
export interface Publisher extends Timestamps {
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
}

// Projects
export interface Project extends Timestamps {
  id: string;
  title: string;
  subtitle: string | null;
  description: string;
  goal: string;
  minimumPledge: string;
  raised: string;
  currency: Currency | null;
  daysLeft: number | null;
  endDate: Date;
  status: ProjectStatus;
  featuredImage: string | null;
  publisherId: string | null;
  categoryId: string | null;
  publisherType: PublisherType;
  featured: boolean;
  viewCount: number;
  conversionRate: string;
  risks: string | null;
  faq: Array<{ question: string; answer: string }> | null;
}

// Project media
export interface ProjectMedia extends Timestamps {
  id: string;
  projectId: string;
  mediaType: MediaType;
  url: string;
  title: string | null;
  description: string | null;
  displayOrder: number | null;
}

// Project tags
export interface ProjectTag extends Timestamps {
  id: string;
  projectId: string;
  tagId: string;
}

// Backers
export interface Backer extends Timestamps {
  id: string;
  userId: string | null;
  totalAmountPledged: string;
  projectsBacked: number;
  bio: string | null;
  preferences: Record<string, any> | null;
}

// Addresses
export interface Address extends Timestamps {
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
}

// Rewards
export interface Reward extends Timestamps {
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
}

// Comments
export interface Comment extends Timestamps {
  id: string;
  projectId: string;
  userId: string;
  commentText: string;
  parentCommentId: string | null;
  moderationStatus: ModerationStatus;
}

// Updates
export interface Update extends Timestamps {
  id: string;
  projectId: string;
  title: string;
  updateText: string;
  isPublic: boolean;
}

// Contributions
export interface Contribution extends Timestamps {
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
}

// Notifications
export interface Notification extends Timestamps {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  data: Record<string, any> | null;
}

// Analytics events
export interface AnalyticsEvent {
  id: string;
  userId: string | null;
  projectId: string | null;
  eventType: string;
  eventData: Record<string, any> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
}

// View interfaces
export interface ProjectFundingStatus {
  id: string;
  title: string;
  goal: string;
  raised: string;
  currency: Currency | null;
  status: ProjectStatus;
  endDate: Date;
  fundingStatus: 'fully funded' | 'in progress' | 'unfunded' | 'unknown';
  fundingPercentage: string;
}

export interface ProjectStatistics {
  id: string;
  title: string;
  backerCount: number;
  averageContribution: string;
  goal: string;
  raised: string;
  currency: Currency | null;
  percentageFunded: string;
  commentCount: number;
  updateCount: number;
  viewCount: number;
  conversionRate: string;
  status: ProjectStatus;
  createdAt: Date;
  endDate: Date;
  daysRemaining: number;
}
