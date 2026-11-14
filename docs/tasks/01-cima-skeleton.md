# Task 01 – Cima Skeleton

**Goal:** a working text chat with Cima. It streams replies from OpenAI or Anthropic, saves conversations in Postgres, and remembers basic facts about the user across conversations.

**Out of scope (later tasks):** voice, real login/auth service, memories searched by meaning (pgvector queries), connections to child apps, deployment.

Do the subtasks **in order**. After each one, run `yarn typecheck`, `yarn lint` and `yarn test:run`, and check the "Done when" list before moving on. Read `AGENTS.md` first.

---

## 1.1 Project setup

Create the Nuxt project in this repo, using the same setup as `../sansa`.

- `package.json`: name `cima`, `"type": "module"`, `packageManager: yarn@4.13.0`. Scripts: `dev`, `build`, `preview`, `postinstall` (`nuxt prepare`), `test`, `test:run`, `typecheck` (`nuxt typecheck`), `lint`, `format`, `db:generate`, `db:migrate`, `db:studio`.
- Dependencies: `nuxt`, `vue`, `vue-router`, `drizzle-orm`, `pg`.
- Dev dependencies: `typescript`, `vue-tsc`, `sass-embedded`, `prettier`, `vitest`, `@nuxt/test-utils`, `happy-dom`, `drizzle-kit`, `@types/pg`, `tsx`. Use the same versions as `../sansa/package.json`.
- `nuxt.config.ts`: `compatibilityDate`, `future.compatibilityVersion: 4`, `typescript.strict: true`, SCSS global + variables (as in sansa), `routeRules` `/api/**` with no caching. Leave out everything maplibre-, Strava- and Garmin-related.
- `app/app.vue`, `app/pages/index.vue` (placeholder "Cima"), `app/assets/styles/global.scss`, `app/assets/styles/_variables.scss` (a few colour and spacing variables, dark theme).
- `.prettierrc` (copy from sansa if it exists), `.gitignore` (node_modules, .nuxt, .output, .env, postgres-data), `.env.example`.
- `vitest.config.ts` (copy from sansa).

**Done when:**

- [ ] `yarn install` and `yarn dev` work, and http://localhost:3000 shows "Cima"
- [ ] `yarn typecheck`, `yarn lint` and `yarn test:run` pass (add one trivial test so Vitest has something to run)

## 1.2 Database

- `docker-compose.yml`: Postgres service using the image **`pgvector/pgvector:pg17`** (not plain postgres). User, password and db are all `cima`, port `5434`, volume `./postgres-data`, plus a healthcheck (copy the structure from sansa).
- `drizzle.config.ts` (as in sansa, default URL `postgresql://cima:cima@localhost:5434/cima`).
- `server/database/index.ts` (as in sansa).
- `server/database/schema.ts` with these tables:

| Table           | Columns                                                                                                                                                                                                       |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `users`         | `id` uuid pk (default random), `name` text, `createdAt` timestamp default now                                                                                                                                 |
| `conversations` | `id` uuid pk, `userId` → users.id, `title` text nullable, `createdAt`, `updatedAt`                                                                                                                            |
| `messages`      | `id` uuid pk, `userId` → users.id, `conversationId` → conversations.id (cascade delete), `role` text (`user` \| `assistant` \| `system`), `content` text, `model` text nullable, `createdAt`                  |
| `profile_facts` | `id` uuid pk, `userId` → users.id, `fact` text, `category` text (`identity` \| `goal` \| `preference` \| `person` \| `health` \| `other`), `sourceMessageId` → messages.id nullable, `createdAt`, `updatedAt` |

- Indexes: `messages(conversationId, createdAt)`, `profile_facts(userId)`, `conversations(userId, updatedAt)`.
- Add a first migration that runs `CREATE EXTENSION IF NOT EXISTS vector;` (for later tasks). Create it with `yarn drizzle-kit generate --custom --name enable-pgvector`, then put the SQL into the generated empty file. This is the only allowed hand edit in `drizzle/`.
- `scripts/seed-dev-user.ts`: creates one user named "Michael" with a fixed UUID, `00000000-0000-0000-0000-000000000001`, if it doesn't exist yet. Add a `db:seed` script.
- `server/utils/currentUser.ts`: `getCurrentUserId(event)` returns `process.env.DEV_USER_ID`, or the fixed UUID if that's not set. **This is a temporary placeholder until the auth service exists. Add a `// TODO(auth)` comment.**

**Done when:**

- [ ] `docker compose up -d`, `yarn db:migrate` and `yarn db:seed` work on a fresh database
- [ ] `yarn db:studio` shows the four tables and the seeded user

## 1.3 Model layer

Create `server/utils/llm/`:

- `types.ts`:
  ```ts
  export type ChatRole = 'system' | 'user' | 'assistant'
  export interface ChatMessage {
    role: ChatRole
    content: string
  }
  export interface ChatOptions {
    model?: string
    temperature?: number
    maxTokens?: number
  }
  export interface LlmProvider {
    name: 'openai' | 'anthropic'
    streamChat(messages: ChatMessage[], options?: ChatOptions): AsyncIterable<string>
    completeJson<T>(messages: ChatMessage[], options?: ChatOptions): Promise<T>
  }
  ```
