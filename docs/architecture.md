# Cima – Architecture

See [concept.md](./concept.md) for the product vision and business model.

## Target Structure

```
                 auth  (shared login, better-auth)
                   │  one account for all apps
                   ▼
                 Cima  (talk, understand, connect)
                   │
     ┌─────────────┼───────────────────────┬──────────┐
     │ API         │ API                   │ API      │ API
     ▼             ▼                       ▼          ▼
  health-core ───────────────┐           Done.      Ciaro
  profile, biomarkers,       │
  wearables, sleep,          │
  training, nutrition,       │
  supplements, mood          │
     ▲          ▲            ▲
   Sansa      Sana        Cucia (later)
  "move"     "calm"       "eat"
```

### Repositories

| Repo      | Contents                                                      | Status                            |
| --------- | ------------------------------------------------------------- | --------------------------------- |
| `auth/`   | Shared login service                                          | New                               |
| `cima/`   | Conversation, memory, voice (this repo, deployed on cima.you) | Active                            |
| `health/` | Monorepo: `health-core` + `sansa` (+ `cucia` later)           | Evolves from today's `sansa` repo |
| `done./`  | Tasks                                                         | Exists, stays as is               |
| `ciaro/`  | Finances                                                      | Exists, stays as is               |

### Principles

- **Cima is an API client like every other app.** It never reads another app's database directly.
- **Health data is shared, health apps are split by use.** One health backend and database. Sansa, Sana and Cucia are front ends for different moments: training/moving, calming down, eating.
- **Child apps own their specialised data.** Cima fetches it live through the API. Cima's memory stores only _insights_ ("knee is sensitive after long runs"), not copies of the app data.
- **Each part stays small and focused.** Cima does conversation, memory and voice. Health does health. Auth does accounts.

## Decisions

| Topic           | Decision                                                                                                  |
| --------------- | --------------------------------------------------------------------------------------------------------- |
| Shared login    | Its own auth service, built on better-auth                                                                |
| Sign-up         | Possible in any app; it always creates a Cima account                                                     |
| Partners        | Normal accounts with a partner role                                                                       |
| Login methods   | Email/password + passkeys                                                                                 |
| Existing users  | Start fresh (no migration)                                                                                |
| Cima tech       | Nuxt, TypeScript, SCSS (same template as the other apps)                                                  |
| Voice           | Push-to-talk in the browser first; a native app or Siri/Shortcuts integration later for a true "Hey Cima" |
| Cima's memory   | Cima's own Postgres + pgvector, as a separate module inside Cima                                          |
| AI models       | OpenAI/Anthropic for now; a self-hosted open model later; build so the provider can be swapped            |
| Order           | Build Cima first against the existing Sansa API, then split the health monorepo                           |
| Done. / Ciaro   | Stay single-user for now; Cima connects to them for you                                                   |
| Health monorepo | One repo (`health/`) rather than separate repos                                                           |
| Hosting         | Hetzner via Dokploy (Germany/Finland, adequate under nDSG); encrypted backups and sensitive fields        |

## Components

### auth

- better-auth as a standalone service; Sansa's existing setup is the starting point.
- Single sign-on: all apps send users here to log in (OIDC).
- Roles: `user`, `partner` (later also `admin`).
- Consent records for partner access (which partner may see which data, revocable).

### Cima

- Nuxt app: chat UI with push-to-talk voice.
- **Memory module** (Postgres + pgvector):
  - **Profile:** stable facts (goals, preferences, people in the user's life).
  - **Memories:** things learned from conversations, searchable by meaning.
  - **Conversation history.**
  - The user can see and edit everything Cima knows.
- **Model layer:** one interface in front of OpenAI/Anthropic, so the provider can be swapped (or a self-hosted model added) per task.
- **Tools:** the AI calls child app APIs (health-core, Done., Ciaro) to read and write data. Sansa's existing chat with tool calling is a reference.

### health (monorepo)

- `health-core`: the backend and database from today's Sansa repo (API, Drizzle schema, Postgres, Garmin/Strava sync, science logic), exposed as a clean, versioned API (`/api/v1`).
- `sansa`: sport screens (running planner, workouts, collections, stats) + meditation/breathwork.
- `cucia`: later, once real cooking features (recipes, meal plans) are built.
- Biomarkers, supplements, nutrition tracking and wearable data stay in `health-core`. Users see them through Cima and the partner client overview.

### Done. and Ciaro

- Stay single-user.
- Need: shared login (or a service token for Cima) and an API Cima can use. Done. already has `/api/v1`; Ciaro needs one.

## Plan

1. **Cima skeleton:** Nuxt app, text chat, model layer, basic memory (profile + history).
2. **Connect to health:** a versioned API in the current Sansa repo; Cima reads and writes health data through it.
3. **Voice:** push-to-talk (speech to text and text to speech).
4. **auth service:** better-auth standalone; Cima and Sansa use it.
5. **Memories with search by meaning:** pgvector, plus a page where users see and edit what Cima knows.
6. **Connect Done. and Ciaro:** service token + API.
7. **Split health into a monorepo:** `health-core` + `sansa`.
8. **Build meditation, breathwork, sleep features in Sansa.**
9. **Partner role + consent + client overview.**
10. **Wearables beyond Garmin/Strava** (Apple Health, Oura).

## Open Questions

- Speech to text for Swiss German: which provider, and how good is it?
- Auth domain and the exact SSO flow across apps (subdomains, shared cookies vs. OIDC redirects).
- How Cima authenticates to the APIs on the user's behalf (passing the user's token on vs. a service token with a user ID).
- How Cima's memory stays in sync when data changes directly in a child app (webhooks vs. fetching live).
- Encryption approach for sensitive fields (application level vs. database level).
