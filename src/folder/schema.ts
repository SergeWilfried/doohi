import { currencyEnum, publisherTypeEnum, userRoleEnum } from "@/models/Schema";
import { z } from "zod";

// Custom Zod transformer for monetary values
const monetaryString = () => z.string()
  .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: "Must be a valid positive number"
  })
  .transform((val) => parseFloat(val));

// User preferences schema - more specific than Record<string, any>
const preferencesSchema = z.object({
  emailNotifications: z.boolean().optional(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
  language: z.string().optional(),
  // Add other specific preference fields as needed
}).catchall(z.unknown()); // Allow additional unknown properties while maintaining some type safety

// Zod validation schemas for input validation
export const categorySchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional().nullable(),
  iconUrl: z.string().url().optional().nullable(),
  displayOrder: z.number().int().optional().nullable(),
});

export const tagSchema = z.object({
  name: z.string().min(1).max(100),
});


// Social links schema for more specific validation
const socialLinksSchema = z.object({
  website: z.string().url().optional(),
  twitter: z.string().url().optional(),
  facebook: z.string().url().optional(),
  linkedin: z.string().url().optional(),
  instagram: z.string().url().optional(),
  github: z.string().url().optional(),
}).catchall(z.string().url()); // Allow other social networks while ensuring they are URLs

export const organizationSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional().nullable(),
  contactEmail: z.string().email().optional().nullable(),
  contactPhone: z.string().max(20).optional().nullable(),
  websiteUrl: z.string().url().optional().nullable(),
  logoUrl: z.string().url().optional().nullable(),
  socialLinks: socialLinksSchema.optional(),
  verified: z.boolean().default(false),
});

export const userSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(userRoleEnum.enumValues).default('backer'),
  organizationId: z.string().uuid().optional().nullable(),
  profileImageUrl: z.string().url().optional().nullable(),
  bio: z.string().max(500).optional().nullable(),
  preferences: preferencesSchema.optional().nullable(),
});

export const publisherSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().min(1),
  defaultCurrency: z.enum(currencyEnum.enumValues).optional(),
  yearFounded: z.number().int().min(1800).max(new Date().getFullYear()),
  socialLinks: z.record(z.string().url()).optional().nullable(),
});


export const projectSchema = z.object({
  title: z.string().min(1).max(255),
  subtitle: z.string().max(255).optional().nullable(),
  description: z.string().min(1),
  goal: monetaryString(), // Using custom transformer
  minimumPledge: monetaryString(), // Using custom transformer
  currency: z.enum(currencyEnum.enumValues).optional(),
  endDate: z.date().refine((date) => date > new Date(), { message: "End date must be in the future" }),
  publisherId: z.string().uuid().optional().nullable(),
  categoryId: z.string().uuid().optional().nullable(),
  publisherType: z.enum(publisherTypeEnum.enumValues).default('user'),
  featuredImage: z.string().url().optional().nullable(),
  risks: z.string().optional().nullable(),
  faq: z.array(z.object({
    question: z.string().min(1),
    answer: z.string().min(1)
  })).optional().nullable(),
});

// Shipping restrictions schema for more specific validation
const shippingRestrictionsSchema = z.object({
  countries: z.array(z.string()).optional(),
  regions: z.array(z.string()).optional(),
  additionalFees: z.record(z.string(), monetaryString()).optional(),
}).catchall(z.unknown());

export const rewardSchema = z.object({
  projectId: z.string().uuid(),
  title: z.string().min(1).max(255),
  description: z.string().min(1),
  amountRequired: monetaryString(), // Using custom transformer
  currency: z.enum(currencyEnum.enumValues).optional(),
  quantityAvailable: z.number().int().min(0),
  estimatedDeliveryDate: z.date().optional().nullable(),
  shippingRequired: z.boolean().default(false),
  shippingRestrictions: shippingRestrictionsSchema.optional().nullable(),
});

export const contributionSchema = z.object({
  backerId: z.string().uuid(),
  projectId: z.string().uuid(),
  rewardId: z.string().uuid().optional().nullable(),
  amount: monetaryString(), // Using custom transformer
  currency: z.enum(currencyEnum.enumValues).optional(),
  addressId: z.string().uuid().optional().nullable(),
  anonymous: z.boolean().default(false),
  message: z.string().max(500).optional().nullable(),
});

export const commentSchema = z.object({
  projectId: z.string().uuid(),
  userId: z.string().uuid(),
  commentText: z.string().min(1),
  parentCommentId: z.string().uuid().optional().nullable(),
});

export const updateSchema = z.object({
  projectId: z.string().uuid(),
  title: z.string().min(1).max(255),
  updateText: z.string().min(1),
  isPublic: z.boolean().default(true),
});

export const addressSchema = z.object({
  userId: z.string().uuid(),
  name: z.string().min(1).max(255),
  line1: z.string().min(1).max(255),
  line2: z.string().max(255).optional().nullable(),
  city: z.string().min(1).max(100),
  state: z.string().max(100).optional().nullable(),
  postalCode: z.string().min(1).max(20),
  country: z.string().min(1).max(100),
  phone: z.string().max(20).optional().nullable(),
  isDefault: z.boolean().default(false),
});
