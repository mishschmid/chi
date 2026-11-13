# Task 08 – Confirmations for Risky Voice Actions

**Goal:** Speech recognition can mishear, so actions that change data in child apps (Ciaro payments/transfers, deleting or completing tasks in Done., writing health data via Sansa/health-core) must never run directly from a voice turn. Chi reads the action back and runs it only after an explicit "yes" on the next turn.

Depends on: Task 06. Applies to all tools added for child apps (reached only through their HTTP APIs).

---

## 8.1 Risk Levels on Tools

- Every tool definition gets `risk: 'read' | 'write' | 'destructive'`.
- `read` always runs directly.
- `write` / `destructive` in `mode === 'voice'` create a pending action instead of running.
- In `mode === 'chat'`, only `destructive` needs confirmation, for now.

## 8.2 Schema & Migration

- `pending_actions`: `id`, `userId`, `conversationId`, `toolName`, `args` (jsonb), `summary` (the spoken read-back text), `status` (`pending | confirmed | cancelled | expired`), `createdAt`, `expiresAt` (createdAt + 2 min).
- Index on `(userId, conversationId, status)`.

## 8.3 Pending Action Flow (`server/utils/chat/pendingActions.ts`)

- `createPendingAction(...)` stores the action and returns the `summary`, e.g. "Transfer 50 francs to Anna. Should I do it?".
- At the start of every voice turn, if the conversation has a non-expired `pending` action:
  - The user's text clearly means yes ("yes", "ja", "oui", "sì", "do it", "mach") → run the tool, mark it `confirmed`, and reply with the result.
  - It clearly means no → mark it `cancelled` and reply "Okay, cancelled."
  - Anything else → mark it `cancelled` and treat the text as a normal new turn.
- Decide yes/no with a strict allow-list first. Only use the LLM to classify if the allow-list doesn't match, and treat anything unclear as a no.
- Expired actions are never run.

## 8.4 Response Shape

- `/api/voice/turn` returns `expectsFollowUp: true` while an action is pending, so the Android app keeps listening.
- Add `pendingAction?: { id, summary }` to the response, for debugging and later UI.

## 8.5 Tests & Verification

- A write tool in voice mode creates a pending action and does **not** call the child API (mock fetch).
- "yes" within 2 min runs it once; a second "yes" doesn't run it again.
- "no", unrelated text, and expiry never run it.
- User scoping: a pending action from user A can't be confirmed by user B.
- `yarn typecheck`, `yarn lint`, `yarn test:run`.
