<script setup lang="ts">
import { ref } from 'vue'
import { useAuth } from '~/composables/useAuth'

definePageMeta({
  layout: false,
})

const { signIn, loading, error } = useAuth()

const email = ref('')
const password = ref('')

async function handleSubmit() {
  if (!email.value || !password.value || loading.value) return
  try {
    await signIn(email.value, password.value)
    await navigateTo('/')
  } catch {
    // Error is set in useAuth
  }
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-card">
      <div class="auth-card__header">
        <h1 class="logo">Chi</h1>
        <p class="tagline">Log in to your companion</p>
      </div>

      <div v-if="error" class="error-banner">
        {{ error }}
      </div>

      <form class="auth-form" @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="email">Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            required
            placeholder="you@domain.com"
            autocomplete="email"
          />
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            required
            placeholder="••••••••"
            autocomplete="current-password"
          />
        </div>

        <button type="submit" class="btn btn--submit" :disabled="loading">
          {{ loading ? 'Signing in...' : 'Sign in' }}
        </button>
      </form>

      <div class="auth-footer">
        Don't have an account?
        <NuxtLink to="/register" class="link">Create account</NuxtLink>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: $bg-app;
  padding: 1.5rem;
}

.auth-card {
  width: 100%;
  max-width: 400px;
  background-color: $bg-surface;
  border: 1px solid $border-subtle;
  border-radius: $radius-lg;
  padding: 2.5rem 2rem;

  &__header {
    text-align: center;
    margin-bottom: 2rem;

    .logo {
      font-size: 2.25rem;
      font-weight: 700;
      color: $accent;
      margin-bottom: 0.25rem;
    }

    .tagline {
      color: $text-secondary;
      font-size: 0.95rem;
    }
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

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;

  label {
    font-size: 0.85rem;
    color: $text-secondary;
    font-weight: 500;
  }

  input {
    background-color: $bg-input;
    border: 1px solid $border-subtle;
    border-radius: $radius-sm;
    color: $text-primary;
    padding: 0.65rem 0.85rem;
    font-size: 0.95rem;
    outline: none;

    &:focus {
      border-color: $accent;
    }
  }
}

.btn--submit {
  margin-top: 0.5rem;
  background-color: $accent;
  color: #000;
  border: none;
  border-radius: $radius-sm;
  padding: 0.75rem;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;

  &:hover:not(:disabled) {
    background-color: $accent-hover;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.auth-footer {
  margin-top: 1.5rem;
  text-align: center;
  font-size: 0.85rem;
  color: $text-secondary;

  .link {
    color: $accent;
    text-decoration: none;
    margin-left: 0.25rem;

    &:hover {
      text-decoration: underline;
    }
  }
}
</style>
