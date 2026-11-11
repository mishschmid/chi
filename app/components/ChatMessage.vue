<script setup lang="ts">
import { computed } from 'vue'
import ThinkingIndicator from '~/components/ThinkingIndicator.vue'
import SoundWave from '~/components/SoundWave.vue'

const props = defineProps<{
  role: 'user' | 'assistant' | 'system'
  content: string
  model?: string | null
  totalTokens?: number | null
  costUsd?: string | number | null
  thinking?: boolean
  speaking?: boolean
}>()

defineEmits<{
  'stop-speaking': []
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
  <div :class="['message', `message--${role}`, { 'message--speaking': speaking }]">
    <div class="message__bubble">
      <!-- Semi-transparent wave background when Chi is speaking -->
      <div v-if="speaking" class="message__wave-bg" aria-hidden="true">
        <div class="wave-ambient" />
        <svg class="wave-svg" viewBox="0 0 1000 120" preserveAspectRatio="none">
          <path
            class="wave-layer wave-layer--back"
            d="M0,60 C250,110 500,10 750,60 C870,85 940,40 1000,60 L1000,120 L0,120 Z"
          />
          <path
            class="wave-layer wave-layer--front"
            d="M0,70 C180,20 420,100 680,60 C820,40 920,80 1000,70 L1000,120 L0,120 Z"
          />
        </svg>
      </div>

      <div class="message__header">
        <div class="message__role-wrap">
          <span class="message__role">{{ role === 'user' ? 'You' : 'Chi' }}</span>
          <button
            v-if="speaking"
            class="message__speaking-badge"
            title="Click to stop Chi speaking"
            @click.stop="$emit('stop-speaking')"
          >
            <SoundWave size="sm" />
            <span>Speaking</span>
            <span class="stop-hint">· stop</span>
          </button>
        </div>

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

  &--speaking {
    .message__bubble {
      border-color: rgba($accent, 0.45) !important;
      box-shadow:
        0 4px 24px rgba($accent, 0.15),
        inset 0 0 24px rgba($accent, 0.05);
      transition: all 0.3s ease;
    }
  }

  &__bubble {
    position: relative;
    overflow: hidden;
    max-width: 85%;
    padding: 0.75rem 1rem;
    border-radius: $radius-lg;
    word-break: break-word;
    overflow-wrap: anywhere;
  }

  &__wave-bg {
    position: absolute;
    inset: 0;
    pointer-events: none;
    border-radius: inherit;
    overflow: hidden;
    z-index: 0;
  }

  .wave-ambient {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse at 20% 0%, rgba($accent, 0.18) 0%, transparent 70%),
      radial-gradient(ellipse at 80% 100%, rgba($accent, 0.12) 0%, transparent 60%);
    animation: wave-pulse 3s ease-in-out infinite alternate;
  }

  .wave-svg {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 200%;
    height: 60%;
    opacity: 0.22;
  }

  .wave-layer {
    fill: $accent;

    &--back {
      opacity: 0.4;
      animation: wave-slide 8s linear infinite;
    }

    &--front {
      opacity: 0.8;
      animation: wave-slide 5s linear infinite reverse;
    }
  }

  &__header,
  &__content {
    position: relative;
    z-index: 1;
  }

  &__role-wrap {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  &__speaking-badge {
    background-color: rgba($accent, 0.15);
    color: $accent;
    border: 1px solid rgba($accent, 0.35);
    border-radius: $radius-full;
    padding: 0.1rem 0.45rem;
    font-size: 0.65rem;
    font-weight: 600;
    letter-spacing: 0.03em;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    font-family: inherit;
    text-transform: uppercase;
    transition: all 0.2s ease;
    animation: badge-pulse 2s infinite;

    &:hover {
      background-color: rgba($accent, 0.25);
      border-color: $accent;
    }

    .stop-hint {
      opacity: 0.6;
      font-weight: 400;
      text-transform: lowercase;
    }
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

@keyframes wave-slide {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-50%);
  }
}

@keyframes wave-pulse {
  0% {
    opacity: 0.5;
  }
  100% {
    opacity: 1;
  }
}

@keyframes badge-pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.04);
  }
}
</style>
