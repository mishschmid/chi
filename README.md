# Cima

Cima is a voice-first AI companion that gets to know you deeply over time, acting as the conversation hub connecting a universe of child apps (health span, tasks, finances).

Read [docs/concept.md](./docs/concept.md) for product strategy and [docs/architecture.md](./docs/architecture.md) for architectural design.

## Quickstart

### Prerequisites

- Node 24 (`v24.17.0`+)
- Yarn 4 (`yarn@4.13.0`+)
- Docker & Docker Compose

### 1. Setup Environment

```bash
cp .env.example .env
```

Provide your `OPENAI_API_KEY` (or `ANTHROPIC_API_KEY`) in `.env`.

### 2. Start Database

```bash
docker compose up -d
```

Runs Postgres 17 with `pgvector` on port `5434` (preventing conflicts with standard port `5432` and `5433`).

### 3. Run Migrations & Seed

```bash
yarn db:migrate
yarn db:seed
```

### 4. Run Development Server

```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) to chat with Cima. Visit `/memory` to view and manage what Cima has learned about you.

## Scripts

- `yarn dev`: Launch local development server
- `yarn test:run`: Run test suite with Vitest
- `yarn typecheck`: Run Nuxt typecheck (`vue-tsc`)
- `yarn lint`: Check code formatting with Prettier
- `yarn format`: Format files with Prettier
- `yarn db:generate`: Generate Drizzle migrations
- `yarn db:migrate`: Apply pending migrations
- `yarn db:studio`: Launch Drizzle Studio web inspector

## Production Deployment (Dokploy)

Cima is deployed on Hetzner via Dokploy using `docker-compose.prod.yml`:

- **Repository**: `https://github.com/mishschmid/cima.git` (Branch: `main`)
- **Domain**: `cima.you`
- **Port**: `3000` (Traefik reverse proxy)
- **SSL**: Automatic Let's Encrypt managed by Dokploy
- **Database**: Postgres 17 with `pgvector` extension on persistent volume `cima-postgres`
