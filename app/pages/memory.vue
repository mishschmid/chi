<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useAuth } from '~/composables/useAuth'
import { useChat } from '~/composables/useChat'
import AppSidebar from '~/components/AppSidebar.vue'

interface FactItem {
  id: string
  fact: string
  category: 'identity' | 'goal' | 'preference' | 'person' | 'health' | 'other'
  updatedAt: string
}

const { user, signOut } = useAuth()
const { conversations, loadConversations } = useChat()

const facts = ref<FactItem[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const editingFactId = ref<string | null>(null)
const editingText = ref('')
const activeCategory = ref<string>('all')
const isSidebarOpen = ref(false)

async function loadFacts() {
  loading.value = true
  error.value = null
  try {
    facts.value = await $fetch<FactItem[]>('/api/memory/facts')
  } catch (e: any) {
    error.value = e?.statusMessage || 'Failed to load memory facts'
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await Promise.all([loadFacts(), loadConversations()])
})

const categories: Array<{ id: string; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'health', label: 'Health & Runs' },
  { id: 'goal', label: 'Goals' },
  { id: 'person', label: 'People' },
  { id: 'preference', label: 'Preferences' },
  { id: 'identity', label: 'Identity' },
  { id: 'other', label: 'Other' },
]

const filteredFacts = computed(() => {
  if (activeCategory.value === 'all') return facts.value
  return facts.value.filter((f) => f.category === activeCategory.value)
})

function getCardVariant(idx: number): 'plain' | 'orange' | 'dark' {
  if (idx % 6 === 0 && idx !== 0) return 'orange'
  if (idx % 4 === 3) return 'dark'
  return 'plain'
}

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
    })
  } catch {
    return 'Recent'
  }
}

function startEdit(f: FactItem) {
  editingFactId.value = f.id
  editingText.value = f.fact
}

function cancelEdit() {
  editingFactId.value = null
  editingText.value = ''
}

async function saveEdit(id: string) {
  if (!editingText.value.trim()) return
  try {
    const updated = await $fetch<FactItem>(`/api/memory/facts/${id}`, {
      method: 'PATCH',
      body: { fact: editingText.value.trim() },
    })
    const index = facts.value.findIndex((f) => f.id === id)
    if (index !== -1) {
      facts.value[index] = updated
    }
    cancelEdit()
  } catch (e: any) {
    error.value = e?.statusMessage || 'Failed to update fact'
  }
}

async function deleteFact(id: string) {
  try {
    await $fetch(`/api/memory/facts/${id}`, {
      method: 'DELETE',
    })
    facts.value = facts.value.filter((f) => f.id !== id)
    if (editingFactId.value === id) {
      cancelEdit()
    }
  } catch (e: any) {
    error.value = e?.statusMessage || 'Failed to delete fact'
  }
}
</script>

<template>
  <div class="cima-app-shell">
    <AppSidebar
      :conversations="conversations"
      :active-id="null"
      :open="isSidebarOpen"
      :user="user"
      active-section="memory"
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
        <div class="memory-header">
          <div class="memory-header__titles">
            <span class="memory-header__meta">{{ facts.length }} things Cima remembers</span>
            <h1 class="memory-header__title">Memory</h1>
          </div>
          <button class="circle-btn" title="Refresh memories" @click="loadFacts">
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
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
            </svg>
          </button>
        </div>

        <!-- Filter Pills -->
        <div class="filter-pills">
          <button
            v-for="cat in categories"
            :key="cat.id"
            :class="['filter-pill', { 'filter-pill--active': activeCategory === cat.id }]"
            @click="activeCategory = cat.id"
          >
            <span>{{ cat.label }}</span>
            <span v-if="cat.id === 'all'" class="filter-pill__count">{{ facts.length }}</span>
          </button>
        </div>

        <!-- Error state -->
        <div v-if="error" class="error-banner">
          {{ error }}
        </div>

        <!-- Loading state -->
        <div v-if="loading" class="state-message">
          <span>Loading memory cards…</span>
        </div>

        <!-- Empty state -->
        <div v-else-if="filteredFacts.length === 0" class="state-message">
          <span>No saved memories in this category yet.</span>
        </div>

        <!-- Cards Grid (D4) -->
        <div v-else class="memory-grid">
          <div
            v-for="(f, idx) in filteredFacts"
            :key="f.id"
            :class="[
              'memory-card',
              `memory-card--${getCardVariant(idx)}`,
              { 'memory-card--editing': editingFactId === f.id },
            ]"
            @click="editingFactId !== f.id && startEdit(f)"
          >
            <!-- Card Header -->
            <div class="memory-card__header">
              <div class="memory-card__info">
                <span class="memory-card__cat">{{ f.category }}</span>
                <span class="memory-card__date">{{ formatDate(f.updatedAt) }}</span>
              </div>
              <div class="memory-card__actions">
                <button
                  v-if="editingFactId === f.id"
                  class="card-action-btn card-action-btn--delete"
                  title="Delete memory"
                  @click.stop="deleteFact(f.id)"
                >
                  ✕
                </button>
                <div v-else class="card-arrow" title="Edit">
                  <svg
                    width="16"
                    height="16"
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

            <!-- Card Body / Edit Form -->
            <div v-if="editingFactId === f.id" class="memory-card__edit-wrap" @click.stop>
              <textarea v-model="editingText" class="memory-card__textarea" rows="3" autofocus />
              <div class="memory-card__edit-actions">
                <button class="pill-btn pill-btn--save" @click="saveEdit(f.id)">Save</button>
                <button class="pill-btn pill-btn--cancel" @click="cancelEdit">Cancel</button>
              </div>
            </div>
            <div v-else class="memory-card__body">
              {{ f.fact }}
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
  gap: 22px;

  @media (max-width: 900px) {
    border-radius: 0;
    padding: 20px 16px;
  }
}

