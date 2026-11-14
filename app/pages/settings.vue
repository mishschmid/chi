<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuth } from '~/composables/useAuth'
import { useChat } from '~/composables/useChat'
import { useTheme } from '~/composables/useTheme'
import AppSidebar from '~/components/AppSidebar.vue'

const { user, signOut } = useAuth()
const { conversations, loadConversations } = useChat()
const {
  theme,
  orangeStartScreen,
  voiceInput,
  sendAfterPause,
  showTokenCost,
  setTheme,
  setOrangeStartScreen,
  setVoiceInput,
  setSendAfterPause,
  setShowTokenCost,
} = useTheme()

const hasKey = ref(false)
const maskedKey = ref<string | null>(null)
const newKey = ref('')
const loading = ref(true)
const saving = ref(false)
const error = ref<string | null>(null)
const successMsg = ref<string | null>(null)
const isSidebarOpen = ref(false)

async function loadStatus() {
  loading.value = true
  error.value = null
  try {
    const res = await $fetch<{ hasKey: boolean; maskedKey: string | null }>('/api/profile/openai')
    hasKey.value = res.hasKey
    maskedKey.value = res.maskedKey
  } catch (err: any) {
    error.value = err?.statusMessage || 'Failed to load key status'
  } finally {
    loading.value = false
  }
}

async function handleSave() {
  if (!newKey.value.trim() || saving.value) return
  saving.value = true
  error.value = null
  successMsg.value = null

  try {
    const res = await $fetch<{ hasKey: boolean; maskedKey: string | null }>('/api/profile/openai', {
      method: 'PATCH',
      body: { apiKey: newKey.value.trim() },
    })
    hasKey.value = res.hasKey
    maskedKey.value = res.maskedKey
    newKey.value = ''
    successMsg.value = 'API key saved and verified successfully!'
  } catch (err: any) {
    error.value = err?.statusMessage || err?.data?.message || 'Invalid API key'
  } finally {
    saving.value = false
  }
}

async function handleRemove() {
  if (!confirm('Are you sure you want to remove your OpenAI API key?')) return
  saving.value = true
  error.value = null
  successMsg.value = null

  try {
    const res = await $fetch<{ hasKey: boolean; maskedKey: string | null }>('/api/profile/openai', {
      method: 'DELETE',
    })
    hasKey.value = res.hasKey
    maskedKey.value = null
    successMsg.value = 'API key removed.'
  } catch (err: any) {
    error.value = err?.statusMessage || 'Failed to remove API key'
  } finally {
    saving.value = false
  }
}

async function exportConversations() {
  try {
    const data = await $fetch('/api/conversations')
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cima-conversations-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  } catch (err: any) {
    error.value = 'Failed to export conversations'
  }
}

async function clearMemory() {
  if (!confirm('Are you sure you want Cima to forget all saved memory facts?')) return
  try {
    const facts = await $fetch<{ id: string }[]>('/api/memory/facts')
    await Promise.all(
      facts.map((f) =>
        $fetch(`/api/memory/facts/${f.id}`, {
          method: 'DELETE',
        })
      )
    )
    successMsg.value = 'Memory cleared successfully.'
  } catch (err: any) {
    error.value = 'Failed to clear memory.'
  }
}

onMounted(async () => {
  await Promise.all([loadStatus(), loadConversations()])
})
</script>

