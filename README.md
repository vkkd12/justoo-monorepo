# Justoo Monorepo

A comprehensive delivery platform monorepo with unified backend gateway and multiple service frontends.

## 🏗️ Architecture

This monorepo uses a **Gateway Pattern** where all backend services are mounted under a single Express.js gateway server.

### Services

- **Admin Service**: Admin panel for managing the platform
  - Backend: User management, rider management, order oversight
  - Frontend: Next.js admin dashboard
- **Customer Service**: Customer-facing shopping experience
  - Backend: Shopping cart, orders, item browsing
  - Frontend: Next.js customer app
- **Inventory Service**: Inventory and stock management
  - Backend: Item CRUD, stock tracking, order processing
  - Frontend: Next.js inventory dashboard
- **Rider Service**: Rider management and delivery tracking
  - Backend: Rider operations, delivery management
  - Frontend: Next.js rider app

### Shared Packages

- **packages/db**: Unified Drizzle ORM schema for PostgreSQL

## 🚀 Ports & URLs

### Gateway (All Backends)
- **Port**: 3000 (configurable via `BACKEND_PORT` in `.env`)
- **URL**: `http://localhost:3000`
- **Health Check**: `http://localhost:3000/health`

### Service Endpoints
- Admin API: `http://localhost:3000/admin/api/*`
- Customer API: `http://localhost:3000/customer/api/*`
- Inventory API: `http://localhost:3000/inventory/api/*`
- Rider API: `http://localhost:3000/rider/api/*`

### Frontend Development Servers
- Admin Frontend: `http://localhost:3001`
- Customer Frontend: `http://localhost:3002`
- Inventory Frontend: `http://localhost:3003`
- Rider Frontend: `http://localhost:3004`

## 📋 Requirements

- Node.js 18+
- pnpm 9+
- PostgreSQL database

## 🛠️ Getting Started

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Environment Configuration

Create a `.env` file in the root directory:

```env
# Gateway Configuration
BACKEND_PORT=3000

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/justoo_db

# JWT & Security
JWT_SECRET=your-super-secret-jwt-key-change-in-production
COOKIE_SECRET=your-cookie-secret-key

# Frontend URLs (for CORS)
ADMIN_FRONTEND_URL=http://localhost:3001
CUSTOMER_FRONTEND_URL=http://localhost:3002
INVENTORY_FRONTEND_URL=http://localhost:3003
RIDER_FRONTEND_URL=http://localhost:3004
```

### 3. Database Setup

```bash
# Run migrations
cd packages/db
pnpm run db:push

# Create superadmin user
cd ../../apps/admin/backend
node scripts/seedSuperadmin.js
```

### 4. Start Development

```bash
# Start all services (gateway + all frontends)
pnpm dev

# Or start individually:
pnpm run start:gateway       # Gateway only
pnpm run dev:admin          # Admin frontend
pnpm run dev:customer       # Customer frontend
pnpm run dev:inventory      # Inventory frontend
pnpm run dev:rider          # Rider frontend
```

## 📜 Available Scripts

- `pnpm dev` - Run all development servers
- `pnpm build` - Build all apps
- `pnpm start:gateway` - Start the unified backend gateway
- `pnpm lint` - Lint all packages

## 🔐 Default Credentials

**Superadmin:**
- Username: `superadmin`
- Email: `superadmin@justoo.local`
- Password: `ChangeMe123!`

## 📚 Documentation

For detailed API documentation, see:
- Admin API: `apps/admin/backend/docs/API_ROUTES.md`
- Customer API: `apps/customer/backend/API_DOCUMENTATION.md`
- Inventory API: `apps/inventory/backend/docs/API_DOCUMENTATION.md`

## 🏛️ Tech Stack

- **Backend**: Node.js, Express.js
- **Frontend**: Next.js 15, React 19, Tailwind CSS
- **Database**: PostgreSQL with Drizzle ORM
- **Monorepo**: pnpm workspace + Turborepo
- **Authentication**: JWT with httpOnly cookies
