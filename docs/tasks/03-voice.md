# Task 03 – Voice (Push-to-Talk)

**Goal:** Turn Chi into a voice-first experience in the browser. The user can press-and-hold (or toggle) a microphone button, speak, have their speech transcribed via Whisper/STT, receive Chi's streaming response, and listen to Chi speak back via TTS.

---

## 3.1 Audio Transcription API (`/api/voice/transcribe.post.ts`)

- Accepts audio file/blob via `multipart/form-data` (or raw audio buffer).
- Calls OpenAI audio transcriptions (`whisper-1`) with auto language detection (supporting Swiss/German, English, French, Italian).
- Returns `{ text: string }`.

## 3.2 Audio Synthesis API (`/api/voice/synthesize.post.ts`)

- Accepts `{ text: string, voice?: string }`.
- Calls OpenAI TTS (`tts-1` or `tts-1-hd` with natural voice like `alloy`, `nova`, `echo`).
- Returns `audio/mpeg` audio stream or binary buffer for direct playback.

## 3.3 Audio Recorder Composable (`app/composables/useAudioRecorder.ts`)

- Accesses `navigator.mediaDevices.getUserMedia({ audio: true })`.
- Handles `MediaRecorder` recording, state tracking (`isRecording`, `audioBlob`), and error reporting (e.g. permission denied).

## 3.4 Speech Playback Composable (`app/composables/useAudioPlayer.ts`)

- Manages audio queuing and streaming playback so Chi's voice can play immediately or upon response completion.
- Controls: `isPlaying`, `stop()`.

## 3.5 UI Integration in Chat

- Add a dedicated, tactile microphone button in `app/pages/index.vue` next to the textarea.
- Visual state:
  - Resting: subtle microphone icon.
  - Recording: glowing/pulsing accent ring, audio waveform or simple level indicator.
  - Transcribing: loading indicator.
  - Speaking: subtle sound-wave indicator with a mute/stop toggle.
- Automatically trigger message sending on transcription completion.
- Auto-play voice response if the user sent the prompt via voice.

## 3.6 Tests & Verification

- Unit test for audio API payload validations.
- `yarn typecheck`, `yarn lint`, `yarn test:run`.
