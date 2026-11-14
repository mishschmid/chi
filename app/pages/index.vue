<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useChat } from '~/composables/useChat'
import { useAudioRecorder } from '~/composables/useAudioRecorder'
import { useAudioPlayer } from '~/composables/useAudioPlayer'
import { useAuth } from '~/composables/useAuth'
import { useTheme } from '~/composables/useTheme'
import ChatMessage from '~/components/ChatMessage.vue'
import CostBadge from '~/components/CostBadge.vue'
import AppSidebar from '~/components/AppSidebar.vue'
import AmbientBackground from '~/components/AmbientBackground.vue'
import VoiceWaveform from '~/components/VoiceWaveform.vue'

const { user, signOut } = useAuth()
const { orangeStartScreen } = useTheme()
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

const isHeroView = computed(() => {
  return orangeStartScreen.value && messages.value.length === 0
})

const greetingText = computed(() => {
  if (isRecording.value) return 'Listening\nto you…'
  const hour = new Date().getHours()
  const firstName = user.value?.name ? user.value.name.split(' ')[0] : 'there'
  if (hour < 12) return `Good morning,\n${firstName}.`
  if (hour < 18) return `Good afternoon,\n${firstName}.`
  return `Good evening,\n${firstName}.`
})

const activeConversationTitle = computed(() => {
  const current = conversations.value.find((c) => c.id === activeConversationId.value)
  return current?.title || messages.value[0]?.content || 'New conversation'
})

const recentConversations = computed(() => {
  return conversations.value
    .filter((c) => c.id !== activeConversationId.value && c.title)
    .slice(0, 2)
})

