# Turborepo Starter (pnpm, JS only)

This is a JavaScript-only Turborepo using pnpm.

Packages:

- apps/web: Vite + React app
- apps/server: Express API server
- packages/ui: shared UI components
- packages/db: unified database schema (Drizzle)

Ports

- Inventory backend: 3001 (http://localhost:3001/api)
- Admin backend: 3002 (http://localhost:3002/api)
- Admin frontend: 3003 (Next dev/start)
- Inventory frontend: 3004 (Next dev/start)
- Web (Vite): 5173 (http://localhost:5173)

Scripts:

- pnpm dev: Run all dev servers
- pnpm build: Build all apps/packages
- pnpm lint: Lint all
- pnpm test: Run tests

Requirements:

- Node 18+
- pnpm 9+

## Getting started

pnpm install
pnpm dev

Open http://localhost:5173 for web, and http://localhost:3000 for the API.

---

username=superadmin
email=superadmin@justoo.local
password=ChangeMe123!
