<script setup lang="ts">
import { ref, onMounted, nextTick, watch } from 'vue'
import { useChat } from '~/composables/useChat'
import { useAudioRecorder } from '~/composables/useAudioRecorder'
import { useAudioPlayer } from '~/composables/useAudioPlayer'
import { useAuth } from '~/composables/useAuth'
import ChatMessage from '~/components/ChatMessage.vue'

const { user, signOut } = useAuth()

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

onMounted(async () => {
  await loadConversations()
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
}

async function toggleVoiceRecording() {
  stopSpeaking()
  if (isRecording.value) {
    const transcribedText = await stopRecording()
    if (transcribedText) {
      const response = await sendMessage(transcribedText)
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
    <aside :class="['sidebar', { 'sidebar--open': isSidebarOpen }]">
      <div class="sidebar__header">
        <div class="sidebar__logo">
          <h2>Chi</h2>
        </div>
        <div class="sidebar__actions">
          <NuxtLink to="/settings" class="sidebar__link">Settings</NuxtLink>
          <NuxtLink to="/memory" class="sidebar__link">Memory</NuxtLink>
          <button class="btn btn--primary" :disabled="isStreaming" @click="createConversation">
            + New
          </button>
        </div>
      </div>

      <nav class="sidebar__list">
        <div
          v-for="c in conversations"
          :key="c.id"
          :class="['sidebar__item', { 'sidebar__item--active': c.id === activeConversationId }]"
          @click="handleSelect(c.id)"
        >
          <span class="sidebar__item-title">{{ c.title || 'Untitled chat' }}</span>
        </div>
        <div v-if="conversations.length === 0" class="sidebar__empty">No conversations yet</div>
      </nav>

      <div class="sidebar__footer">
        <div class="user-info">
          <span class="user-name">{{ user?.name || 'Account' }}</span>
          <span class="user-email">{{ user?.email }}</span>
        </div>
        <button class="btn btn--subtle btn--logout" title="Sign out" @click="signOut">
          Sign out
        </button>
      </div>
    </aside>

    <div v-if="isSidebarOpen" class="sidebar-backdrop" @click="isSidebarOpen = false" />

    <main class="chat-main">
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
          <button
            v-if="isPlaying || isSynthesizing"
            class="btn btn--voice-status"
            title="Stop Chi speaking"
            @click="stopSpeaking"
          >
            🔊 Speaking (Click to stop)
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
          <span v-if="isRecording" class="pulse-icon">●</span>
          <span v-else-if="isTranscribing" class="transcribing-icon">⏳</span>
          <span v-else class="mic-icon">🎙</span>
        </button>

        <textarea
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
  width: 100vw;
  overflow: hidden;
  background-color: $bg-app;
}

.sidebar {
  width: 260px;
  background-color: $bg-surface;
  border-right: 1px solid $border-subtle;
  display: flex;
  flex-direction: column;
  z-index: 20;

  @media (max-width: 768px) {
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    transform: translateX(-100%);
    transition: transform 0.2s ease;

    &--open {
      transform: translateX(0);
    }
  }

  &__header {
    padding: 1rem;
    border-bottom: 1px solid $border-subtle;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  &__logo h2 {
    font-size: 1.25rem;
    font-weight: 700;
    color: $accent;
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  &__link {
    color: $text-secondary;
    text-decoration: none;
    font-size: 0.85rem;
    padding: 0.35rem 0.5rem;
    border-radius: $radius-sm;

    &:hover {
      color: $text-primary;
      background-color: $bg-surface-elevated;
    }
  }

  &__list {
    flex: 1;
    overflow-y: auto;
    padding: 0.5rem;
  }

  &__item {
    padding: 0.6rem 0.75rem;
    border-radius: $radius-sm;
    cursor: pointer;
    margin-bottom: 0.25rem;
    color: $text-secondary;
    font-size: 0.9rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    &:hover {
      background-color: $bg-surface-elevated;
      color: $text-primary;
    }

    &--active {
      background-color: $bg-surface-elevated;
      color: $text-primary;
      font-weight: 500;
    }
  }

  &__empty {
    padding: 1rem;
    font-size: 0.85rem;
    color: $text-muted;
    text-align: center;
  }

  &__footer {
    padding: 0.75rem 1rem;
    border-top: 1px solid $border-subtle;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;

    .user-info {
      display: flex;
      flex-direction: column;
      overflow: hidden;
      font-size: 0.85rem;

      .user-name {
        font-weight: 600;
        color: $text-primary;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .user-email {
        font-size: 0.75rem;
        color: $text-muted;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }

    .btn--logout {
      font-size: 0.8rem;
      padding: 0.25rem 0.5rem;
      color: #f87171;
    }
  }
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
}

.chat-header {
  height: 54px;
  border-bottom: 1px solid $border-subtle;
  display: flex;
  align-items: center;
  padding: 0 1rem;
  gap: 0.75rem;
  background-color: $bg-app;

  &__title {
    font-weight: 600;
    font-size: 0.95rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
  }

  &__controls {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
}

.btn--voice-status {
  background-color: rgba($accent, 0.15);
  color: $accent;
  border: 1px solid rgba($accent, 0.3);
  font-size: 0.8rem;
  border-radius: $radius-full;
  padding: 0.25rem 0.75rem;
  animation: pulse 1.8s infinite;
}

.messages-list {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
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
}

.chat-input-area {
  padding: 1rem;
  border-top: 1px solid $border-subtle;
  display: flex;
  gap: 0.5rem;
  align-items: flex-end;
  background-color: $bg-app;
}

.btn-voice {
  width: 42px;
  height: 42px;
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
    background-color: #ef4444 !important;
    border-color: #f87171 !important;
    color: #fff !important;
    animation: pulse 1.2s infinite;
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