const formattedFullDate = computed(() => {
  return new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
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
  const text = inputMessage.value.trim()
  if (!text || isStreaming.value) return
  inputMessage.value = ''
  stopSpeaking()
  const response = await sendMessage(text)
  costBadgeRef.value?.refresh()
  if (response && autoVoiceReply.value && isPlaying.value) {
    await speak(response)
  }
}

async function sendQuickTopic(topic: string) {
  if (isStreaming.value) return
  inputMessage.value = ''
  stopSpeaking()
  await sendMessage(`Tell me about my ${topic.toLowerCase()} lately.`)
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

function handleSelectConversation(id: string) {
  isSidebarOpen.value = false
  selectConversation(id)
}

function handleCreateConversation() {
  isSidebarOpen.value = false
  createConversation()
}
</script>

<template>
  <div class="cima-app-shell">
    <!-- Desktop Sidebar / Mobile Drawer -->
    <AppSidebar
      :conversations="conversations"
      :active-id="activeConversationId"
      :open="isSidebarOpen"
      :user="user"
      active-section="chats"
      @select="handleSelectConversation"
      @create="handleCreateConversation"
      @sign-out="signOut"
      @close="isSidebarOpen = false"
    />

    <!-- Mobile Drawer Overlay -->
    <div v-if="isSidebarOpen" class="mobile-backdrop" @click="isSidebarOpen = false" />

    <!-- Main Container Panel -->
    <div class="main-panel-wrap">
      <!-- Mobile Top Navigation Header -->
      <header class="mobile-nav-bar">
        <div class="mobile-nav-bar__brand">cima<span class="brand-dot">.</span></div>
        <div class="mobile-nav-bar__actions">
          <button class="circle-btn" title="New conversation" @click="handleCreateConversation">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
          <button
            class="circle-btn circle-btn--dark"
            title="Open navigation"
            @click="isSidebarOpen = true"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
        </div>
      </header>

      <!-- VIEW A: Orange Hero Screen (D3) -->
      <main v-if="isHeroView" class="main-panel main-panel--hero">
        <AmbientBackground variant="hero" :listening="isRecording" />

        <!-- Hero Top Header -->
        <div class="hero-header">
          <div class="hero-header__meta">
            <span class="hero-header__label">New conversation</span>
            <span class="hero-header__date">{{ formattedFullDate }}</span>
          </div>
          <CostBadge ref="costBadgeRef" variant="hero" />
        </div>

        <!-- Hero Center Section -->
        <div class="hero-center">
          <h1 class="hero-greeting">{{ greetingText }}</h1>
          <p class="hero-subtitle">Ask about your runs, your meals, or whatever is on your mind.</p>

          <!-- Hero Composer -->
          <div class="hero-composer">
            <button
              :class="[
                'mic-btn',
                { 'mic-btn--active': isRecording, 'mic-btn--recording': isRecording },
              ]"
              :title="isRecording ? 'Click to stop and send' : 'Start voice input'"
              @click="toggleVoiceRecording"
            >
              <span v-if="isRecording" class="stop-icon" />
              <svg
                v-else
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                <line x1="12" y1="19" x2="12" y2="22"></line>
              </svg>
            </button>

            <div
              v-if="isRecording"
              class="hero-waveform-wrap"
              title="Click to stop and send"
              @click="toggleVoiceRecording"
            >
              <VoiceWaveform :analyser="analyser" />
            </div>

            <input
              v-else
              v-model="inputMessage"
              class="hero-input"
              type="text"
              placeholder="Ask Cima anything…"
              @keydown="handleKeydown"
            />

            <button
              class="hero-send-btn"
              :disabled="!isRecording && !inputMessage.trim()"
              @click="isRecording ? toggleVoiceRecording() : handleSend()"
            >
              Send
            </button>
          </div>

          <!-- Quick Topic Chips -->
          <div class="hero-topics">
            <span class="hero-topic hero-topic--active" @click="sendQuickTopic('Runs')">Runs</span>
            <span class="hero-topic" @click="sendQuickTopic('Food')">Food</span>
            <span class="hero-topic" @click="sendQuickTopic('Sleep')">Sleep</span>
            <span class="hero-topic" @click="sendQuickTopic('Mood')">Mood</span>
            <span class="hero-topic" @click="sendQuickTopic('Plans')">Plans</span>
          </div>
        </div>

        <!-- Hero Bottom Cards (Continue Recent) -->
        <div v-if="recentConversations.length > 0" class="hero-continue-grid">
          <div
            v-for="c in recentConversations"
            :key="c.id"
            class="continue-card"
            @click="selectConversation(c.id)"
          >
            <div class="continue-card__avatar">c</div>
            <div class="continue-card__info">
              <span class="continue-card__meta">Continue · recent</span>
              <span class="continue-card__title">{{ c.title }}</span>
            </div>
            <div class="continue-card__icon">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <line x1="7" y1="17" x2="17" y2="7"></line>
                <polyline points="7 7 17 7 17 17"></polyline>
              </svg>
            </div>
          </div>
        </div>
      </main>

      <!-- VIEW B: Active Chat Stream (D1 / D2) -->
      <main v-else class="main-panel main-panel--chat">
        <AmbientBackground :listening="isRecording" />

        <!-- Chat Header -->
        <header class="chat-header">
          <div class="chat-header__info">
            <span class="chat-header__meta">Conversation · {{ messages.length }} messages</span>
            <h2 class="chat-header__title">{{ activeConversationTitle }}</h2>
          </div>
          <CostBadge ref="costBadgeRef" variant="standard" />
          <NuxtLink to="/settings" class="circle-btn" title="Settings">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <line x1="4" y1="21" x2="4" y2="14"></line>
              <line x1="4" y1="10" x2="4" y2="3"></line>
              <line x1="12" y1="21" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12" y2="3"></line>
              <line x1="20" y1="21" x2="20" y2="16"></line>
              <line x1="20" y1="12" x2="20" y2="3"></line>
              <line x1="1" y1="14" x2="7" y2="14"></line>
              <line x1="9" y1="8" x2="15" y2="8"></line>
              <line x1="17" y1="16" x2="23" y2="16"></line>
            </svg>
          </NuxtLink>
        </header>

        <!-- Message Stream -->
        <div ref="messagesContainer" class="chat-messages-container">
          <div class="chat-messages-inner">
            <ChatMessage
              v-for="(msg, idx) in messages"
              :key="idx"
              :role="msg.role"
              :content="msg.content"
              :model="msg.model"
              :total-tokens="msg.totalTokens"
              :cost-usd="msg.costUsd"
              :thinking="isStreaming && idx === messages.length - 1 && msg.role === 'assistant'"
              :speaking="isPlaying && idx === messages.length - 1 && msg.role === 'assistant'"
              @stop-speaking="stopSpeaking"
            />
          </div>
        </div>

        <!-- Chat Composer -->
        <footer class="chat-composer-wrap">
          <div class="chat-composer">
            <button
              :class="[
                'composer-mic-btn',
                {
                  'composer-mic-btn--active': isRecording,
                  'composer-mic-btn--recording': isRecording,
                },
              ]"
              :title="isRecording ? 'Click to stop and send' : 'Voice input'"
              @click="toggleVoiceRecording"
            >
              <span v-if="isRecording" class="stop-icon" />
              <svg
                v-else
                width="19"
                height="19"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                <line x1="12" y1="19" x2="12" y2="22"></line>
              </svg>
            </button>

            <div
              v-if="isRecording"
              class="composer-waveform-wrap"
              title="Click to stop and send"
              @click="toggleVoiceRecording"
            >
              <VoiceWaveform :analyser="analyser" />
            </div>

            <input
              v-else
              v-model="inputMessage"
              class="composer-input"
              type="text"
              placeholder="Ask Cima anything…"
              @keydown="handleKeydown"
            />

            <button
              class="composer-send-btn"
              :disabled="!isRecording && !inputMessage.trim()"
              @click="isRecording ? toggleVoiceRecording() : handleSend()"
            >
              Send
            </button>
          </div>
        </footer>
      </main>
    </div>
  </div>
