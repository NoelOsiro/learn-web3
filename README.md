# Mavunoflow

Agricultural cashflow management platform for cooperatives. Built with a production-ready monorepo architecture using Next.js, Supabase, Prisma, and Inngest.

## Architecture

This project uses a **TurboRepo monorepo** structure designed to scale from MVP to microservices:

```
mavunoflow/
├── apps/
│   └── web/                # Next.js 15 + React 19 application
├── packages/
│   ├── database/           # Prisma ORM + PostgreSQL
│   ├── auth/               # Supabase authentication
│   ├── shared/             # Shared utilities & validation
│   ├── collections/       # Collection/delivery domain
│   ├── valuation/          # Valuation calculation domain
│   ├── credit/             # Credit/loan domain
│   ├── wallets/            # Wallet/balance domain
│   ├── notifications/      # Notification domain
│   ├── farmers/            # Farmer management domain
│   └── ui/                 # Shared UI components (shadcn/ui)
├── prisma/                 # Database schema
├── supabase/               # Supabase configuration
├── inngest/                # Background job configuration
└── docs/                   # Documentation
```

## Technology Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **shadcn/ui** - Component library
- **React Hook Form** - Form management
- **Zod** - Schema validation
- **TanStack Table** - Data tables

### Backend
- **Next.js Route Handlers** - API endpoints
- **Next.js Server Actions** - Server-side mutations

### Database
- **Supabase PostgreSQL** - Managed database
- **Prisma** - ORM with type-safe queries

### Authentication
- **Supabase Auth** - Email, Google OAuth, roles, multi-tenancy

### Background Jobs
- **Inngest** - Event-driven background processing

### Storage
- **Supabase Storage** - File uploads (delivery images, farmer photos, documents, receipts)

## Development Principles

### Non-Negotiable Rules

✅ **No floating point math for money**
- Use `Decimal` type or Prisma Decimal for all monetary values
- Never use `number` for financial calculations

✅ **Every table includes:**
- `id` (UUID)
- `tenant_id` (UUID, for multi-tenancy)
- `created_at` (DateTime)
- `updated_at` (DateTime)
- `deleted_at` (DateTime, nullable, for soft delete)

✅ **UUID everywhere**
- All primary keys use UUIDs
- All foreign keys use UUIDs

✅ **Every API includes:**
- `Authorization` header
- `X-Tenant-ID` header

### Domain Modules

Each package owns its models, services, validation, and API logic:

- **Identity** - Users, roles, organizations, authentication
- **Farmers** - Farmer profiles, search, management
- **Collections** - Delivery recording, photos, GPS, weight, grade
- **Valuation** - Automatic calculation (weight × price = gross → deductions → net)
- **Credit** - Loan offers, approval, repayment
- **Wallets** - Balance management, transactions
- **Notifications** - System notifications
- **Reports** - Analytics, charts, reports

## Getting Started

### Prerequisites

- Node.js >= 20.0.0
- npm >= 10.0.0
- Supabase account
- Inngest account (optional for MVP)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd cashflow
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**

Copy the example environment file:
```bash
cp .env.example .env.local
```

Configure your environment variables in `.env.local`:
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/cashflow?schema=public"

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Inngest
INNGEST_EVENT_KEY=your_inngest_event_key
INNGEST_SIGNING_KEY=your_inngest_signing_key
INNGEST_INGEST_URL=https://www.inngest.com

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Getting Supabase Keys:**
1. Go to your Supabase project dashboard
2. Navigate to Settings → API
3. Copy the **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
4. Copy the **anon/public** key → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
5. Copy the **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (this is a secret, never expose it to the client)

4. **Set up Supabase**

Create a Supabase project and:
- Get your project URL and keys from Supabase dashboard
- Enable Email and Google authentication
- Configure your database connection string

5. **Initialize the database**

Generate Prisma client:
```bash
npm run db:generate
```

Push the schema to your database:
```bash
npm run db:push
```

Or create a migration:
```bash
npm run db:migrate
```

6. **Start the development server**
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## Available Scripts

### Development
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

### Database
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema changes to database
- `npm run db:migrate` - Create and apply migration
- `npm run db:studio` - Open Prisma Studio

### Utilities
- `npm run clean` - Clean build artifacts and node_modules

## Git Strategy

```
main          # Production releases
develop       # Integration branch
feature/*     # Feature branches (e.g., feature/auth, feature/farmers)
```

### Workflow

1. Create a feature branch from `develop`
2. Make your changes
3. Commit with conventional commits
4. Push and create a pull request to `develop`
5. After review, merge to `develop`
6. Periodically merge `develop` to `main` for releases

## Deployment

### Automatic Deployment

The project is configured for automatic deployment via GitHub → Vercel → Supabase:

1. **Connect your GitHub repository to Vercel**
2. **Configure environment variables in Vercel**
3. **Push to main branch**
4. **Vercel automatically builds and deploys**

### Manual Deployment

```bash
npm run build
vercel --prod
```

## MVP Roadmap

### Sprint 1: Infrastructure ✅
- [x] Repository setup
- [x] Next.js app
- [x] Supabase integration
- [x] Prisma ORM
- [x] Authentication setup
- [x] UI framework
- [x] Multi-tenancy structure
- [x] CI/CD configuration

### Sprint 2: Identity (Next)
- [ ] Login flow
- [ ] User invitations
- [ ] Role management
- [ ] Organization management

### Sprint 3: Farmers
- [ ] Farmer CRUD
- [ ] Search functionality
- [ ] Farmer profiles

### Sprint 4: Collections
- [ ] Record deliveries
- [ ] Photo uploads
- [ ] GPS location
- [ ] Weight and grade entry

### Sprint 5: Valuation
- [ ] Automatic calculation
- [ ] Deductions logic
- [ ] Net amount computation

### Sprint 6: Credit
- [ ] Loan offers
- [ ] Approval workflow
- [ ] Repayment tracking

### Sprint 7: Dashboard
- [ ] Analytics
- [ ] Charts
- [ ] Reports

## Code Quality

### Linting
```bash
npm run lint
```

### Formatting
```bash
npm run format
```

### Pre-commit Hooks
Husky and lint-staged are configured to run linting and formatting on every commit.

## Testing

Tests should be added as features are developed. The project is structured to support:
- Unit tests with Jest
- Integration tests with Playwright
- E2E tests with Playwright

## Documentation

Additional documentation is available in the `docs/` directory:
- Architecture decisions
- API documentation
- Deployment guides
- Contributing guidelines

## Contributing

1. Follow the existing code style
2. Write meaningful commit messages
3. Add tests for new features
4. Update documentation
5. Ensure all tests pass before submitting

## License

Proprietary - All rights reserved

## Support

For support, email support@mavunoflow.com or open an issue in the repository.
