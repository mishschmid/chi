<script setup lang="ts">
import { computed } from 'vue'

interface SidebarConversation {
  id: string
  title: string | null
  updatedAt: string
}

const props = defineProps<{
  conversations: SidebarConversation[]
  activeId: string | null
  disabled?: boolean
  open?: boolean
  user?: { name?: string | null; email?: string | null } | null
}>()

const emit = defineEmits<{
  select: [id: string]
  create: []
  signOut: []
}>()

const today = new Date()
  .toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
  .toLowerCase()

const initials = computed(() => {
  const source = props.user?.name || props.user?.email || '?'
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
    { label: 'today', items: [] },
    { label: 'yesterday', items: [] },
    { label: 'this week', items: [] },
    { label: 'earlier', items: [] },
  ]
  for (const c of props.conversations) {
    const t = new Date(c.updatedAt).getTime()
    const index = t >= start ? 0 : t >= start - day ? 1 : t >= start - 6 * day ? 2 : 3
    buckets[index]!.items.push(c)
  }
  return buckets.filter((b) => b.items.length > 0)
})
</script>

<template>
  <aside :class="['sidebar', { 'sidebar--open': open }]">
    <header class="brand">
      <h1 class="brand__mark" aria-label="chi">ch<span class="brand__i">ı</span></h1>
      <span class="brand__date">{{ today }}</span>
    </header>

    <button class="new-chat" :disabled="disabled" @click="emit('create')">
      <span>New conversation</span>
      <span class="new-chat__plus" aria-hidden="true">+</span>
    </button>

    <nav class="nav">
      <NuxtLink to="/memory" class="nav__link"> <span class="nav__index">01</span>Memory </NuxtLink>
      <NuxtLink to="/settings" class="nav__link">
        <span class="nav__index">02</span>Settings
      </NuxtLink>
    </nav>

    <div class="threads">
      <section v-for="(group, g) in groups" :key="group.label" class="threads__group">
        <h3 class="threads__label">
          <span>{{ group.label }}</span>
          <span class="threads__count">{{ group.items.length }}</span>
        </h3>
        <button
          v-for="(c, i) in group.items"
          :key="c.id"
          :class="['thread', { 'thread--active': c.id === activeId }]"
          :style="{ animationDelay: `${(g * 3 + i) * 30}ms` }"
          @click="emit('select', c.id)"
        >
          {{ c.title || 'Untitled chat' }}
        </button>
      </section>

      <p v-if="conversations.length === 0" class="threads__empty">
        Nothing written yet.<br />Say something.
      </p>
    </div>

    <footer class="account">
      <span class="account__avatar">{{ initials }}</span>
      <div class="account__info">
        <span class="account__name">{{ user?.name || 'Account' }}</span>
        <span class="account__email">{{ user?.email }}</span>
      </div>
      <button class="account__signout" @click="emit('signOut')">sign out</button>
    </footer>
  </aside>
</template>

<style scoped lang="scss">
.sidebar {
  position: relative;
  width: 264px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  padding: 1.5rem 1.25rem 1rem;
  z-index: 20;
  background-color: #0f0d0b;
  border-right: 1px solid $border-subtle;

  // Paper grain
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    opacity: 0.06;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  }

  > * {
    position: relative;
  }

  @media (max-width: 768px) {
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    transform: translateX(-100%);
    transition: transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1);

    &--open {
      transform: translateX(0);
    }
  }
}

.brand {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding-bottom: 1.5rem;

  &__mark {
    font-family: $font-display;
    font-weight: 400;
    font-size: 2.6rem;
    line-height: 1;
    letter-spacing: -0.04em;
    color: $text-primary;
  }

  // Dotless i with the ember as its tittle: the one spark of colour in the mark
  &__i {
    position: relative;

    &::after {
      content: '';
      position: absolute;
      left: 50%;
      top: 0.02em;
      width: 0.2em;
      height: 0.2em;
      border-radius: 50%;
      background-color: $accent;
      transform: translateX(-50%);
      animation: ember 5s ease-in-out infinite;
    }
  }

  &__date {
    font-family: $font-mono;
    font-size: 0.68rem;
    color: $text-muted;
  }
}