</template>

<style scoped lang="scss">
.cima-app-shell {
  display: flex;
  height: 100vh;
  width: 100vw;
  padding: 12px;
  gap: 12px;
  box-sizing: border-box;
  background-color: var(--bg-page);
  color: var(--ink);
  overflow: hidden;

  @media (max-width: 900px) {
    padding: 0;
    gap: 0;
    flex-direction: column;
  }
}

.mobile-backdrop {
  display: none;

  @media (max-width: 900px) {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    z-index: 90;
  }
}

.main-panel-wrap {
  flex: 1;
  min-width: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.mobile-nav-bar {
  display: none;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--bg-page);
  flex: none;

  @media (max-width: 900px) {
    display: flex;
  }

  &__brand {
    font-size: 36px;
    font-weight: 500;
    letter-spacing: -0.065em;
    line-height: 0.8;
  }

  &__actions {
    display: flex;
    gap: 8px;
  }
}

.brand-dot {
  color: var(--orange);
}

.circle-btn {
  width: 46px;
  height: 46px;
  border-radius: 50%;
  background: var(--bg-sunken);
  color: var(--ink);
  border: 0;
  display: grid;
  place-items: center;
  flex: none;
  cursor: pointer;
  text-decoration: none;
  transition: opacity 0.15s ease;

  &:hover {
    opacity: 0.85;
  }

  &--dark {
    background: var(--btn-primary);
    color: var(--btn-primary-ink);
  }
}

.main-panel {
  flex: 1;
  min-width: 0;
  position: relative;
  border-radius: var(--radius-panel);
  overflow: hidden;
  display: flex;
  flex-direction: column;

  @media (max-width: 900px) {
    border-radius: 0;
  }

  &--hero {
    background: var(--orange);
    color: var(--on-orange);
    padding: 28px 40px;
    box-sizing: border-box;
    gap: 28px;

    @media (max-width: 768px) {
      padding: 20px 18px;
      gap: 16px;
    }
  }

  &--chat {
    background: var(--bg-surface);
  }
}

/* Hero Section Styles */
.hero-header {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;

  &__meta {
    display: flex;
    flex-direction: column;
    line-height: 1.15;
  }

  &__label {
    font-size: 13px;
    font-weight: 600;
    color: var(--on-orange);
  }

  &__date {
    font-size: 11px;
    color: var(--on-orange-muted);
  }
}

.hero-center {
  position: relative;
  z-index: 1;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 22px;
}

.hero-greeting {
  font-size: 104px;
  font-weight: 300;
  letter-spacing: -0.055em;
  line-height: 0.92;
  white-space: pre-line;
  color: var(--on-orange);

  @media (max-width: 1024px) {
    font-size: 64px;
  }

  @media (max-width: 600px) {
    font-size: 48px;
  }
}

.hero-subtitle {
  font-size: 20px;
  color: var(--on-orange-muted);
  max-width: 560px;
  line-height: 1.4;

  @media (max-width: 600px) {
    font-size: 16px;
  }
}

.hero-composer {
  max-width: 760px;
  width: 100%;
  background: rgba(17, 17, 17, 0.09);
  border-radius: var(--radius-pill);
  padding: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  box-sizing: border-box;

  .mic-btn {
    width: 52px;
    height: 52px;
    border-radius: 50%;
    border: 0;
    background: rgba(17, 17, 17, 0.1);
    color: #111;
    display: grid;
    place-items: center;
    cursor: pointer;
    flex: none;
    transition: background-color 0.15s ease;

    &--active {
      background: #111;
      color: #fff;
    }

    &--recording {
      background: #111111 !important;
      box-shadow:
        0 0 0 2px var(--orange),
        0 0 0 4px #111111;
      animation: mic-pulse-hero 1.6s ease-out infinite;

      .stop-icon {
        background-color: var(--orange);
      }
    }
  }

  .hero-waveform-wrap {
    flex: 1;
    min-width: 0;
    height: 52px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    padding: 0 16px;
    color: var(--on-orange);
  }

  .hero-input {
    flex: 1;
    min-width: 0;
    border: 0;
    background: transparent;
    outline: none;
    font-size: 18px;
    color: #111;
    padding: 0 8px;

    &::placeholder {
      color: #111;
      opacity: 0.55;
    }
  }

  .hero-send-btn {
    height: 52px;
    border-radius: var(--radius-pill);
    border: 0;
    background: #111;
    color: #fff;
    padding: 0 28px;
    font-size: 15px;
    font-weight: 500;
    cursor: pointer;
    flex: none;

    &:hover {
      opacity: 0.9;
    }
  }
}

