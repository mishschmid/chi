<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'

interface FactItem {
  id: string
  fact: string
  category: 'identity' | 'goal' | 'preference' | 'person' | 'health' | 'other'
  updatedAt: string
}

const facts = ref<FactItem[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const editingFactId = ref<string | null>(null)
const editingText = ref('')

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

onMounted(() => {
  loadFacts()
})

const categories: Array<FactItem['category']> = [
  'identity',
  'goal',
  'preference',
  'person',
  'health',
  'other',
]

const groupedFacts = computed(() => {
  const map: Record<string, FactItem[]> = {}
  for (const cat of categories) {
    map[cat] = facts.value.filter((f) => f.category === cat)
  }
  return map
})

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
  } catch (e: any) {
    error.value = e?.statusMessage || 'Failed to delete fact'
  }
}
</script>

<template>
  <div class="memory-page">
    <header class="memory-header">
      <NuxtLink to="/" class="btn-back">← Back to chat</NuxtLink>
      <h1>What Chi knows about you</h1>
      <p class="subtitle">
        Chi automatically learns lasting details from your conversations. You have full control to
        edit or delete any memory.
      </p>
    </header>

    <div v-if="error" class="error-banner">
      {{ error }}
    </div>

    <div v-if="loading" class="loading-state">Loading memories...</div>

    <div v-else class="categories-list">
      <section v-for="cat in categories" :key="cat" class="category-section">
        <h2 class="category-title">{{ cat }}</h2>

        <div v-if="groupedFacts[cat]?.length === 0" class="empty-category">
          No facts recorded yet.
        </div>

        <ul v-else class="facts-list">
          <li v-for="f in groupedFacts[cat]" :key="f.id" class="fact-card">
            <div v-if="editingFactId === f.id" class="fact-edit">
              <input
                v-model="editingText"
                class="fact-input"
                @keydown.enter="saveEdit(f.id)"
                @keydown.esc="cancelEdit"
              />
              <div class="fact-edit-actions">
                <button class="btn btn--primary" @click="saveEdit(f.id)">Save</button>
                <button class="btn btn--subtle" @click="cancelEdit">Cancel</button>
              </div>
            </div>

            <div v-else class="fact-view">
              <span class="fact-text">{{ f.fact }}</span>
              <div class="fact-actions">
                <button class="btn-action" title="Edit" @click="startEdit(f)">✎</button>
                <button
                  class="btn-action btn-action--delete"
                  title="Delete"
                  @click="deleteFact(f.id)"
                >
                  ✕
                </button>
              </div>
            </div>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>

<style scoped lang="scss">
.memory-page {
  max-width: 760px;
  margin: 0 auto;
  padding: 2rem 1rem 4rem;
  min-height: 100vh;
  background-color: $bg-app;
}

.memory-header {
  margin-bottom: 2rem;

  h1 {
    font-size: 1.5rem;
    font-weight: 700;
    margin-top: 1rem;
    margin-bottom: 0.5rem;
    color: $text-primary;
  }

  .subtitle {
    color: $text-secondary;
    font-size: 0.95rem;
    line-height: 1.5;
  }
}

.btn-back {
  color: $accent;
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;

  &:hover {
    text-decoration: underline;
  }
}

.error-banner {
  background-color: rgba(239, 68, 68, 0.15);
  color: #fca5a5;
  border: 1px solid rgba(239, 68, 68, 0.3);
  padding: 0.5rem 1rem;
  font-size: 0.85rem;
  margin-bottom: 1.5rem;
  border-radius: $radius-sm;
}

.loading-state {
  text-align: center;
  color: $text-muted;
  padding: 3rem 0;
}

.category-section {
  margin-bottom: 2rem;
}

.category-title {
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: $accent;
  font-weight: 600;
  margin-bottom: 0.75rem;
  border-bottom: 1px solid $border-subtle;
  padding-bottom: 0.25rem;
}

.empty-category {
  color: $text-muted;
  font-size: 0.85rem;
  font-style: italic;
  padding: 0.25rem 0;
}

.facts-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.fact-card {
  background-color: $bg-surface;
  border: 1px solid $border-subtle;
  border-radius: $radius-md;
  padding: 0.75rem 1rem;

  &:hover {
    border-color: $border-strong;
  }
}

.fact-view {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.fact-text {
  font-size: 0.95rem;
  color: $text-primary;
  line-height: 1.4;
}

.fact-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-action {
  background: none;
  border: none;
  color: $text-muted;
  cursor: pointer;
  font-size: 0.9rem;
  padding: 0.2rem 0.4rem;
  border-radius: $radius-sm;

  &:hover {
    color: $text-primary;
    background-color: $bg-surface-elevated;
  }

  &--delete:hover {
    color: #f87171;
  }
}

.fact-edit {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.fact-input {
  flex: 1;
  min-width: 200px;
  background-color: $bg-input;
  border: 1px solid $accent;
  border-radius: $radius-sm;
  color: $text-primary;
  padding: 0.4rem 0.6rem;
  font-family: inherit;
  font-size: 0.95rem;
  outline: none;
}

.fact-edit-actions {
  display: flex;
  gap: 0.5rem;
}

.btn {
  background: none;
  border: none;
  cursor: pointer;
  font-family: inherit;
  font-size: 0.85rem;
  border-radius: $radius-sm;
  padding: 0.35rem 0.65rem;

  &--primary {
    background-color: $accent;
    color: #000;
    font-weight: 600;
  }

  &--subtle {
    color: $text-secondary;

    &:hover {
      color: $text-primary;
    }
  }
}
</style>
