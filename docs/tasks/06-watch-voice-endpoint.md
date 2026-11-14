# Task 06 – Watch Voice Endpoint & Device Tokens

**Goal:** Give non-browser clients (first: the "Cima Voice" Android assistant app, used from a Garmin Fenix 8) a text-in / text-out endpoint. A device authenticates with a revocable bearer token, sends what the user said, and gets back a short, speakable reply. Speech-to-text and TTS happen on the phone, not on the server.

Flow: `Fenix 8 voice button → Android default assistant (Cima Voice) → STT → POST /api/voice/turn → TTS on watch speaker`.

---

## 6.1 Schema & Migration

- Add `device_tokens` to `server/database/schema.ts`:
  - `id` (uuid), `userId` (fk → `user`, cascade delete), `name` (e.g. "Pixel + Fenix 8")
  - `tokenHash` (SHA-256 of the token, unique), `tokenPrefix` (first 8 chars, for display)
  - `createdAt`, `lastUsedAt`, `revokedAt` (nullable)
- Index on `(userId)`.
- `yarn db:generate`, then `yarn db:migrate`.

## 6.2 Token Utilities (`server/utils/deviceTokens.ts`)

- `createDeviceToken(userId, name): Promise<{ token, record }>`: generates `cima_dev_<32 random bytes base64url>` and stores only the hash. The plaintext is returned exactly once.
- `resolveDeviceToken(event): Promise<{ userId, deviceId } | null>`: reads `Authorization: Bearer …`, hashes it, looks it up with `revokedAt IS NULL`, and updates `lastUsedAt` (throttled to at most once a minute).
- `revokeDeviceToken(userId, id)`.
- Extend `getCurrentUserId` (or add `getUserIdFromSessionOrDevice`) so device-authenticated routes resolve the user from the token. The dev-user fallback must **not** apply to bearer requests: an invalid token → `401`.

## 6.3 Token Management API

All routes need a browser session and are scoped by `userId`:

- `GET /api/devices` lists tokens (name, prefix, createdAt, lastUsedAt, revoked).
- `POST /api/devices` `{ name }` → `{ token, device }`.
- `DELETE /api/devices/[id]` revokes a token.

## 6.4 Minimal Devices UI (`app/pages/devices.vue`)

- A list of devices with revoke buttons, and a "New device" form.
- Show the new token once, with a copy button and the note "you won't see this again".
- SCSS only, following the existing styles.

## 6.5 Shared Chat Turn (`server/utils/chat/turn.ts`)

- Move the core logic out of `server/api/conversations/[id]/messages.post.ts` into `runChatTurn({ userId, conversationId, content, mode })`: fact search, prompt build, LLM call, message persistence, cost, fact extraction.
- `mode: 'chat' | 'voice'`. The existing route calls it with `'chat'`, and its behaviour stays the same.
- Model calls still go only through `server/utils/llm/`, and memory only through `server/utils/memory/`.

## 6.6 Voice Prompt Variant (`server/utils/chat/prompt.ts`)

- When `mode === 'voice'`, append these rules: answer in at most 2 short sentences; no markdown, lists, emojis or URLs; write numbers, dates and units as they are spoken; ask at most one question at a time.
- The reply language follows the user's language.

## 6.7 Voice Turn Endpoint (`server/api/voice/turn.post.ts`)

- Auth: device token (6.2). A session also works, so it can be tested from the browser.
- Body: `{ text: string, conversationId?: string }`. Validate that `text` is non-empty, ≤ 1000 chars, and that `conversationId` is a uuid owned by the user.
- Continuity: if `conversationId` is missing, reuse the user's most recent conversation tagged `source = 'voice'` that had a message in the last 2 minutes; otherwise create a new one (title "Voice", `source = 'voice'`, which needs a column on `conversations`).
- Response: `{ reply: string, conversationId: string, expectsFollowUp: boolean }`. Set `expectsFollowUp` to true when the reply ends with a question (simple heuristic for now).
- Errors use `createError`: `400` invalid input, `401` bad token, `502` LLM failure with a short `statusMessage` the app can read aloud.
- Rate limit: 30 requests a minute per device, in memory.

## 6.8 Latency

- Allow a separate voice model through `runtimeConfig.voiceModel` (env `NUXT_VOICE_MODEL`), defaulting to a fast model. Add it to `.env.example`.
- Run fact extraction **after** the response (fire-and-forget), never before replying.
- Log the duration of each step. Target: p50 < 3 s.

## 6.9 Tests & Verification

- Token hashing, resolve, revoke, and that revoked/unknown tokens are rejected.
- `/api/voice/turn` validation, user scoping (a token from user A can't use a conversation of user B), continuity window.
- The voice prompt contains the no-markdown rules.
- Manual check:
  ```sh
  curl -X POST http://localhost:3000/api/voice/turn \
    -H "Authorization: Bearer chi_dev_…" -H "Content-Type: application/json" \
    -d '{"text":"What do I have today?"}'
  ```
- `yarn typecheck`, `yarn lint`, `yarn test:run`.
