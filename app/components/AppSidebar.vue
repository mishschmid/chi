<script setup lang="ts">
import { computed } from 'vue'

interface SidebarConversation {
  id: string
  title: string | null
  updatedAt: string
}

const props = withDefaults(
  defineProps<{
    conversations: SidebarConversation[]
    activeId: string | null
    disabled?: boolean
    open?: boolean
    activeSection?: 'chats' | 'memory' | 'settings'
    user?: { name?: string | null; email?: string | null } | null
  }>(),
  {
    disabled: false,
    open: false,
    activeSection: 'chats',
    user: null,
  }
)

const emit = defineEmits<{
  select: [id: string]
  create: []
  signOut: []
  close: []
}>()

const todayFormatted = computed(() => {
  return new Date()
    .toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
    .toLowerCase()
})

const initials = computed(() => {
  const source = props.user?.name || props.user?.email || 'Chi'
  return source
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('')
})

const groups = computed(() => {
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)
  const start = startOfToday.getTime()
  const day = 86_400_000

  const buckets: { label: string; items: SidebarConversation[] }[] = [
    { label: 'Today', items: [] },
    { label: 'Yesterday', items: [] },
    { label: 'This week', items: [] },
    { label: 'Earlier', items: [] },
  ]

  for (const c of props.conversations) {
    const t = new Date(c.updatedAt).getTime()
    const index = t >= start ? 0 : t >= start - day ? 1 : t >= start - 6 * day ? 2 : 3
    buckets[index]!.items.push(c)
  }

  return buckets.filter((b) => b.items.length > 0)
})

const totalConversations = computed(() => props.conversations.length)
</script>

<template>
  <aside :class="['sidebar', { 'sidebar--open': open }]">
    <div class="sidebar__inner">
      <!-- Header with brand mark & date -->
      <div class="brand">
        <NuxtLink to="/" class="brand__logo"> chi<span class="brand__dot">.</span> </NuxtLink>
        <span class="brand__date">{{ todayFormatted }}</span>
      </div>

      <!-- New conversation button -->
      <button class="btn-new-chat" :disabled="disabled" @click="emit('create')">
        <span>New conversation</span>
        <span class="btn-new-chat__plus">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#111"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </span>
      </button>

      <!-- Nav segmented pills -->
      <div class="nav-pills">
        <NuxtLink to="/" :class="['nav-pill', { 'nav-pill--active': activeSection === 'chats' }]">
          <span>Chats</span>
          <span class="nav-pill__badge">{{ totalConversations }}</span>
        </NuxtLink>

        <NuxtLink
          to="/memory"
          :class="['nav-pill', { 'nav-pill--active': activeSection === 'memory' }]"
        >
          <span>Memory</span>
        </NuxtLink>

        <NuxtLink
          to="/settings"
          :class="['nav-pill', { 'nav-pill--active': activeSection === 'settings' }]"
        >
          <span>Settings</span>
        </NuxtLink>
      </div>

      <!-- Threads list -->
      <div class="threads">
        <template v-if="groups.length > 0">
          <div v-for="group in groups" :key="group.label" class="threads__group">
            <div class="threads__header">
              <span>{{ group.label }}</span>
              <span>{{ String(group.items.length).padStart(2, '0') }}</span>
            </div>
            <div class="threads__list">
              <button
                v-for="c in group.items"
                :key="c.id"
                :class="['thread-item', { 'thread-item--active': c.id === activeId }]"
                @click="emit('select', c.id)"
              >
                <span v-if="c.id === activeId" class="thread-item__dot" />
                <span class="thread-item__title">{{ c.title || 'Untitled chat' }}</span>
              </button>
            </div>
          </div>
        </template>
        <div v-else class="threads__empty">
          <span>No conversations yet.</span>
        </div>
      </div>

      <!-- Footer User Card -->
      <div class="account-card">
        <div class="account-card__avatar">{{ initials }}</div>
        <div class="account-card__meta">
          <span class="account-card__name">{{ user?.name || 'Chi User' }}</span>
          <span class="account-card__email">{{ user?.email || 'mish.schmid@gmail.com' }}</span>
        </div>
        <button class="account-card__signout" @click="emit('signOut')">Sign out</button>
      </div>
    </div>
  </aside>