- `openai.ts`: implements `LlmProvider` with the `openai` package (add the dependency). Use `fetch: globalThis.fetch` as in sansa. `completeJson` uses JSON response format.
- `anthropic.ts`: implements `LlmProvider` with `@anthropic-ai/sdk` (add the dependency). Anthropic takes the system prompt as a separate parameter: pull `system` messages out of the list. `completeJson` asks for JSON only and parses the text.
- `index.ts`: `getLlm(purpose: 'chat' | 'extraction'): LlmProvider`. It reads `runtimeConfig.llmProvider` (`openai` \| `anthropic`, default `openai`) and the model names `runtimeConfig.llmChatModel` and `runtimeConfig.llmExtractionModel`.
- `nuxt.config.ts` `runtimeConfig`: `openaiApiKey`, `anthropicApiKey`, `llmProvider`, `llmChatModel`, `llmExtractionModel`, each read from plain env vars (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `LLM_PROVIDER`, `LLM_CHAT_MODEL`, `LLM_EXTRACTION_MODEL`). Add them to `.env.example`.
- If the selected provider has no API key, throw a clear error: `createError({ statusCode: 500, statusMessage: 'Missing API key for <provider>' })`.

**Tests:** `tests/server/llm/anthropic.test.ts`: a unit test for pulling system messages out of the list (mock the SDK client and don't make network calls). Do the same for OpenAI message mapping.

**Done when:**

- [ ] Nothing outside `server/utils/llm/` imports `openai` or `@anthropic-ai/sdk`
- [ ] Switching `LLM_PROVIDER` between `openai` and `anthropic` works without code changes

## 1.4 Chat API

- `server/utils/chat/prompt.ts`: `buildSystemPrompt(facts: ProfileFact[]): string`. Cima's personality: warm, curious, concise, a friend who knows the user; answers in the user's language (DE/FR/IT/EN). If there are facts, list them under "What you know about the user". Keep it under ~40 lines.
- `server/api/conversations/index.get.ts`: lists the current user's conversations (newest first).
- `server/api/conversations/index.post.ts`: creates a conversation and returns it.
- `server/api/conversations/[id]/messages.get.ts`: returns the messages of a conversation. Returns 404 if the conversation doesn't belong to the current user.
- `server/api/conversations/[id]/messages.post.ts`, with body `{ content: string }`:
  1. Validate (non-empty, ≤ 8,000 characters) and check that the conversation belongs to the user.
  2. Save the user message.
  3. Load the profile facts and the last 30 messages, then build the prompt.
  4. Stream the reply with `getLlm('chat').streamChat(...)`, sent to the client as a text stream (`sendStream` or a `ReadableStream`, `content-type: text/plain; charset=utf-8`).
  5. When the stream finishes, save the assistant message (with `model`), update `conversations.updatedAt`, and set `title` from the first user message (first 60 characters) if it's empty.
  6. Then trigger fact extraction (1.6) **without** making the response wait for it. Log errors but don't throw them.

**Tests:** `tests/server/chat/prompt.test.ts` (prompt with and without facts).

**Done when:**

- [ ] `curl -N -X POST localhost:3000/api/conversations/<id>/messages -H 'content-type: application/json' -d '{"content":"Hi Cima"}'` streams a reply
- [ ] Both messages are in the database afterwards

## 1.5 Chat UI

- `app/composables/useChat.ts`: loads conversations and messages, and sends a message. Reads the stream with `fetch` + `response.body.getReader()` and adds text to the assistant message as it arrives.
- `app/pages/index.vue`: conversation list (sidebar on desktop, drawer on mobile), message list, and input (textarea; Enter sends, Shift+Enter adds a new line), plus a "New conversation" button.
- `app/components/ChatMessage.vue`: user and assistant styles. The assistant's text appears as it streams in.
- Mobile-first, dark theme, SCSS using the variables. Scroll to the newest message.
- Disable the input while a reply is streaming. Show an error message if the request fails.

**Done when:**

- [ ] You can chat in the browser, replies stream in, and conversations survive a reload
- [ ] Usable on a phone-width screen (375px)

## 1.6 Profile memory

Create `server/utils/memory/`:

- `facts.ts`: `listFacts(userId)`, `addFact(userId, fact, category, sourceMessageId?)`, `updateFact(userId, id, fact)`, `deleteFact(userId, id)`.
- `extract.ts`: `extractFacts(userId, conversationId)`:
  1. Load the last 6 messages and the existing facts.
  2. Call `getLlm('extraction').completeJson` with a prompt asking for **lasting** facts about the user (identity, goals, preferences, important people, health context). It must ignore one-off details and avoid repeating existing facts. Expected JSON: `{ "add": [{ "fact": string, "category": string }], "update": [{ "id": string, "fact": string }] }`.
  3. Validate the result (drop unknown categories, empty facts and unknown IDs), then save it.
- API: `server/api/memory/facts.get.ts`, `server/api/memory/facts/[id].patch.ts`, `server/api/memory/facts/[id].delete.ts`.
- `app/pages/memory.vue`: "What Cima knows about you". Lists facts grouped by category, and lets the user edit and delete them. Link to it from the chat page.

**Tests:** `tests/server/memory/extract.test.ts`, with a mocked LLM:

- [ ] Valid output is saved
- [ ] Unknown categories and empty facts are dropped
- [ ] Updates with an ID that isn't the user's are ignored

**Done when:**

- [ ] After saying "I'm training for a half marathon in April", a fact shows up on `/memory` within a few seconds
- [ ] In a **new** conversation, Cima knows about the half marathon
- [ ] Editing or deleting a fact on `/memory` changes what Cima knows

## 1.7 README

`README.md`: what Cima is (2 sentences, linking to `docs/`), setup steps (env, docker, migrate, seed, dev), env variables, scripts.

**Done when:**

- [ ] Someone can follow the README from a fresh clone to a working chat

---

## Final check

- [ ] `yarn typecheck`, `yarn lint` and `yarn test:run` pass
- [ ] All "Done when" items above are checked
- [ ] No API keys in git; `.env.example` is complete
- [ ] Rules in `AGENTS.md` are followed (LLM and memory only used through their modules, every query filtered by `userId`)
