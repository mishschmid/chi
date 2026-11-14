# Task 05 – Semantic Vector Memory (pgvector)

**Goal:** Upgrade Cima's memory system from loading all facts to performing semantic similarity search via `pgvector`. Every extracted memory gets an embedding vector (`vector(1536)`). On incoming messages, Cima performs a cosine distance search and injects only the most relevant memories into the prompt.

---

## 5.1 Schema & Migration

- Add `embedding: vector('embedding', { dimensions: 1536 })` to `profile_facts` in `server/database/schema.ts`.
- Add an HNSW or IVFFlat cosine index on `profile_facts(embedding vector_cosine_ops)`.
- Generate migration `0004_...` and apply to database.

## 5.2 Embeddings Generator (`server/utils/memory/embeddings.ts`)

- Implement `generateEmbedding(text: string, userId: string): Promise<number[]>` using OpenAI `text-embedding-3-small`.
- Resolves user's OpenAI API key via `getOpenAiKeyForUser`.

## 5.3 Semantic Search Function (`server/utils/memory/search.ts`)

- `searchRelevantFacts(userId: string, query: string, limit = 6): Promise<ProfileFact[]>`
- Generates query embedding and runs Drizzle cosine distance query:
  `sql`${profileFacts.embedding} <=> ${vector}``
- Falls back gracefully to recent facts if embeddings are absent.

## 5.4 Automatic Vectorization on Memory Extraction & Backfill

- Update `server/utils/memory/facts.ts` and `extract.ts` so all added/updated facts generate and store embeddings.
- Add backfill script `scripts/backfill-embeddings.ts` for existing facts without vectors.

## 5.5 Integrate into Prompt Builder

- In `server/api/conversations/[id]/messages.post.ts`:
  - Search relevant facts based on user query + recent conversation context.
  - Inject relevant facts into `buildSystemPrompt`.

## 5.6 Tests & Verification

- Unit tests for vector search and cosine ranking.
- `yarn typecheck`, `yarn lint`, `yarn test:run`.
