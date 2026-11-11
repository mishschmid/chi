<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useChat } from '~/composables/useChat'
import { useAudioRecorder } from '~/composables/useAudioRecorder'
import { useAudioPlayer } from '~/composables/useAudioPlayer'
import { useAuth } from '~/composables/useAuth'
import ChatMessage from '~/components/ChatMessage.vue'
import CostBadge from '~/components/CostBadge.vue'
import AppSidebar from '~/components/AppSidebar.vue'
import AmbientBackground from '~/components/AmbientBackground.vue'
import VoiceWaveform from '~/components/VoiceWaveform.vue'
import MicIcon from '~/components/MicIcon.vue'
import SoundWave from '~/components/SoundWave.vue'

const { user, signOut } = useAuth()
const costBadgeRef = ref<InstanceType<typeof CostBadge> | null>(null)

const {
  conversations,
  activeConversationId,
  messages,
  isStreaming,
  error: chatError,
  loadConversations,
  selectConversation,
  createConversation,
  sendMessage,
} = useChat()

const {
  isRecording,
  isTranscribing,
  error: recorderError,
  analyser,
  startRecording,
  stopRecording,
  cancelRecording,
} = useAudioRecorder()

const {
  isPlaying,
  isSynthesizing,
  error: playerError,
  speak,
  stop: stopSpeaking,
} = useAudioPlayer()

const inputMessage = ref('')
const messagesContainer = ref<HTMLElement | null>(null)
const isSidebarOpen = ref(false)
const autoVoiceReply = ref(true)

const backgroundEnergy = computed(() => {
  if (isStreaming.value || isTranscribing.value) return 1
  if (isRecording.value || isPlaying.value) return 0.6
  return 0
})

const lastAssistantIndex = computed(() => {
  for (let i = messages.value.length - 1; i >= 0; i--) {
    if (messages.value[i]?.role === 'assistant') {
      return i
    }
  }
  return -1
})

onMounted(async () => {
  await loadConversations()
  costBadgeRef.value?.refresh()
  scrollToBottom()
})

watch(
  () => messages.value.map((m) => m.content).join(''),
  () => {
    scrollToBottom()
  }
)

function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

async function handleSend() {
  const text = inputMessage.value
  if (!text.trim() || isStreaming.value) return
  inputMessage.value = ''
  stopSpeaking()
  await sendMessage(text)
  costBadgeRef.value?.refresh()
}

async function toggleVoiceRecording() {
  stopSpeaking()
  if (isRecording.value) {
    const transcribedText = await stopRecording()
    if (transcribedText) {
      const response = await sendMessage(transcribedText)
      costBadgeRef.value?.refresh()
      if (response && autoVoiceReply.value) {
        await speak(response)
      }
    }
  } else {
    await startRecording()
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
}

async function handleSelect(id: string) {
  stopSpeaking()
  await selectConversation(id)
  isSidebarOpen.value = false
}
</script>

<template>
  <div class="chat-layout">
    <AppSidebar
      :conversations="conversations"
      :active-id="activeConversationId"
      :disabled="isStreaming"
      :open="isSidebarOpen"
      :user="user"
      @select="handleSelect"
      @create="createConversation"
      @sign-out="signOut"
    />

    <div v-if="isSidebarOpen" class="sidebar-backdrop" @click="isSidebarOpen = false" />

    <main class="chat-main">
      <ClientOnly>
        <AmbientBackground :energy="backgroundEnergy" />
      </ClientOnly>
      <header class="chat-header">
        <button class="btn btn--icon mobile-only" @click="isSidebarOpen = !isSidebarOpen">
          ☰
        </button>
        <span class="chat-header__title">
          {{
            conversations.find((c) => c.id === activeConversationId)?.title || 'New conversation'
          }}
        </span>
        <div class="chat-header__controls">
          <CostBadge ref="costBadgeRef" />
          <button
            v-if="isPlaying || isSynthesizing"
            class="btn btn--voice-status"
            title="Stop Chi speaking"
            @click="stopSpeaking"
          >
            <SoundWave size="sm" />
            <span>Speaking</span>
            <span class="desktop-only"> (Click to stop)</span>
          </button>
          <NuxtLink to="/memory" class="btn btn--subtle mobile-only">Memory</NuxtLink>
        </div>
      </header>

      <div ref="messagesContainer" class="messages-list">
        <div v-if="messages.length === 0" class="messages-empty">
          <p class="messages-empty__title">Hey there</p>
          <p class="messages-empty__desc">Talk to Chi with voice or type below.</p>
        </div>
        <ChatMessage
          v-for="(msg, idx) in messages"
          :key="idx"
          :role="msg.role"
          :content="msg.content"
          :model="msg.model"
          :total-tokens="msg.totalTokens"
          :cost-usd="msg.costUsd"
          :thinking="isStreaming && msg.role === 'assistant' && idx === messages.length - 1"
          :speaking="
            (isPlaying || isSynthesizing) &&
            msg.role === 'assistant' &&
            idx === lastAssistantIndex
          "
          @stop-speaking="stopSpeaking"
        />
      </div>

      <div v-if="chatError || recorderError || playerError" class="error-banner">
        {{ chatError || recorderError || playerError }}
      </div>

      <footer class="chat-input-area">
        <button
          :class="[
            'btn-voice',
            { 'btn-voice--recording': isRecording },
            { 'btn-voice--transcribing': isTranscribing },
          ]"
          :disabled="isStreaming"
          :title="isRecording ? 'Click to stop and send' : 'Hold or click to speak'"
          @click="toggleVoiceRecording"
        >
          <span v-if="isRecording" class="stop-icon" />
          <span v-else-if="isTranscribing" class="spinner" />
          <MicIcon v-else />
        </button>

        <div v-if="isRecording" class="voice-pill" @click="toggleVoiceRecording">
          <VoiceWaveform :analyser="analyser" />
        </div>

        <textarea
          v-else
          v-model="inputMessage"
          class="chat-textarea"
          rows="1"
          placeholder="Ask Chi anything..."
          :disabled="isStreaming || isRecording"
          @keydown="handleKeydown"
        />

        <button
          class="btn btn--send"
          :disabled="isStreaming || !inputMessage.trim() || isRecording"
          @click="handleSend"
        >
          Send
        </button>
      </footer>
    </main>
  </div>
