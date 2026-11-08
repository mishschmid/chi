# Task 02 – Connect Chi to Health (Sansa / Cima)

**Goal:** Chi gains live awareness of the user's health and training data from Sansa (activities/workouts, daily recovery metrics, and active training plan). The model dynamically calls health tools to answer queries naturally.

---

## 2.1 Sansa API Service Token & Header Auth

In `../sansa`:

- Support a service secret header: `x-chi-secret` (or `x-service-key`) plus `x-user-id` (or defaulting to the primary user) in `server/middleware/auth.ts` and `server/utils/session.ts`.
- When valid `x-chi-secret` is matched against `SANSA_CHI_SERVICE_KEY`, resolve the user directly without requiring a browser session cookie.

## 2.2 Health Client in Chi

In `chi/server/utils/health/`:

- `client.ts`: HTTP client calling Sansa's API (`SANSA_API_URL`, default `http://localhost:3001` or `https://sansa.corippo.com`).
- Functions:
  - `getRecentWorkouts(options?: { limit?: number; sport?: string })`
  - `getRecoveryStats(metric?: string, range?: string)`
  - `getDashboard()`
  - `getActivePlan()`

## 2.3 Tool Definition & Tool-Calling in Chi Model Layer

- Add tool execution capabilities to `server/utils/llm/`:
  - Define schema for tools (`get_recent_workouts`, `get_recovery_metrics`, `get_active_training_plan`).
  - Model loop: when the LLM emits a tool call, Chi executes the tool and returns the response to the LLM to complete its answer.
- Support in OpenAI provider (`tools` / `tool_calls`).

## 2.4 Integration & Tests

- Unit tests for tool calling and health client mapping with mocks.
- End-to-end dialogue verification:
  - User: _"How did my runs go this week?"_ -> Chi calls `get_recent_workouts`, reads pace & distance, and provides a coaching summary.
