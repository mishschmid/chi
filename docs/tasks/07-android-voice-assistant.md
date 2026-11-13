# Task 07 – "Chi Voice" Android Assistant App

**Goal:** A small Android app that registers as the phone's **default digital assistant**. When the Fenix 8 voice-assistant button is pressed, Android opens Chi Voice instead of Gemini. It listens through the watch mic, sends the text to `POST /api/voice/turn` (Task 06), and speaks the reply on the watch speaker.

Depends on: Task 06.

The app lives in a separate repo (`chi-android`), not in this Nuxt repo. Kotlin, min SDK 30, no third-party dependencies beyond AndroidX + OkHttp (or `HttpURLConnection`). Installed from an APK, not the Play Store.

---

## 7.0 Feasibility Check (do this first, ~1 h)

Prove on the real hardware before writing the app:

1. Install any third-party assistant app, set it via _Settings → Apps → Default apps → Digital assistant app_, and press the Fenix 8 voice button. **Does the watch open that app, or only Google/Gemini?**
2. While it is active, do the mic input and spoken output go through the **watch**, or through the phone?

Write the results to `docs/tasks/07-findings.md`. If (1) fails, skip to Task 08 (notification path) and treat this task as blocked.

## 7.1 Assistant Registration

- `ChiVoiceInteractionService` (`VoiceInteractionService`) plus a `VoiceInteractionSessionService`, declared with `android.permission.BIND_VOICE_INTERACTION` and an `interaction_service` XML.
- Fallback: an `AssistActivity` that handles `android.intent.action.ASSIST` and `android.intent.action.VOICE_COMMAND`.
- Permissions: `RECORD_AUDIO`, `INTERNET`, `BLUETOOTH_CONNECT`.

## 7.2 Audio Routing to the Watch

- If a Bluetooth headset (the watch) is connected, route audio to it: `AudioManager.setCommunicationDevice(...)` (API 31+), or `startBluetoothSco()` on older versions.
- Request audio focus (`AUDIOFOCUS_GAIN_TRANSIENT_EXCLUSIVE`) for the whole turn, and release it afterwards.
- If no watch is connected, use the phone's mic and speaker.

## 7.3 Turn Loop

1. Short vibration or tone: "listening".
2. `SpeechRecognizer` (prefer `createOnDeviceSpeechRecognizer` when available), language from settings, partial results on, silence timeout around 1.5 s.
3. `POST {serverUrl}/api/voice/turn` with `Authorization: Bearer <token>`, body `{ text, conversationId }`, timeout 8 s.
4. `TextToSpeech` speaks `reply`, using the same language.
5. If `expectsFollowUp` (and that setting is on), go back to step 1, keeping `conversationId`. Otherwise finish the session.
6. Stop after 3 turns in a row with no speech or 60 s of inactivity.

## 7.4 Errors (never silent)

Each error gets a short spoken line plus a double vibration:

| Case                 | Spoken                                     |
| -------------------- | ------------------------------------------ |
| No speech recognized | "I didn't catch that."                     |
| Network / timeout    | "Chi isn't reachable right now."           |
| `401`                | "This device isn't connected to Chi."      |
| `5xx`                | `statusMessage` or "Something went wrong." |

## 7.5 Settings Screen

- Server URL, device token (pasted from `/devices`, stored in `EncryptedSharedPreferences`), language, "Listen again after questions" toggle.
- A "Test" button that runs one turn with the text "ping" and shows the reply and how long it took.
- A link to the system's default-assistant settings, with a hint if Chi Voice isn't selected.

## 7.6 Privacy

- No audio leaves the phone; only the recognized text is sent.
- Don't log transcripts to logcat in release builds.

## 7.7 Verification

- Manual run on the Pixel/Android phone + Fenix 8:
  - The watch button opens Chi Voice, the question is heard through the watch mic, and the answer is spoken on the watch.
  - A follow-up question keeps context ("And tomorrow?").
  - Airplane mode → the spoken network error.
  - Revoked token → the spoken 401 message.
- Note the latency from button press to first spoken word (target < 4 s).
