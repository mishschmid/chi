<script setup lang="ts">
import { computed } from 'vue'
import ThinkingIndicator from '~/components/ThinkingIndicator.vue'

const props = defineProps<{
  role: 'user' | 'assistant' | 'system'
  content: string
  model?: string | null
  totalTokens?: number | null
  costUsd?: string | number | null
  thinking?: boolean
}>()

const formattedCost = computed(() => {
  if (props.costUsd === null || props.costUsd === undefined) return null
  const num = Number(props.costUsd)
  if (isNaN(num)) return null
  if (num < 0.0001) return '<$0.0001'
  return `$${num.toFixed(4)}`
})
</script>

<template>
  <div :class="['message', `message--${role}`]">
    <div class="message__bubble">
      <div class="message__header">
        <span class="message__role">{{ role === 'user' ? 'You' : 'Chi' }}</span>
        <span
          v-if="role === 'assistant' && (totalTokens || formattedCost)"
          class="message__meta"
          :title="`Model: ${model || 'default'}`"
        >
          <span v-if="totalTokens">{{ totalTokens }} tokens</span>
          <span v-if="totalTokens && formattedCost" class="meta-dot">·</span>
          <span v-if="formattedCost" class="cost-tag">{{ formattedCost }}</span>
        </span>
      </div>

      <ThinkingIndicator v-if="thinking && !content" />
      <div v-else :class="['message__content', { 'message__content--streaming': thinking }]">
        {{ content }}
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.message {
  display: flex;
  margin-bottom: 1rem;
  width: 100%;

  &--user {
    justify-content: flex-end;

    .message__bubble {
      background-color: $accent-dim;
      color: $text-primary;
      border-top-right-radius: $radius-sm;
    }

    .message__role {
      color: $accent;
    }
  }

  &--assistant {
    justify-content: flex-start;

    .message__bubble {
      background-color: rgba($bg-surface, 0.75);
      backdrop-filter: blur(8px);
      color: $text-primary;
      border-top-left-radius: $radius-sm;
      border: 1px solid $border-subtle;
    }

    .message__role {
      color: $text-secondary;
    }
  }

  &__bubble {
    max-width: 85%;
    padding: 0.75rem 1rem;
    border-radius: $radius-lg;
    word-break: break-word;
    overflow-wrap: anywhere;
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.35rem;
  }

  &__role {
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  &__meta {
    font-size: 0.7rem;
    color: $text-muted;
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    font-family: monospace;
    background-color: rgba(255, 255, 255, 0.04);
    padding: 0.1rem 0.35rem;
    border-radius: $radius-sm;

    .cost-tag {
      color: $accent;
      font-weight: 500;
    }

    .meta-dot {
      opacity: 0.5;
    }
  }

  &__content {
    font-size: 0.95rem;
    line-height: 1.5;
    white-space: pre-wrap;

    &--streaming::after {
      content: '';
      display: inline-block;
      width: 0.5em;
      height: 0.5em;
      margin-left: 0.3em;
      border-radius: 50%;
      background-color: $accent;
      animation: caret 1s ease-in-out infinite;
    }
  }
}

@keyframes caret {
  0%,
  100% {
    opacity: 0.3;
  }
  50% {
    opacity: 1;
  }
}
</style>
