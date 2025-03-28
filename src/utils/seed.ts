import { addressesSchema, backersSchema, categoriesSchema, organizationsSchema, paymentAccountsSchema, payoutSchedulesSchema, projectMediaSchema, projectsSchema, projectTagsSchema, publishersSchema, rewardsSchema, tagsSchema, taxInformationSchema, userFollowsSchema, usersSchema, type TNewCategory, type TNewOrganization, type TNewTag, type TNewUser } from '@/models/Schema';
import { faker } from '@faker-js/faker';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';
config({ path: '.env' });
const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

// Helper function to generate random amount within a range
const randomAmount = (min: number, max: number, decimals = 2): string => {
  const value = min + Math.random() * (max - min);
  return value.toFixed(decimals);
};

// Main seeding function
async function seed() {
  console.log('🌱 Starting database seeding...');
  
  try {
    // Seed categories
    console.log('Seeding categories...');
    const categoryIds = await seedCategories(8);
    
    // Seed tags
    console.log('Seeding tags...');
    const tagIds = await seedTags(20);
    
    // Seed organizations
    console.log('Seeding organizations...');
    const organizationIds = await seedOrganizations(5);
    
    // Seed users
    console.log('Seeding users...');
    const userIds = await seedUsers(30, organizationIds);
    
    // Seed user follows
    console.log('Seeding user follows...');
    await seedUserFollows(userIds, 50);
    
    // Seed publishers
    console.log('Seeding publishers...');
    const publisherIds = await seedPublishers(10);
    
    // Seed payment accounts
    console.log('Seeding payment accounts...');
    await seedPaymentAccounts(publisherIds);
    
    // Seed tax information
    console.log('Seeding tax information...');
    await seedTaxInformation(publisherIds);
    
    // Seed projects
    console.log('Seeding projects...');
    const projectIds = await seedProjects(20, publisherIds, categoryIds);
    
    // Seed project media
    console.log('Seeding project media...');
    await seedProjectMedia(projectIds);
    
    // Seed project tags
    console.log('Seeding project tags...');
    await seedProjectTags(projectIds, tagIds);
    
    // Seed payout schedules
    console.log('Seeding payout schedules...');
    await seedPayoutSchedules(publisherIds, projectIds);
    
    // Seed backers
    console.log('Seeding backers...');
    const backerIds = await seedBackers(userIds);
    
    // Seed addresses
    console.log('Seeding addresses...');
    const addressIds = await seedAddresses(userIds);
    
    // Seed rewards
    console.log('Seeding rewards...');
    const rewardIds = await seedRewards(projectIds);
    
    // Seed contributions
    console.log('Seeding contributions...');
    await seedContributions(backerIds, projectIds, rewardIds, addressIds);
       
    console.log('✅ Seeding completed successfully!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    // Close database connection
  }
}

// Seed individual tables
async function seedCategories(count: number): Promise<string[]> {
  const categories: TNewCategory[] = [];
  const icons = [
    'technology', 'games', 'design', 'film', 'food', 
    'art', 'music', 'comics', 'fashion', 'publishing'
  ];
  
  for (let i = 0; i < count; i++) {
    categories.push({
      name: icons[i] || faker.commerce.department(),
      description: faker.lorem.paragraph(),
      iconUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${i}`,
      displayOrder: i + 1,
    });
  }
  
  const result = await db.insert(categoriesSchema).values(categories).returning();
  return result.map(r => r.id);
}

async function seedTags(count: number): Promise<string[]> {
  const generatedTags: Set<string> = new Set();
  const tags: TNewTag[] = [];
  
  while (generatedTags.size < count) {
    const tagName = faker.word.sample();
    if (!generatedTags.has(tagName)) {
      generatedTags.add(tagName);
      tags.push({ name: tagName });
    }
  }
  
  const result = await db.insert(tagsSchema).values(tags).returning();
  return result.map(r => r.id);
}

async function seedOrganizations(count: number): Promise<string[]> {
  const organizations: TNewOrganization[] = [];
  
  for (let i = 0; i < count; i++) {
    organizations.push({
      name: faker.company.name(),
      description: faker.company.catchPhrase(),
      contactEmail: faker.internet.email(),
      contactPhone: faker.phone.number(),
      websiteUrl: faker.internet.url(),
      logoUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${faker.string.uuid()}`,
      verified: Math.random() > 0.7,
    });
  }
  
  const result = await db.insert(organizationsSchema).values(organizations).returning();
  return result.map(r => r.id);
}

async function seedUsers(count: number, organizationIds: string[]): Promise<string[]> {
  const users: TNewUser[] = [];
  const roles = ['backer', 'publisher', 'admin'] as const;
  
  for (let i = 0; i < count; i++) {
    const role = roles[Math.floor(Math.random() * (roles.length - (i < 3 ? 0 : 1)))]; // Ensure at least one of each role
    users.push({
      name: faker.person.fullName(),
      email: faker.internet.email(),
      passwordHash: '$2a$10$X7oKTpLzrVuZHxDfs2SquOaYXzxsWmCHF8.ioINeJJzC0kxVFEHJq', // "password"
      role,
      organizationId: role === 'admin' ? organizationIds[Math.floor(Math.random() * organizationIds.length)] : null,
      emailVerified: Math.random() > 0.2,
      emailVerificationToken: Math.random() > 0.8 ? faker.string.alphanumeric(32) : null,
      passwordResetToken: null,
      passwordResetExpires: null,
      mfaEnabled: Math.random() > 0.8,
      mfaSecret: null,
      profileImageUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${faker.string.uuid()}`,
      bio: faker.person.bio(),
      preferences: { emailNotifications: true, darkMode: Math.random() > 0.5 },
    });
  }
  
  const result = await db.insert(usersSchema).values(users).returning();
  return result.map(r => r.id);
}

async function seedUserFollows(userIds: string[], count: number): Promise<void> {
  const follows: { followerId: string; followingId: string }[] = [];
  
  for (let i = 0; i < count; i++) {
    const followerId = userIds[Math.floor(Math.random() * userIds.length)] as string;
    let followingId: string;
    
    do {
      followingId = userIds[Math.floor(Math.random() * userIds.length)] as string;
    } while (followerId === followingId);
    
    // Check if this relationship already exists in our array
    const exists = follows.some(f => f.followerId === followerId && f.followingId === followingId);
    
    if (!exists) {
      follows.push({
        followerId,
        followingId,
      });
    }
  }
  
  if (follows.length > 0) {
    await db.insert(userFollowsSchema).values(follows);
  }
}

async function seedPublishers(count: number): Promise<string[]> {
  const publishers = [];
  
  for (let i = 0; i < count; i++) {
    publishers.push({
      id: faker.string.uuid(),
      name: faker.company.name(),
      description: faker.company.catchPhrase(),
      totalProjects: Math.floor(Math.random() * 50),
      totalFundsRaised: faker.number.int({ min: 1000, max: 1000000 }).toString(),
      defaultCurrency: 'USD' as const,
      trustScore: Math.floor(Math.random() * 100),
      yearFounded: faker.date.past({ years: 20 }).getFullYear(),
      socialLinks: {
        website: faker.internet.url(),
        twitter: faker.internet.url(),
        facebook: faker.internet.url(),
        instagram: faker.internet.url(),
      },
      verified: Math.random() > 0.5,
    });
  }
  
  await db.insert(publishersSchema).values(publishers);
  return publishers.map(p => p.id);
}

async function seedPaymentAccounts(publisherIds: string[]): Promise<string[]> {
  const paymentAccounts = [];
  const accountTypes = ['bank_transfer', 'paypal', 'stripe'];
  
  for (const publisherId of publisherIds) {
    // Create at least one payment account for each publisher
    const primaryAccountType = accountTypes[Math.floor(Math.random() * accountTypes.length)];
    
    paymentAccounts.push({
      id: crypto.randomUUID(),
      publisherId,
      accountType: primaryAccountType as 'bank_transfer' | 'paypal' | 'stripe' | 'check' | 'crypto',
      accountName: faker.finance.accountName(),
      accountEmail: faker.internet.email(),
      accountDetails: primaryAccountType === 'bank_transfer' ? faker.finance.iban() : null,
      routingNumber: primaryAccountType === 'bank_transfer' ? faker.finance.routingNumber() : null,
      accountNumber: primaryAccountType === 'bank_transfer' ? faker.finance.accountNumber() : null,
      bankName: primaryAccountType === 'bank_transfer' ? faker.company.name() : null,
      bankAddress: primaryAccountType === 'bank_transfer' ? faker.location.streetAddress() : null,
      swiftCode: primaryAccountType === 'bank_transfer' ? faker.finance.bic() : null,
      paypalEmail: primaryAccountType === 'paypal' ? faker.internet.email() : null,
      stripeAccountId: primaryAccountType === 'stripe' ? `acct_${faker.string.alphanumeric(16)}` : null,
      isVerified: Math.random() > 0.3,
      isDefault: true,
    });
    
    // Some publishers have multiple payment accounts
    if (Math.random() > 0.7) {
      const secondaryAccountTypes = accountTypes.filter(t => t !== primaryAccountType);
      const secondaryAccountType = secondaryAccountTypes[Math.floor(Math.random() * secondaryAccountTypes.length)];
      
      paymentAccounts.push({
        id: crypto.randomUUID(),
        publisherId,
        accountType: secondaryAccountType as 'bank_transfer' | 'paypal' | 'stripe' | 'check' | 'crypto',
        accountName: faker.finance.accountName(),
        accountEmail: faker.internet.email(),
        accountDetails: secondaryAccountType === 'bank_transfer' ? faker.finance.iban() : null,
        routingNumber: secondaryAccountType === 'bank_transfer' ? faker.finance.routingNumber() : null,
        accountNumber: secondaryAccountType === 'bank_transfer' ? faker.finance.accountNumber() : null,
        bankName: secondaryAccountType === 'bank_transfer' ? faker.company.name() : null,
        bankAddress: secondaryAccountType === 'bank_transfer' ? faker.location.streetAddress() : null,
        swiftCode: secondaryAccountType === 'bank_transfer' ? faker.finance.bic() : null,
        paypalEmail: secondaryAccountType === 'paypal' ? faker.internet.email() : null,
        stripeAccountId: secondaryAccountType === 'stripe' ? `acct_${faker.string.alphanumeric(16)}` : null,
        isVerified: Math.random() > 0.5,
        isDefault: false,
      });
    }
  }
  
  await db.insert(paymentAccountsSchema).values(paymentAccounts);
  return paymentAccounts.map(p => p.id);
}

async function seedTaxInformation(publisherIds: string[]): Promise<void> {
  const taxInfo = [];
  const countries = ['US', 'UK', 'CA', 'DE', 'FR', 'AU'];
  const taxIdTypes = ['SSN', 'EIN', 'VAT', 'ABN', 'GST'];
  const businessTypes = ['Individual', 'LLC', 'Corporation', 'Partnership', 'Non-profit'];
  const taxForms = ['W-9', 'W-8BEN', 'W-8BEN-E'];
  
  for (const publisherId of publisherIds) {
    const country = countries[Math.floor(Math.random() * countries.length)] as string;
    const isVerified = Math.random() > 0.3;
    
    taxInfo.push({
      publisherId,
      taxIdType: taxIdTypes[Math.floor(Math.random() * taxIdTypes.length)] as string,
      taxIdNumber: faker.finance.accountNumber(),
      legalName: faker.company.name(),
      businessType: businessTypes[Math.floor(Math.random() * businessTypes.length)] as string,
      taxCountry: country,
      taxState: country === 'US' ? faker.location.state({ abbreviated: true }) : null,
      taxFormSubmitted: isVerified,
      taxFormType: taxForms[Math.floor(Math.random() * taxForms.length)] as string,
      taxFormSubmissionDate: isVerified ? faker.date.past() : null,
      taxFormVerified: isVerified,
      taxFormVerificationDate: isVerified ? faker.date.recent() : null,
      taxWithholdingRate: isVerified ? '0' : randomAmount(10, 30, 1),
    });
  }
  
  await db.insert(taxInformationSchema).values(taxInfo);
}

async function seedProjects(count: number, publisherIds: string[], categoryIds: string[]): Promise<string[]> {
  const projects = [];
  const statuses = ['draft', 'active', 'funded', 'expired', 'canceled'] as const;
  const currencies = ['USD', 'EUR', 'GBP'] as const;
  const publisherTypes = ['user', 'organization'] as const;
  const now = new Date();
  
  for (let i = 0; i < count; i++) {
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const daysLeft = status === 'active' ? Math.floor(Math.random() * 30) + 1 : 0;
    const endDate = new Date();
    endDate.setDate(now.getDate() + daysLeft);
    
    const goal = parseFloat(randomAmount(5000, 100000, 0));
    let raised = 0;
    
    if (status === 'draft') {
      raised = 0;
    } else if (status === 'active') {
      raised = parseFloat(randomAmount(0, goal * 0.9, 0));
    } else if (status === 'funded') {
      raised = parseFloat(randomAmount(goal, goal * 1.5, 0));
    } else if (status === 'expired') {
      raised = parseFloat(randomAmount(0, goal * 0.9, 0));
    } else {
      raised = parseFloat(randomAmount(0, goal * 0.3, 0));
    }
    
    projects.push({
      title: faker.commerce.productName(),
      subtitle: faker.commerce.productAdjective() + ' ' + faker.commerce.product(),
      description: faker.lorem.paragraphs(3),
      goal: goal.toString(),
      minimumPledge: randomAmount(1, 25),
      raised: raised.toString(),
      currency: currencies[Math.floor(Math.random() * currencies.length)],
      daysLeft,
      endDate,
      status,
      featuredImage: `https://picsum.photos/seed/${faker.string.numeric(5)}/800/600`,
      publisherId: publisherIds[Math.floor(Math.random() * publisherIds.length)],
      categoryId: categoryIds[Math.floor(Math.random() * categoryIds.length)],
      publisherType: publisherTypes[Math.floor(Math.random() * publisherTypes.length)],
      featured: Math.random() > 0.8,
      viewCount: Math.floor(Math.random() * 10000),
      conversionRate: randomAmount(1, 15, 2),
      risks: faker.lorem.paragraph(),
      faq: [
        { question: 'When will rewards be delivered?', answer: faker.lorem.paragraph() },
        { question: 'Will there be stretch goals?', answer: faker.lorem.paragraph() },
        { question: 'Is international shipping available?', answer: faker.lorem.paragraph() },
      ],
    });
  }
  
  const result = await db.insert(projectsSchema).values(projects).returning();
  return result.map(p => p.id);
}

async function seedProjectMedia(projectIds: string[]): Promise<void> {
  const mediaItems = [];
  const mediaTypes = ['image', 'video', 'document'] as const;
  
  for (const projectId of projectIds) {
    // Add a few media items for each project
    const itemCount = Math.floor(Math.random() * 5) + 2;
    
    for (let i = 0; i < itemCount; i++) {
      const mediaType = mediaTypes[Math.floor(Math.random() * mediaTypes.length)] as typeof mediaTypes[number];
      let url = '';
      
      if (mediaType === 'image') {
        url = `https://picsum.photos/seed/${faker.string.numeric(5)}/800/600`;
      } else if (mediaType === 'video') {
        url = `https://www.youtube.com/watch?v=${faker.string.alphanumeric(11)}`;
      } else {
        url = `https://example.com/documents/${faker.system.fileName()}`;
      }
      
      mediaItems.push({
        projectId,
        mediaType,
        url,
        title: faker.lorem.sentence(),
        description: faker.lorem.paragraph(),
        displayOrder: i,
      });
    }
  }
  
  await db.insert(projectMediaSchema).values(mediaItems);
}

async function seedProjectTags(projectIds: string[], tagIds: string[]): Promise<void> {
  const projectTags = [];
  
  for (const projectId of projectIds) {
    // Assign 2-5 random tags to each project
    const tagCount = Math.floor(Math.random() * 4) + 2;
    const selectedTags = new Set<string>();
    
    while (selectedTags.size < tagCount && selectedTags.size < tagIds.length) {
      const tagId = tagIds[Math.floor(Math.random() * tagIds.length)] as string;
      if (!selectedTags.has(tagId)) {
        selectedTags.add(tagId);
        
        projectTags.push({
          projectId,
          tagId,
        });
      }
    }
  }
  
  await db.insert(projectTagsSchema).values(projectTags);
}

async function seedPayoutSchedules(publisherIds: string[], projectIds: string[]): Promise<void> {
  const payoutSchedules = [];
  const frequencies = ['one_time', 'weekly', 'biweekly', 'monthly'] as const;
  const now = new Date();
  
  // Create payout schedules for publishers
  for (const publisherId of publisherIds) {
    const frequency = frequencies[Math.floor(Math.random() * frequencies.length)] as typeof frequencies[number];
    const nextPayoutDate = new Date();
    nextPayoutDate.setDate(now.getDate() + Math.floor(Math.random() * 30) + 1);
    
    payoutSchedules.push({
      id: crypto.randomUUID(),
      publisherId,
      projectId: null, // Publisher-level payout schedule
      frequency,
      nextPayoutDate: nextPayoutDate.toISOString(),
      minimumPayoutAmount: randomAmount(50, 200, 0),
      isActive: true,
      dayOfWeek: frequency === 'weekly' || frequency === 'biweekly' ? Math.floor(Math.random() * 7) : null,
      dayOfMonth: frequency === 'monthly' ? Math.floor(Math.random() * 28) + 1 : null,
    });
  }
  
  // Create some project-specific payout schedules
  const projectCount = Math.min(5, projectIds.length);
  for (let i = 0; i < projectCount; i++) {
    const projectId = projectIds[Math.floor(Math.random() * projectIds.length)] as string;
    const project = await db.select().from(projectsSchema).where(eq(projectsSchema.id, projectId)).limit(1);
    
    if (project.length > 0) {
      const publisherId = project[0]!.publisherId as string;
      const frequency = frequencies[Math.floor(Math.random() * frequencies.length)] as typeof frequencies[number];
      const nextPayoutDate = new Date();
      nextPayoutDate.setDate(now.getDate() + Math.floor(Math.random() * 30) + 1);
      
      payoutSchedules.push({
        id: crypto.randomUUID(),
        publisherId,
        projectId,
        frequency,
        nextPayoutDate: nextPayoutDate.toISOString(),
        minimumPayoutAmount: randomAmount(100, 500, 0),
        isActive: true,
        dayOfWeek: frequency === 'weekly' || frequency === 'biweekly' ? Math.floor(Math.random() * 7) : null,
        dayOfMonth: frequency === 'monthly' ? Math.floor(Math.random() * 28) + 1 : null,
      });
    }
  }
  
  await db.insert(payoutSchedulesSchema).values(payoutSchedules);
}

async function seedBackers(userIds: string[]): Promise<string[]> {
  const backers = [];
  
  // Convert ~70% of users to backers
  const backerCount = Math.floor(userIds.length * 0.7);
  const selectedUserIds = userIds.sort(() => 0.5 - Math.random()).slice(0, backerCount);
  
  for (const userId of selectedUserIds) {
    backers.push({
      id: crypto.randomUUID(),
      userId,
      totalAmountPledged: randomAmount(50, 2000),
      projectsBacked: Math.floor(Math.random() * 20) + 1,
      bio: faker.person.bio(),
      preferences: {
        notifyOnProjectUpdates: Math.random() > 0.3,
        notifyOnNewProjects: Math.random() > 0.5,
        displayFullName: Math.random() > 0.3,
      },
    });
  }
  
  await db.insert(backersSchema).values(backers);
  return backers.map(b => b.id);
}

async function seedAddresses(userIds: string[]): Promise<string[]> {
  const addresses = [];
  
  for (const userId of userIds) {
    // Create one primary address for each user
    addresses.push({
      id: crypto.randomUUID(),
      userId,
      name: faker.person.fullName(),
      line1: faker.location.streetAddress(),
      line2: Math.random() > 0.7 ? faker.location.secondaryAddress() : null,
      city: faker.location.city(),
      state: faker.location.state(),
      postalCode: faker.location.zipCode(),
      country: faker.location.countryCode(),
      phone: faker.phone.number(),
      isDefault: true,
    });
    
    // Some users have multiple addresses
    if (Math.random() > 0.7) {
      addresses.push({
        id: crypto.randomUUID(),
        userId,
        name: faker.person.fullName(),
        line1: faker.location.streetAddress(),
        line2: Math.random() > 0.5 ? faker.location.secondaryAddress() : null,
        city: faker.location.city(),
        state: faker.location.state(),
        postalCode: faker.location.zipCode(),
        country: faker.location.countryCode(),
        phone: faker.phone.number(),
        isDefault: false,
      });
    }
  }
  
  await db.insert(addressesSchema).values(addresses);
  return addresses.map(a => a.id);
}

async function seedRewards(projectIds: string[]): Promise<string[]> {
  const rewards = [];
  const fulfillmentStatuses = ['pending', 'fulfilled', 'canceled'] as const;
  
  for (const projectId of projectIds) {
    const project = await db.select().from(projectsSchema).where(eq(projectsSchema.id, projectId)).limit(1);
    
    if (project.length > 0) {
      const rewardCount = Math.floor(Math.random() * 4) + 2; // 2-5 rewards per project
      
      for (let i = 0; i < rewardCount; i++) {
        const amountRequired = parseFloat(randomAmount(5, 500, 0));
        const estimatedDelivery = new Date();
        estimatedDelivery.setMonth(estimatedDelivery.getMonth() + Math.floor(Math.random() * 12) + 1);
        
        rewards.push({
          id: crypto.randomUUID(),
          projectId,
          title: i === 0 ? 'Early Bird Special' : faker.commerce.productName(),
          description: faker.lorem.paragraph(),
          amountRequired: amountRequired.toString(),
          currency: project[0]!.currency,
          quantityAvailable: i === 0 ? Math.floor(Math.random() * 100) + 50 : -1, // Limited quantity for early bird
          quantityClaimed: i === 0 ? Math.floor(Math.random() * 50) : Math.floor(Math.random() * 200),
          estimatedDeliveryDate: estimatedDelivery,
          shippingRequired: Math.random() > 0.3,
          shippingRestrictions: Math.random() > 0.7 ? { restrictedCountries: ['Antarctica'] } : null,
          fulfillmentStatus: fulfillmentStatuses[Math.floor(Math.random() * fulfillmentStatuses.length)] as typeof fulfillmentStatuses[number],
        });
      }
    }
  }
  
  await db.insert(rewardsSchema).values(rewards);
  return rewards.map(r => r.id);
}

async function seedContributions(backerIds: string[], projectIds: string[], rewardIds: string[], addressIds: string[]): Promise<void> {
  const contributions = [];
  const paymentStatuses = ['pending', 'completed', 'failed', 'refunded'];
  
  // Get all rewards with their associated project IDs
  const rewardsData = await db.select().from(rewardsSchema);
  const rewardsByProject: Record<string, { id: string; amountRequired: string; currency: string }[]> = {};
  
  for (const reward of rewardsData) {
    if (!rewardsByProject[reward.projectId]) {
      rewardsByProject[reward.projectId] = [];
    }
    rewardsByProject[reward.projectId]!.push({
      id: reward.id,
      amountRequired: reward.amountRequired!,
      currency: reward.currency!,
    });
  }
  
  // Generate contributions
  const contributionCount = Math.min(backerIds.length * 3, 200); // Up to 3 contributions per backer, max 200
  
  for (let i = 0; i < contributionCount; i++) {
    const backerId = backerIds[Math.floor(Math.random() * backerIds.length)];
    const projectId = projectIds[Math.floor(Math.random() * projectIds.length)] as string;
    const projectRewards = rewardsByProject[projectId] || [];
    
    let rewardId = null;
    let amount = '25';
    let currency = 'USD';
    
    if (projectRewards.length > 0 && Math.random() > 0.2) { // 80% chance to select a reward
      const reward = projectRewards[Math.floor(Math.random() * projectRewards.length)]!;
      rewardId = reward.id;
      amount = reward.amountRequired;
      currency = reward.currency;
      
      // Sometimes people contribute more than the minimum
      if (Math.random() > 0.7) {
        const extraAmount = parseFloat(randomAmount(5, 50));
        amount = (parseFloat(amount) + extraAmount).toFixed(2);
      }
    } else {
      // Custom amount with no reward
      amount = randomAmount(10, 200);
      
      // Get project currency
      const project = await db.select().from(projectsSchema).where(eq(projectsSchema.id, projectId)).limit(1);
      if (project.length > 0) {
        currency = project[0]!.currency!;
      }
    }
    
    // Get a random address for this contribution if shipping is required
    let addressId = null;
    if (Math.random() > 0.5) {
      addressId = addressIds[Math.floor(Math.random() * addressIds.length)];
    }
    
    contributions.push({
      id: crypto.randomUUID(),
      backerId,
      projectId,
      rewardId,
      amount,
      currency,
      addressId,
      anonymous: Math.random() > 0.8,
      message: Math.random() > 0.7 ? faker.lorem.sentence() : null,
      transactionId: `txn_${faker.string.alphanumeric(24)}`,
      paymentStatus: paymentStatuses[Math.floor(Math.random() * paymentStatuses.length)],
      refunded: 0
    });
  }
}


async function main() {
  try {
    await seed();
    console.log('Seeding completed');
  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  }
}
main();