<template>
  <div class="cima-app-shell">
    <AppSidebar
      :conversations="conversations"
      :active-id="null"
      :open="isSidebarOpen"
      :user="user"
      active-section="settings"
      @select="(id) => navigateTo(`/?id=${id}`)"
      @create="() => navigateTo('/')"
      @sign-out="signOut"
      @close="isSidebarOpen = false"
    />

    <div v-if="isSidebarOpen" class="mobile-backdrop" @click="isSidebarOpen = false" />

    <div class="main-panel-wrap">
      <!-- Mobile Bar -->
      <header class="mobile-nav-bar">
        <div class="mobile-nav-bar__brand">cima<span class="brand-dot">.</span></div>
        <div class="mobile-nav-bar__actions">
          <NuxtLink to="/" class="circle-btn" title="Back to chat">
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
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </NuxtLink>
          <button
            class="circle-btn circle-btn--dark"
            title="Open menu"
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

      <main class="main-panel">
        <!-- Header -->
        <div class="settings-header">
          <span class="settings-header__meta"
            >{{ user?.name || 'Account' }} · {{ user?.email || 'Settings' }}</span
          >
          <h1 class="settings-header__title">Settings</h1>
        </div>

        <div v-if="error" class="banner banner--error">{{ error }}</div>
        <div v-if="successMsg" class="banner banner--success">{{ successMsg }}</div>

        <!-- 2-Column Settings Grid (D5) -->
        <div class="settings-grid">
          <!-- Card: Appearance -->
          <div class="settings-card">
            <h2 class="settings-card__title">Appearance</h2>

            <div class="setting-row">
              <div class="setting-row__info">
                <span class="setting-row__label">Theme</span>
                <span class="setting-row__hint">Orange stays the same in both</span>
              </div>
              <div class="segmented-control">
                <button
                  :class="[
                    'segmented-control__btn',
                    { 'segmented-control__btn--active': theme === 'light' },
                  ]"
                  @click="setTheme('light')"
                >
                  Light
                </button>
                <button
                  :class="[
                    'segmented-control__btn',
                    { 'segmented-control__btn--active': theme === 'dark' },
                  ]"
                  @click="setTheme('dark')"
                >
                  Dark
                </button>
                <button
                  :class="[
                    'segmented-control__btn',
                    { 'segmented-control__btn--active': theme === 'system' },
                  ]"
                  @click="setTheme('system')"
                >
                  System
                </button>
              </div>
            </div>

            <div class="setting-row">
              <div class="setting-row__info">
                <span class="setting-row__label">Orange start screen</span>
                <span class="setting-row__hint">Full-bleed hero on new conversations</span>
              </div>
              <button
                :class="['toggle-switch', { 'toggle-switch--on': orangeStartScreen }]"
                @click="setOrangeStartScreen(!orangeStartScreen)"
              >
                <span class="toggle-switch__thumb" />
              </button>
            </div>
          </div>

          <!-- Card: Voice -->
          <div class="settings-card">
            <h2 class="settings-card__title">Voice</h2>

            <div class="setting-row">
              <div class="setting-row__info">
                <span class="setting-row__label">Voice input</span>
                <span class="setting-row__hint">Show the microphone in the composer</span>
              </div>
              <button
                :class="['toggle-switch', { 'toggle-switch--on': voiceInput }]"
                @click="setVoiceInput(!voiceInput)"
              >
                <span class="toggle-switch__thumb" />
              </button>
            </div>

            <div class="setting-row">
              <div class="setting-row__info">
                <span class="setting-row__label">Send after a pause</span>
                <span class="setting-row__hint">Sends when you stop talking for 2 s</span>
              </div>
              <button
                :class="['toggle-switch', { 'toggle-switch--on': sendAfterPause }]"
                @click="setSendAfterPause(!sendAfterPause)"
              >
                <span class="toggle-switch__thumb" />
              </button>
            </div>
          </div>

          <!-- Card: Usage -->
          <div class="settings-card">
            <h2 class="settings-card__title">Usage</h2>

            <div class="setting-row">
              <div class="setting-row__info">
                <span class="setting-row__label">Token and cost on messages</span>
                <span class="setting-row__hint">Shown on every Cima reply</span>
              </div>
              <button
                :class="['toggle-switch', { 'toggle-switch--on': showTokenCost }]"
                @click="setShowTokenCost(!showTokenCost)"
              >
                <span class="toggle-switch__thumb" />
              </button>
            </div>

            <div class="setting-row">
              <div class="setting-row__info">
                <span class="setting-row__label">Daily budget</span>
                <span class="setting-row__hint">Configured spending threshold</span>
              </div>
              <div class="pill-chip">$1.00</div>
            </div>
          </div>

          <!-- Card: Data -->
          <div class="settings-card">
            <h2 class="settings-card__title">Data</h2>

            <div class="setting-row">
              <div class="setting-row__info">
                <span class="setting-row__label">Export conversations</span>
                <span class="setting-row__hint">All chats as a JSON file</span>
              </div>
              <button class="pill-btn" @click="exportConversations">Export</button>
            </div>

            <div class="setting-row">
              <div class="setting-row__info">
                <span class="setting-row__label">Clear memory</span>
                <span class="setting-row__hint">Cima forgets all saved facts</span>
              </div>
              <button class="pill-btn pill-btn--danger" @click="clearMemory">Clear</button>
            </div>
          </div>

          <!-- Card: AI Keys & Model (BYOK) -->
          <div class="settings-card settings-card--full">
            <h2 class="settings-card__title">OpenAI API Key (BYOK)</h2>

            <div class="byok-section">
              <div class="setting-row">
                <div class="setting-row__info">
                  <span class="setting-row__label">Status</span>
                  <span class="setting-row__hint">Bring your own key for higher quotas</span>
                </div>
                <div class="status-indicator">
                  <span :class="['status-dot', { 'status-dot--active': hasKey }]" />
                  <span>{{ hasKey ? `Active (${maskedKey})` : 'Using system default' }}</span>
                </div>
              </div>

              <div class="key-input-form">
                <input
                  v-model="newKey"
                  type="password"
                  class="key-text-input"
                  placeholder="sk-proj-..."
                />
                <button
                  class="pill-btn pill-btn--primary"
                  :disabled="saving || !newKey.trim()"
                  @click="handleSave"
                >
                  {{ saving ? 'Saving…' : 'Save & Verify' }}
                </button>
                <button
                  v-if="hasKey"
                  class="pill-btn pill-btn--danger"
                  :disabled="saving"
                  @click="handleRemove"
                >
                  Remove Key
                </button>
              </div>
            </div>
          </div>
        </div>
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
  width: 52px;
  height: 52px;
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
  background: var(--bg-surface);
  border-radius: var(--radius-panel);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  padding: 28px;
  box-sizing: border-box;
  gap: 28px;

  @media (max-width: 900px) {
    border-radius: 0;
    padding: 20px 16px;
  }
}

