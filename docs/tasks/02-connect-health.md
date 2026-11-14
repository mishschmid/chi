# Task 02 – Connect Cima to Health (Sansa)

**Goal:** Cima gains live awareness of the user's health and training data from Sansa (activities/workouts, daily recovery metrics, and active training plan). The model dynamically calls health tools to answer queries naturally.

---

## 2.1 Sansa API Service Token & Header Auth

In `../sansa`:

- Support a service secret header: `x-cima-secret` (or `x-chi-secret` / `x-service-key`) plus `x-user-id` (or defaulting to the primary user) in `server/middleware/auth.ts` and `server/utils/session.ts`.
- When valid `x-cima-secret` is matched against `SANSA_SERVICE_KEY`, resolve the user directly without requiring a browser session cookie.

## 2.2 Health Client in Cima

In `cima/server/utils/health/`:

- `client.ts`: HTTP client calling Sansa's API (`SANSA_API_URL`, default `http://localhost:4444` or `https://sansa.you`).
- Functions:
  - `getRecentWorkouts(options?: { limit?: number; sport?: string })`
  - `getRecoveryStats(metric?: string, range?: string)`
  - `getDashboard()`
  - `getActivePlan()`

## 2.3 Tool Definition & Tool-Calling in Cima Model Layer

- Add tool execution capabilities to `server/utils/llm/`:
  - Define schema for tools (`get_recent_workouts`, `get_recovery_metrics`, `get_active_training_plan`).
  - Model loop: when the LLM emits a tool call, Cima executes the tool and returns the response to the LLM to complete its answer.
- Support in OpenAI provider (`tools` / `tool_calls`).

## 2.4 Integration & Tests

- Unit tests for tool calling and health client mapping with mocks.
- End-to-end dialogue verification:
  - User: _"How did my runs go this week?"_ -> Cima calls `get_recent_workouts`, reads pace & distance, and provides a coaching summary.
