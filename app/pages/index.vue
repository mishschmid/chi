<script setup lang="ts">
import { ref, onMounted, nextTick, watch } from 'vue'
import { useChat } from '~/composables/useChat'
import ChatMessage from '~/components/ChatMessage.vue'

const {
  conversations,
  activeConversationId,
  messages,
  isStreaming,
  error,
  loadConversations,
  selectConversation,
  createConversation,
  sendMessage,
} = useChat()

const inputMessage = ref('')
const messagesContainer = ref<HTMLElement | null>(null)
const isSidebarOpen = ref(false)

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
  await sendMessage(text)
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
}

async function handleSelect(id: string) {
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
        <NuxtLink to="/memory" class="btn btn--subtle mobile-only">Memory</NuxtLink>
      </header>

      <div ref="messagesContainer" class="messages-list">
        <div v-if="messages.length === 0" class="messages-empty">
          <p class="messages-empty__title">Hey there</p>
          <p class="messages-empty__desc">Talk to Chi by typing below.</p>
        </div>
        <ChatMessage
          v-for="(msg, idx) in messages"
          :key="idx"
          :role="msg.role"
          :content="msg.content"
          :model="msg.model"
        />
      </div>

      <div v-if="error" class="error-banner">
        {{ error }}
      </div>

      <footer class="chat-input-area">
        <textarea
          v-model="inputMessage"
          class="chat-textarea"
          rows="1"
          placeholder="Ask Chi anything..."
          :disabled="isStreaming"
          @keydown="handleKeydown"
        />
        <button
          class="btn btn--send"
          :disabled="isStreaming || !inputMessage.trim()"
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
</style>
