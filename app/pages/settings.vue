<script setup lang="ts">
import { ref, onMounted } from 'vue'

const hasKey = ref(false)
const maskedKey = ref<string | null>(null)
const newKey = ref('')
const loading = ref(true)
const saving = ref(false)
const error = ref<string | null>(null)
const successMsg = ref<string | null>(null)

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

onMounted(() => {
  loadStatus()
})
</script>

<template>
  <div class="settings-page">
    <header class="settings-nav">
      <div class="settings-nav__inner">
        <NuxtLink to="/" class="btn-back" aria-label="Back to chat">
          <span class="btn-back__icon" aria-hidden="true">←</span>
          <span>Back to chat</span>
        </NuxtLink>
        <NuxtLink to="/" class="btn-close" aria-label="Close" title="Close">
          <span aria-hidden="true">✕</span>
        </NuxtLink>
      </div>
    </header>

    <main class="settings-content">
      <header class="settings-header">
        <h1>Settings</h1>
        <p class="subtitle">Manage your personal AI keys and integrations.</p>
      </header>

    <div v-if="error" class="error-banner">
      {{ error }}
    </div>

    <div v-if="successMsg" class="success-banner">
      {{ successMsg }}
    </div>

    <div v-if="loading" class="loading-state">Loading settings...</div>

    <div v-else class="settings-card">
      <div class="card-header">
        <div class="provider-title">
          <span class="provider-icon">⚡</span>
          <div>
            <h2>OpenAI API Key</h2>
            <p class="provider-desc">
              Your key is securely encrypted at rest (AES-256-GCM) and used for chat, voice
              transcription, and synthesis.
            </p>
          </div>
        </div>
        <span :class="['badge', hasKey ? 'badge--active' : 'badge--inactive']">
          {{ hasKey ? 'Connected' : 'Not configured' }}
        </span>
      </div>

      <div v-if="hasKey" class="existing-key-row">
        <span class="key-preview"
          >Active Key: <code>{{ maskedKey }}</code></span
        >
        <button class="btn btn--danger" :disabled="saving" @click="handleRemove">Disconnect</button>
      </div>

      <form class="key-form" @submit.prevent="handleSave">
        <label for="apiKey">{{ hasKey ? 'Replace API key' : 'Enter OpenAI API key' }}</label>
        <div class="input-row">
          <input
            id="apiKey"
            v-model="newKey"
            type="password"
            placeholder="sk-proj-..."
            required
            autocomplete="off"
            class="key-input"
          />
          <button type="submit" class="btn btn--primary" :disabled="saving || !newKey.trim()">
            {{ saving ? 'Verifying...' : 'Save Key' }}
          </button>
        </div>
        <span class="hint">
          Keys must start with <code>sk-</code> and have model and audio permissions.
        </span>
      </form>
    </div>
    </main>
  </div>
</template>

<style scoped lang="scss">
.settings-page {
  min-height: 100vh;
  background-color: $bg-app;
}

.settings-nav {
  position: sticky;
  top: 0;
  z-index: 20;
  background-color: rgba($bg-app, 0.85);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid $border-subtle;

  &__inner {
    max-width: 680px;
    margin: 0 auto;
    padding: 0.75rem 1rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
}

.settings-content {
  max-width: 680px;
  margin: 0 auto;
  padding: 1.5rem 1rem 4rem;
}

.settings-header {
  margin-bottom: 2rem;

  h1 {
    font-size: 1.5rem;
    font-weight: 700;
    margin-bottom: 0.25rem;
    color: $text-primary;
  }

  .subtitle {
    color: $text-secondary;
    font-size: 0.95rem;
  }
}

.btn-back {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  color: $accent;
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
  padding: 0.35rem 0.5rem;
  margin-left: -0.5rem;
  border-radius: $radius-sm;
  transition: all 0.2s ease;

  &:hover {
    background-color: rgba($accent, 0.1);
  }

  &__icon {
    font-size: 1.1rem;
    line-height: 1;
  }
}

.btn-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: $radius-full;
  background-color: $bg-surface;
  border: 1px solid $border-subtle;
  color: $text-secondary;
  text-decoration: none;
  font-size: 0.9rem;
  transition: all 0.2s ease;

  &:hover {
    color: $text-primary;
    border-color: $border-strong;
    background-color: $bg-surface-elevated;
  }
}