</template>

<style scoped lang="scss">
.sidebar {
  width: 320px;
  flex: none;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;

  @media (max-width: 900px) {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    width: 320px;
    z-index: 100;
    background: var(--bg-page);
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.25);
    transform: translateX(-100%);
    transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);

    &--open {
      transform: translateX(0);
    }
  }
}

.sidebar__inner {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 16px 8px 8px;
  box-sizing: border-box;
}

.brand {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  padding: 0 6px;

  &__logo {
    font-size: 46px;
    font-weight: 500;
    letter-spacing: -0.065em;
    line-height: 0.8;
    color: var(--ink);
    text-decoration: none;
  }

  &__dot {
    color: var(--orange);
  }

  &__date {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--ink-2);
  }
}

.btn-new-chat {
  height: 54px;
  border-radius: var(--radius-pill);
  background: var(--btn-primary);
  color: var(--btn-primary-ink);
  border: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 8px 0 22px;
  font-family: var(--font-sans);
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition:
    opacity 0.15s ease,
    background-color 0.15s ease;

  &:hover {
    opacity: 0.92;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &__plus {
    width: 38px;
    height: 38px;
    border-radius: 50%;
    background: var(--orange);
    display: grid;
    place-items: center;
  }
}

.nav-pills {
  display: flex;
  gap: 6px;
}

.nav-pill {
  height: 40px;
  border-radius: var(--radius-pill);
  background: var(--bg-surface);
  color: var(--ink);
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0 16px;
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
  transition:
    background-color 0.15s ease,
    color 0.15s ease;

  &:hover {
    background: var(--bg-sunken);
  }

  &--active {
    background: var(--btn-primary);
    color: var(--btn-primary-ink);
    padding: 0 6px 0 16px;

    &:hover {
      background: var(--btn-primary);
    }

    .nav-pill__badge {
      background: var(--orange);
      color: var(--on-orange);
    }
  }

  &__badge {
    min-width: 24px;
    height: 24px;
    border-radius: var(--radius-pill);
    background: var(--bg-sunken);
    color: var(--ink);
    display: grid;
    place-items: center;
    font-size: 12px;
    font-weight: 600;
    padding: 0 6px;
  }
}

.threads {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding-right: 4px;

  &__group {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__header {
    display: flex;
    justify-content: space-between;
    padding: 6px 14px 8px;
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--ink-2);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__empty {
    padding: 16px 14px;
    font-size: 13px;
    color: var(--ink-3);
  }
}

.thread-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 13px 14px;
  border-radius: 18px;
  border: 0;
  background: transparent;
  font-size: 15px;
  color: var(--ink-2);
  cursor: pointer;
  text-align: left;
  transition:
    background-color 0.15s ease,
    color 0.15s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.4);
    color: var(--ink);
  }

  &--active {
    background: var(--bg-surface) !important;
    color: var(--ink);
    font-weight: 500;
  }

  &__dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--orange);
    flex: none;
  }

  &__title {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.account-card {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--bg-surface);
  border-radius: var(--radius-card);
  padding: 10px;
  box-sizing: border-box;

  &__avatar {
    width: 42px;
    height: 42px;
    border-radius: 50%;
    background: var(--bg-sunken);
    color: var(--ink);
    display: grid;
    place-items: center;
    font-size: 14px;
    font-weight: 600;
    letter-spacing: -0.02em;
    flex: none;
  }

  &__meta {
    display: flex;
    flex-direction: column;
    line-height: 1.2;
    min-width: 0;
    flex: 1;
  }

  &__name {
    font-size: 14px;
    font-weight: 600;
    color: var(--ink);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__email {
    font-size: 12px;
    color: var(--ink-2);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__signout {
    height: 34px;
    border-radius: var(--radius-pill);
    background: var(--bg-sunken);
    border: 0;
    color: var(--ink);
    display: flex;
    align-items: center;
    padding: 0 14px;
    font-size: 12px;
    font-weight: 500;
    flex: none;
    cursor: pointer;
    transition: background-color 0.15s ease;

    &:hover {
      opacity: 0.85;
    }
  }
}
</style>