.memory-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;

  &__titles {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

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

.filter-pills {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.filter-pill {
  height: 42px;
  border-radius: var(--radius-pill);
  background: var(--bg-sunken);
  color: var(--ink);
  border: 0;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0 18px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition:
    background-color 0.15s ease,
    color 0.15s ease;

  &:hover {
    opacity: 0.9;
  }

  &--active {
    background: var(--btn-primary);
    color: var(--btn-primary-ink);
    padding: 0 6px 0 18px;

    .filter-pill__count {
      background: var(--orange);
      color: var(--on-orange);
    }
  }

  &__count {
    min-width: 26px;
    height: 26px;
    border-radius: var(--radius-pill);
    background: var(--bg-surface);
    color: var(--ink);
    display: grid;
    place-items: center;
    font-size: 12px;
    font-weight: 600;
    padding: 0 6px;
  }
}

.error-banner {
  background: rgba(201, 61, 24, 0.1);
  color: var(--orange-ink);
  border-radius: var(--radius-card);
  padding: 14px 18px;
  font-size: 14px;
}

.state-message {
  padding: 60px 0;
  text-align: center;
  color: var(--ink-2);
  font-size: 16px;
}

.memory-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 12px;
}

.memory-card {
  border-radius: var(--radius-card);
  padding: 20px 20px 22px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 16px;
  min-height: 180px;
  cursor: pointer;
  transition: transform 0.15s ease;

  &:hover {
    transform: translateY(-2px);
  }

  &--plain {
    background: var(--bg-sunken);
    color: var(--ink);
  }

  &--orange {
    background: var(--orange);
    color: var(--on-orange);

    .memory-card__date {
      color: var(--on-orange-muted);
    }
  }

  &--dark {
    background: #111111;
    color: #f3f2ef;

    .memory-card__date {
      color: #a9a8a4;
    }

    .card-arrow {
      color: #f3f2ef;
    }
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 8px;
  }

  &__info {
    display: flex;
    flex-direction: column;
    line-height: 1.25;
  }

  &__cat {
    font-size: 12px;
    font-weight: 600;
    text-transform: capitalize;
  }

  &__date {
    font-size: 12px;
    color: var(--ink-2);
  }

  &__body {
    font-size: 26px;
    font-weight: 400;
    letter-spacing: -0.035em;
    line-height: 1.1;
    text-wrap: pretty;
  }

  &__edit-wrap {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  &__textarea {
    width: 100%;
    border-radius: 12px;
    border: 1px solid var(--line);
    padding: 10px;
    font-size: 15px;
    background: var(--bg-surface);
    color: var(--ink);
    outline: none;
    resize: vertical;
  }

  &__edit-actions {
    display: flex;
    gap: 6px;
  }
}

.card-action-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 0;
  display: grid;
  place-items: center;
  font-size: 12px;
  cursor: pointer;

  &--delete {
    background: rgba(201, 61, 24, 0.15);
    color: var(--orange-ink);
  }
}

.pill-btn {
  height: 32px;
  border-radius: var(--radius-pill);
  border: 0;
  padding: 0 14px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;

  &--save {
    background: var(--btn-primary);
    color: var(--btn-primary-ink);
  }

  &--cancel {
    background: var(--bg-sunken);
    color: var(--ink);
  }
}
</style>
