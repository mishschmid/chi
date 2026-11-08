<script setup lang="ts">
defineProps<{
  role: 'user' | 'assistant' | 'system'
  content: string
  model?: string | null
}>()
</script>

<template>
  <div :class="['message', `message--${role}`]">
    <div class="message__bubble">
      <div class="message__role">{{ role === 'user' ? 'You' : 'Chi' }}</div>
      <div class="message__content">{{ content }}</div>
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
      background-color: $bg-surface;
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
  }

  &__role {
    font-size: 0.75rem;
    font-weight: 600;
    margin-bottom: 0.25rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  &__content {
    font-size: 0.95rem;
    line-height: 1.5;
    white-space: pre-wrap;
  }
}
</style>
