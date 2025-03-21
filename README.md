# FundForge: Next.js Crowdfunding Platform

<p align="center">
  <img height="300" src="public/assets/images/fundforge-banner.png" alt="FundForge Crowdfunding Platform">
</p>

🚀 A modern, feature-rich crowdfunding platform built with **Next.js**, **Tailwind CSS**, and **Shadcn UI**. Launch creative projects, fund innovative ideas, and build communities around shared passions.

**[Live Demo](https://fundforge.example.com)** | **[Documentation](https://github.com/yourusername/fundforge)**

## ✨ Key Features

- 🔒 **Secure Authentication** - Easy sign-up/login with social auth, passwordless login via [Clerk](https://clerk.com)
- 💰 **Campaign Management** - Create, edit, and manage funding campaigns with rich media support
- 💸 **Pledge Processing** - Secure payment handling with Stripe integration
- 🏆 **Reward Tiers** - Flexible reward system for different pledge amounts
- 📊 **Funding Progress** - Real-time campaign funding stats and progress visualization
- 👥 **Creator Tools** - Campaign updates, backer management, and project dashboards
- 🔍 **Discovery** - Category browsing, search functionality, and featured campaigns
- 📱 **Responsive Design** - Mobile-friendly interface with modern UI components
- 🌐 **Multi-language Support** - Internationalization via next-intl

## 📸 Features Preview

| Campaign Discovery | Project Dashboard |
| --- | --- |
| [![Campaign Discovery](public/assets/images/fundforge-discovery.png)](https://fundforge.example.com) | [![Project Dashboard](public/assets/images/fundforge-dashboard.png)](https://fundforge.example.com/dashboard) |

| Campaign Creation | Backer Management |
| --- | --- |
| [![Campaign Creation](public/assets/images/fundforge-create.png)](https://fundforge.example.com/create) | [![Backer Management](public/assets/images/fundforge-backers.png)](https://fundforge.example.com/manage) |

## 🚀 Getting Started

```bash
# Clone the repository
git clone https://github.com/yourusername/fundforge.git my-crowdfunding-app
cd my-crowdfunding-app

# Install dependencies
npm install

# Run the development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see your crowdfunding platform in action.

## 🔧 Configuration

### Authentication

1. Create a [Clerk](https://clerk.com) account and application
2. Add these to your `.env.local`:
   ```
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_pub_key
   CLERK_SECRET_KEY=your_clerk_secret_key
   ```

### Payment Processing

1. Create a [Stripe](https://stripe.com) account
2. Configure your Stripe keys in `.env.local`:
   ```
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_pub_key
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
   ```

### Database Setup

The platform uses PostgreSQL with DrizzleORM:

1. Configure your database URL in `.env.local`:
   ```
   DATABASE_URL=your_database_url
   ```
2. Run initial setup:
   ```
   npm run db:migrate
   ```

## 💡 For Creators

FundForge lets you:

- Create engaging campaign pages with rich media
- Set funding goals, campaign duration, and reward tiers
- Communicate with backers through updates
- Track funding progress and backer statistics
- Manage supporter information and reward fulfillment

## 💲 For Backers

As a backer, you can:

- Discover innovative projects across multiple categories
- Back campaigns with secure payment processing
- Select from various reward tiers
- Track projects you've supported
- Receive updates from creators
- Comment and engage with campaign communities

## 🧰 Development Tools

- **Database Explorer**: `npm run db:studio`
- **Create Migration**: `npm run db:generate`
- **Test Suite**: `npm run test`
- **E2E Testing**: `npm run test:e2e`

## 📊 Admin Dashboard

The admin dashboard provides platform operators with:

- Campaign moderation tools
- User management
- Payment oversight
- Category management
- Featured campaign curation

## 🔄 Customization

Key customization points include:

- `src/utils/AppConfig.ts`: Platform configuration
- `src/models/Schema.ts`: Database schema for campaigns, rewards, and pledges
- `src/features/campaigns`: Campaign-related components and logic

## 🌐 Deployment

Deploy your crowdfunding platform with:

```bash
npm run build
```

The platform is optimized for deployment on Vercel, Netlify, or any Node.js hosting service.

## 📄 License

Licensed under the MIT License. See [LICENSE](LICENSE) for more information.

---

Built with passion by [Your Name/Team] using [Next.js SaaS Boilerplate](https://github.com/ixartz/SaaS-Boilerplate) as a foundation.