.hero-topics {
  display: flex;
  gap: 28px;
  font-size: 76px;
  font-weight: 400;
  letter-spacing: -0.045em;
  line-height: 1;
  white-space: nowrap;
  overflow: hidden;
  user-select: none;

  @media (max-width: 1024px) {
    font-size: 48px;
    gap: 16px;
  }

  @media (max-width: 600px) {
    font-size: 32px;
  }

  .hero-topic {
    color: rgba(17, 17, 17, 0.42);
    cursor: pointer;
    transition: color 0.15s ease;

    &:hover,
    &--active {
      color: #111;
    }
  }
}

.hero-continue-grid {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.continue-card {
  background: #ffffff;
  color: #111;
  border-radius: 26px;
  padding: 16px 16px 16px 20px;
  display: flex;
  align-items: center;
  gap: 14px;
  cursor: pointer;
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  }

  &__avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: #111111;
    color: var(--orange);
    display: grid;
    place-items: center;
    font-size: 18px;
    font-weight: 600;
    flex: none;
  }

  &__info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
    flex: 1;
  }

  &__meta {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--ink-2);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  &__title {
    font-size: 18px;
    font-weight: 500;
    letter-spacing: -0.02em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__icon {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: var(--bg-sunken);
    display: grid;
    place-items: center;
    flex: none;
  }
}

/* Chat View Styles */
.chat-header {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px 28px 16px;
  border-bottom: 1px solid var(--line);

  &__info {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
    flex: 1;
  }

  &__meta {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--ink-2);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  &__title {
    font-size: 30px;
    font-weight: 500;
    letter-spacing: -0.035em;
    line-height: 1.1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin: 0;
  }
}

.chat-messages-container {
  position: relative;
  z-index: 1;
  flex: 1;
  overflow-y: auto;
  padding: 20px 28px;
}

.chat-messages-inner {
  max-width: 880px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.chat-composer-wrap {
  position: relative;
  z-index: 1;
  padding: 14px 28px 24px;

  @media (max-width: 600px) {
    padding: 8px 12px 18px;
  }
}

.chat-composer {
  max-width: 880px;
  margin: 0 auto;
  background: var(--bg-sunken);
  border-radius: var(--radius-pill);
  padding: 8px;
  display: flex;
  align-items: center;
  gap: 8px;

  .composer-mic-btn {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    border: 0;
    background: var(--bg-surface);
    color: var(--ink);
    display: grid;
    place-items: center;
    cursor: pointer;
    flex: none;
    transition:
      background-color 0.15s ease,
      color 0.15s ease;

    &--active {
      background: var(--orange);
      color: var(--on-orange);
    }

    &--recording {
      background: var(--orange) !important;
      color: #fff !important;
      box-shadow:
        0 0 0 2px var(--bg-surface),
        0 0 0 4px var(--orange);
      animation: mic-pulse 1.6s ease-out infinite;

      .stop-icon {
        background-color: #ffffff;
      }
    }
  }

  .composer-waveform-wrap {
    flex: 1;
    min-width: 0;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    padding: 0 16px;
    color: var(--ink);
  }

  .stop-icon {
    width: 14px;
    height: 14px;
    border-radius: 3px;
    background-color: #ffffff;
    display: block;
  }

  .composer-input {
    flex: 1;
    min-width: 0;
    border: 0;
    background: transparent;
    outline: none;
    font-size: 17px;
    color: var(--ink);
    padding: 0 8px;

    &::placeholder {
      color: var(--ink-2);
    }
  }

  .composer-send-btn {
    height: 48px;
    border-radius: var(--radius-pill);
    border: 0;
    background: var(--btn-primary);
    color: var(--btn-primary-ink);
    padding: 0 26px;
    font-size: 15px;
    font-weight: 500;
    cursor: pointer;
    flex: none;

    &:hover {
      opacity: 0.9;
    }
  }
}

@keyframes mic-pulse {
  0% {
    box-shadow:
      0 0 0 2px var(--bg-surface),
      0 0 0 3px rgba(255, 91, 53, 0.8);
  }
  50% {
    box-shadow:
      0 0 0 2px var(--bg-surface),
      0 0 0 6px rgba(255, 91, 53, 0.4);
  }
  100% {
    box-shadow:
      0 0 0 2px var(--bg-surface),
      0 0 0 3px rgba(255, 91, 53, 0.8);
  }
}

@keyframes mic-pulse-hero {
  0% {
    box-shadow:
      0 0 0 2px var(--orange),
      0 0 0 3px rgba(17, 17, 17, 0.8);
  }
  50% {
    box-shadow:
      0 0 0 2px var(--orange),
      0 0 0 6px rgba(17, 17, 17, 0.4);
  }
  100% {
    box-shadow:
      0 0 0 2px var(--orange),
      0 0 0 3px rgba(17, 17, 17, 0.8);
  }
}
</style>