.new-chat {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0.7rem 0.9rem;
  border: none;
  border-radius: 4px;
  background-color: $text-primary;
  color: #12100e;
  font-family: inherit;
  font-size: 0.86rem;
  font-weight: 600;
  cursor: pointer;
  transition:
    background-color 0.2s ease,
    transform 0.2s ease;

  &__plus {
    font-family: $font-mono;
    font-size: 1.1rem;
    font-weight: 400;
    line-height: 1;
    transition: transform 0.3s cubic-bezier(0.3, 1.5, 0.5, 1);
  }

  &:hover:not(:disabled) {
    background-color: $accent;

    .new-chat__plus {
      transform: rotate(90deg);
    }
  }

  &:active:not(:disabled) {
    transform: translateY(1px);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
}

.nav {
  display: flex;
  flex-direction: column;
  margin: 1.25rem 0 0.5rem;
  border-top: 1px solid $border-subtle;

  &__link {
    display: flex;
    align-items: baseline;
    gap: 0.75rem;
    padding: 0.6rem 0;
    border-bottom: 1px solid $border-subtle;
    font-size: 0.86rem;
    color: $text-secondary;
    text-decoration: none;
    transition:
      color 0.2s,
      padding-left 0.25s ease;

    &:hover,
    &.router-link-active {
      color: $text-primary;
      padding-left: 0.35rem;

      .nav__index {
        color: $accent;
      }
    }
  }

  &__index {
    font-family: $font-mono;
    font-size: 0.66rem;
    color: $text-muted;
    transition: color 0.2s;
  }
}

.threads {
  flex: 1;
  overflow-y: auto;
  margin: 0 -0.5rem;
  padding: 0 0.5rem;
  scrollbar-width: thin;
  scrollbar-color: $border-strong transparent;

  &__group {
    margin-top: 1.1rem;
  }

  &__label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.35rem;
    font-family: $font-mono;
    font-size: 0.66rem;
    font-weight: 400;
    color: $text-muted;

    &::after {
      content: '';
      flex: 1;
      height: 1px;
      background-color: $border-subtle;
      order: 1;
    }
  }

  &__count {
    order: 2;
  }

  &__empty {
    margin-top: 2rem;
    font-family: $font-display;
    font-size: 1rem;
    line-height: 1.4;
    color: $text-muted;
  }
}

.thread {
  position: relative;
  display: block;
  width: 100%;
  padding: 0.42rem 0 0.42rem 0.9rem;
  border: none;
  background: none;
  text-align: left;
  font-family: inherit;
  font-size: 0.86rem;
  color: $text-secondary;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
  opacity: 0;
  animation: rise 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
  transition: color 0.15s;

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    width: 5px;
    height: 5px;
    border-radius: 1px;
    background-color: $text-muted;
    transform: translateY(-50%) scale(0);
    transition:
      transform 0.2s ease,
      background-color 0.2s;
  }

  &:hover {
    color: $text-primary;

    &::before {
      transform: translateY(-50%) scale(1);
    }
  }

  &--active {
    color: $text-primary;

    &::before {
      background-color: $accent;
      transform: translateY(-50%) scale(1);
    }
  }
}

.account {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  padding-top: 0.9rem;
  margin-top: 0.5rem;
  border-top: 1px solid $border-subtle;

  &__avatar {
    display: grid;
    place-items: center;
    width: 32px;
    height: 32px;
    flex-shrink: 0;
    border: 1px solid $border-strong;
    border-radius: 4px;
    font-family: $font-display;
    font-size: 0.85rem;
    color: $text-primary;
  }

  &__info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
  }

  &__name,
  &__email {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__name {
    font-size: 0.82rem;
    font-weight: 600;
  }

  &__email {
    font-family: $font-mono;
    font-size: 0.64rem;
    color: $text-muted;
  }

  &__signout {
    border: none;
    background: none;
    padding: 0.25rem 0;
    font-family: $font-mono;
    font-size: 0.66rem;
    color: $text-muted;
    cursor: pointer;
    text-decoration: underline;
    text-decoration-color: transparent;
    text-underline-offset: 3px;
    transition:
      color 0.2s,
      text-decoration-color 0.2s;

    &:hover {
      color: $accent;
      text-decoration-color: currentColor;
    }
  }
}

@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

// Like a coal catching air now and then
@keyframes ember {
  0%,
  100% {
    opacity: 1;
  }
  45% {
    opacity: 0.55;
  }
  55% {
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .brand__i::after,
  .thread {
    animation: none;
    opacity: 1;
  }
}
</style>