.error-banner {
  background-color: rgba(239, 68, 68, 0.15);
  color: #fca5a5;
  border: 1px solid rgba(239, 68, 68, 0.3);
  padding: 0.6rem 0.8rem;
  font-size: 0.85rem;
  border-radius: $radius-sm;
  margin-bottom: 1.5rem;
}

.success-banner {
  background-color: rgba($accent, 0.15);
  color: $accent;
  border: 1px solid rgba($accent, 0.3);
  padding: 0.6rem 0.8rem;
  font-size: 0.85rem;
  border-radius: $radius-sm;
  margin-bottom: 1.5rem;
}

.loading-state {
  color: $text-muted;
  text-align: center;
  padding: 3rem 0;
}

.settings-card {
  background-color: $bg-surface;
  border: 1px solid $border-subtle;
  border-radius: $radius-md;
  padding: 1.5rem;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1.5rem;

  .provider-title {
    display: flex;
    gap: 0.75rem;

    .provider-icon {
      font-size: 1.5rem;
    }

    h2 {
      font-size: 1.1rem;
      font-weight: 600;
      color: $text-primary;
      margin-bottom: 0.25rem;
    }

    .provider-desc {
      font-size: 0.85rem;
      color: $text-secondary;
      line-height: 1.4;
    }
  }
}

.badge {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.25rem 0.6rem;
  border-radius: $radius-full;
  text-transform: uppercase;
  letter-spacing: 0.05em;

  &--active {
    background-color: rgba($accent, 0.15);
    color: $accent;
    border: 1px solid rgba($accent, 0.3);
  }

  &--inactive {
    background-color: rgba(239, 68, 68, 0.15);
    color: #fca5a5;
    border: 1px solid rgba(239, 68, 68, 0.3);
  }
}

.existing-key-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: $bg-surface-elevated;
  padding: 0.75rem 1rem;
  border-radius: $radius-sm;
  margin-bottom: 1.25rem;
  border: 1px solid $border-subtle;

  .key-preview {
    font-size: 0.9rem;
    color: $text-secondary;

    code {
      color: $text-primary;
      font-family: monospace;
      font-size: 0.95rem;
    }
  }
}

.key-form {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  label {
    font-size: 0.85rem;
    font-weight: 500;
    color: $text-secondary;
  }

  .input-row {
    display: flex;
    gap: 0.5rem;
  }

  .key-input {
    flex: 1;
    background-color: $bg-input;
    border: 1px solid $border-subtle;
    border-radius: $radius-sm;
    color: $text-primary;
    padding: 0.6rem 0.85rem;
    font-size: 0.95rem;
    font-family: monospace;
    outline: none;

    &:focus {
      border-color: $accent;
    }
  }

  .hint {
    font-size: 0.8rem;
    color: $text-muted;

    code {
      color: $accent;
    }
  }
}

.btn {
  background: none;
  border: none;
  cursor: pointer;
  border-radius: $radius-sm;
  font-family: inherit;
  font-size: 0.85rem;
  font-weight: 600;
  padding: 0.5rem 1rem;

  &--primary {
    background-color: $accent;
    color: #000;

    &:hover:not(:disabled) {
      background-color: $accent-hover;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  &--danger {
    color: #f87171;
    border: 1px solid rgba(239, 68, 68, 0.3);

    &:hover:not(:disabled) {
      background-color: rgba(239, 68, 68, 0.15);
    }
  }
}
</style>
