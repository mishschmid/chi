# AGENTS.md – Cima

Cima is a voice-first AI companion that sits at the centre of a set of child apps (health, tasks, finances). Read `docs/concept.md` (product) and `docs/architecture.md` (architecture) for the bigger picture. Work on **one task at a time** from `docs/tasks/`.

## Stack

- Nuxt 3 with `future: { compatibilityVersion: 4 }` (app code in `app/`, server code in `server/`)
- TypeScript, `strict: true`
- SCSS (no Tailwind, no UI libraries). Global styles in `app/assets/styles/`; variables are auto-imported via `vite.css.preprocessorOptions`
- Postgres 17 with pgvector, Drizzle ORM (`drizzle-orm/node-postgres`, `pg`), drizzle-kit for migrations
- Yarn 4 (`packageManager: yarn@4.x`), Node 24
- Vitest for tests, Prettier for formatting
- Docker + Dokploy on Hetzner for deployment

## Commands

| Command                | Purpose                                                         |
| ---------------------- | --------------------------------------------------------------- |
| `docker compose up -d` | Start local Postgres                                            |
| `yarn dev`             | Start the dev server (http://localhost:3000)                    |
| `yarn db:generate`     | Generate a migration after changing `server/database/schema.ts` |
| `yarn db:migrate`      | Apply migrations                                                |
| `yarn test:run`        | Run tests once                                                  |
| `yarn typecheck`       | Type check (`nuxt typecheck`)                                   |
| `yarn lint`            | Prettier check                                                  |
| `yarn format`          | Prettier write                                                  |

**Before finishing any task, run `yarn typecheck`, `yarn lint` and `yarn test:run`. All three must pass.**

## Structure

```
app/
  pages/          Nuxt pages
  components/     Vue components (PascalCase.vue)
  composables/    useXxx.ts
  assets/styles/  global.scss, _variables.scss
server/
  api/            API routes (Nitro file-based routing, e.g. chat.post.ts)
  database/       index.ts (db client), schema.ts (Drizzle schema)
  utils/          server helpers (auto-imported by Nitro)
    llm/          model layer (provider interface + providers)
    memory/       Cima's memory module
drizzle/          generated migrations (never edit by hand)
tests/            Vitest tests, mirroring the source folders
docs/             concept, architecture, task specs
```

## Rules

- **Never access another app's database.** Child apps (health-core, Done., Ciaro) are reached only through their HTTP APIs.
- **All model calls go through `server/utils/llm/`.** Never import `openai` or `@anthropic-ai/sdk` anywhere else.
- **All memory reads and writes go through `server/utils/memory/`.**
- **Secrets only come from environment variables**, read in `nuxt.config.ts` `runtimeConfig`. Never hard-code keys. Update `.env.example` when you add a variable.
- **Every DB table has a `userId` column** (except the users table itself), and every query filters by it.
- API routes validate input and return errors with `createError({ statusCode, statusMessage })`.
- Prefer small, focused files. No new dependencies unless the task says so.
- Match the surrounding code style. Add comments only where the code isn't self-explanatory.
- Don't change files outside the scope of the current task.

## Reference code (copy patterns from here)

The sibling repo `../sansa` uses the same stack. When unsure, look there:

- `../sansa/nuxt.config.ts`: config, `runtimeConfig`, SCSS setup
- `../sansa/server/database/index.ts` and `schema.ts`: Drizzle + Postgres setup
- `../sansa/drizzle.config.ts`: drizzle-kit config
- `../sansa/docker-compose.yml`: local Postgres
- `../sansa/Dockerfile`, `../sansa/docker-compose.prod.yml`: deployment
- `../sansa/server/utils/openai.ts`: OpenAI client (use native `fetch`, see the comment there)
- `../sansa/server/utils/chat/`: chat with tool calling (prompt, context, tools)
- `../sansa/server/api/chat/`: chat API routes

Copy patterns, not domain logic. Cima has no running or health logic of its own.
