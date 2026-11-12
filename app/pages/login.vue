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
        <h1 class="logo">chi<span class="logo__dot">.</span></h1>
        <p class="tagline">Sign in to your companion</p>
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
  background-color: var(--bg-page);
  padding: 1.5rem;
}

.auth-card {
  width: 100%;
  max-width: 420px;
  background-color: var(--bg-surface);
  border: 1px solid var(--line);
  border-radius: var(--radius-panel);
  padding: 2.5rem 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);

  &__header {
    text-align: center;
    margin-bottom: 2rem;

    .logo {
      font-size: 3rem;
      font-weight: 500;
      letter-spacing: -0.065em;
      line-height: 0.9;
      color: var(--ink);
      margin-bottom: 0.5rem;

      &__dot {
        color: var(--orange);
      }
    }

    .tagline {
      color: var(--ink-2);
      font-size: 0.95rem;
    }
  }
}

.error-banner {
  background-color: rgba(201, 61, 24, 0.1);
  color: var(--orange-ink);
  padding: 0.75rem 1rem;
  font-size: 0.85rem;
  border-radius: var(--radius-card);
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
  gap: 0.4rem;

  label {
    font-size: 0.85rem;
    color: var(--ink);
    font-weight: 500;
  }

  input {
    background-color: var(--bg-sunken);
    border: 1px solid var(--line);
    border-radius: var(--radius-pill);
    padding: 0.75rem 1.1rem;
    color: var(--ink);
    font-size: 0.95rem;
    outline: none;
    transition: border-color 0.15s ease;

    &:focus {
      border-color: var(--ink);
    }

    &::placeholder {
      color: var(--ink-3);
    }
  }
}

.btn--submit {
  margin-top: 0.5rem;
  background-color: var(--btn-primary);
  color: var(--btn-primary-ink);
  border: none;
  border-radius: var(--radius-pill);
  padding: 0.85rem 1.5rem;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.15s ease;

  &:hover {
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.auth-footer {
  margin-top: 1.75rem;
  text-align: center;
  font-size: 0.85rem;
  color: var(--ink-2);

  .link {
    color: var(--orange-ink);
    text-decoration: none;
    font-weight: 500;

    [data-theme='dark'] & {
      color: var(--orange-ink-dark);
    }

    &:hover {
      text-decoration: underline;
    }
  }
}
</style>