.settings-header {
  display: flex;
  flex-direction: column;
  gap: 8px;

  &__meta {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--ink-2);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  &__title {
    font-size: 72px;
    font-weight: 400;
    letter-spacing: -0.05em;
    line-height: 0.9;
    margin: 0;

    @media (max-width: 600px) {
      font-size: 44px;
    }
  }
}

.banner {
  padding: 12px 16px;
  border-radius: var(--radius-card);
  font-size: 14px;

  &--error {
    background: rgba(201, 61, 24, 0.1);
    color: var(--orange-ink);
  }

  &--success {
    background: rgba(34, 197, 94, 0.12);
    color: #16a34a;
  }
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;

  @media (max-width: 800px) {
    grid-template-columns: 1fr;
  }
}

.settings-card {
  background: var(--bg-sunken);
  border-radius: var(--radius-card);
  padding: 22px 24px;
  display: flex;
  flex-direction: column;
  gap: 18px;

  &--full {
    grid-column: 1 / -1;
  }

  &__title {
    font-size: 24px;
    font-weight: 500;
    letter-spacing: -0.03em;
    color: var(--ink);
    margin: 0;
  }
}

.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;

  &__info {
    display: flex;
    flex-direction: column;
    line-height: 1.3;
  }

  &__label {
    font-size: 16px;
    font-weight: 500;
    color: var(--ink);
  }

  &__hint {
    font-size: 13px;
    color: var(--ink-2);
  }
}

.segmented-control {
  display: flex;
  background: var(--bg-surface);
  border-radius: var(--radius-pill);
  padding: 4px;
  gap: 2px;

  &__btn {
    height: 34px;
    border-radius: var(--radius-pill);
    background: transparent;
    color: var(--ink);
    border: 0;
    display: flex;
    align-items: center;
    padding: 0 14px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition:
      background-color 0.15s ease,
      color 0.15s ease;

    &--active {
      background: var(--btn-primary);
      color: var(--btn-primary-ink);
    }
  }
}

.toggle-switch {
  width: 46px;
  height: 28px;
  border-radius: var(--radius-pill);
  background: var(--line);
  position: relative;
  border: 0;
  cursor: pointer;
  flex: none;
  transition: background-color 0.2s ease;

  &__thumb {
    position: absolute;
    left: 3px;
    top: 3px;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: #ffffff;
    transition:
      transform 0.2s ease,
      background-color 0.2s ease;
  }

  &--on {
    background: var(--btn-primary);

    .toggle-switch__thumb {
      transform: translateX(18px);
      background: var(--orange);
    }
  }
}

.pill-chip {
  height: 38px;
  border-radius: var(--radius-pill);
  background: var(--bg-surface);
  display: flex;
  align-items: center;
  padding: 0 16px;
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 500;
  color: var(--ink);
}

.pill-btn {
  height: 38px;
  border-radius: var(--radius-pill);
  background: var(--bg-surface);
  color: var(--ink);
  border: 0;
  display: inline-flex;
  align-items: center;
  padding: 0 18px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.15s ease;

  &:hover {
    opacity: 0.9;
  }

  &--primary {
    background: var(--btn-primary);
    color: var(--btn-primary-ink);
  }

  &--danger {
    color: var(--orange-ink);

    [data-theme='dark'] & {
      color: var(--orange-ink-dark);
    }
  }
}

.byok-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--ink-2);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--line);

  &--active {
    background: #16a34a;
  }
}

.key-input-form {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.key-text-input {
  flex: 1;
  min-width: 240px;
  height: 42px;
  border-radius: var(--radius-pill);
  border: 1px solid var(--line);
  background: var(--bg-surface);
  color: var(--ink);
  padding: 0 16px;
  font-size: 14px;
  outline: none;
}
</style>