</template>

<style scoped lang="scss">
.chat-layout {
  display: flex;
  height: 100vh;
  height: 100dvh;
  width: 100%;
  max-width: 100vw;
  overflow: hidden;
  background-color: $bg-app;
}

.sidebar-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 15;
}

.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
  min-width: 0;
  overflow: hidden;
}

.chat-header {
  height: 54px;
  border-bottom: 1px solid $border-subtle;
  display: flex;
  align-items: center;
  padding: 0 1rem;
  gap: 0.75rem;
  background-color: rgba($bg-app, 0.55);
  backdrop-filter: blur(12px);
  position: relative;
  z-index: 1;
  min-width: 0;

  &__title {
    font-weight: 600;
    font-size: 0.95rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
    min-width: 0;
  }

  &__controls {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-shrink: 0;
  }
}

.btn--voice-status {
  background-color: rgba($accent, 0.12);
  color: $accent;
  border: 1px solid rgba($accent, 0.3);
  font-size: 0.8rem;
  border-radius: $radius-full;
  padding: 0.25rem 0.65rem;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  white-space: nowrap;
  flex-shrink: 0;
  transition: all 0.2s ease;

  &:hover {
    background-color: rgba($accent, 0.22);
    border-color: $accent;
  }
}

.messages-list {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 1;
}

.messages-empty {
  margin: auto;
  text-align: center;
  color: $text-muted;

  &__title {
    font-size: 1.25rem;
    color: $text-secondary;
    margin-bottom: 0.25rem;
  }

  &__desc {
    font-size: 0.9rem;
  }
}

.error-banner {
  background-color: rgba(239, 68, 68, 0.15);
  color: #fca5a5;
  border: 1px solid rgba(239, 68, 68, 0.3);
  padding: 0.5rem 1rem;
  font-size: 0.85rem;
  margin: 0 1rem;
  border-radius: $radius-sm;
  position: relative;
  z-index: 1;
}

.chat-input-area {
  padding: 1rem;
  border-top: 1px solid $border-subtle;
  display: flex;
  gap: 0.5rem;
  align-items: flex-end;
  background-color: rgba($bg-app, 0.55);
  backdrop-filter: blur(12px);
  position: relative;
  z-index: 1;
  min-width: 0;
}

.voice-pill {
  flex: 1;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: $radius-full;
  border: 1px solid $border-strong;
  background-color: $bg-surface-elevated;
  box-shadow:
    0 8px 24px rgba(0, 0, 0, 0.45),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
  cursor: pointer;
}

.stop-icon {
  width: 12px;
  height: 12px;
  border-radius: 3px;
  background-color: currentColor;
}

.spinner {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid rgba($accent, 0.25);
  border-top-color: $accent;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.btn-voice {
  width: 42px;
  height: 42px;
  flex-shrink: 0;
  border-radius: $radius-full;
  border: 1px solid $border-subtle;
  background-color: $bg-surface;
  color: $text-primary;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1.15rem;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background-color: $bg-surface-elevated;
    border-color: $accent;
  }

  &--recording {
    background-color: $accent !important;
    border-color: $accent-hover !important;
    color: #fff !important;
    box-shadow: 0 0 0 0 rgba($accent, 0.5);
    animation: ring 1.6s ease-out infinite;
  }

  &--transcribing {
    background-color: $accent-dim;
    border-color: $accent;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.chat-textarea {
  flex: 1;
  min-width: 0;
  background-color: $bg-input;
  color: $text-primary;
  border: 1px solid $border-subtle;
  border-radius: $radius-md;
  padding: 0.75rem 1rem;
  font-size: 0.95rem;
  resize: none;
  font-family: inherit;
  outline: none;

  &:focus {
    border-color: $accent;
  }

  &:disabled {
    opacity: 0.5;
  }
}

.btn {
  background: none;
  border: none;
  cursor: pointer;
  color: $text-primary;
  font-family: inherit;
  font-size: 0.85rem;
  border-radius: $radius-sm;
  padding: 0.4rem 0.75rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  &--primary {
    background-color: $accent-dim;
    color: $accent;
    font-weight: 500;

    &:hover:not(:disabled) {
      background-color: $accent;
      color: #000;
    }
  }

  &--send {
    background-color: $accent;
    color: #000;
    font-weight: 600;
    height: 40px;
    padding: 0 1rem;
    flex-shrink: 0;

    &:hover:not(:disabled) {
      background-color: $accent-hover;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  &--icon {
    font-size: 1.25rem;
    padding: 0.25rem;
  }

  &--subtle {
    color: $text-secondary;
    text-decoration: none;
    font-size: 0.85rem;
  }
}

.mobile-only {
  display: none;

  @media (max-width: 768px) {
    display: inline-flex;
  }
}

.desktop-only {
  @media (max-width: 768px) {
    display: none;
  }
}

@keyframes ring {
  0% {
    box-shadow: 0 0 0 0 rgba($accent, 0.5);
  }
  100% {
    box-shadow: 0 0 0 12px rgba($accent, 0);
  }
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.06);
    opacity: 0.85;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
