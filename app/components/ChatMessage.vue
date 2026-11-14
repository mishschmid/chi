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
  <div :class="['message-row', `message-row--${role}`]">
    <!-- User Bubble -->
    <div v-if="role === 'user'" class="bubble bubble--user">
      <div class="bubble__header-user">You</div>
      <div class="bubble__content">{{ content }}</div>
    </div>

    <!-- Assistant Bubble -->
    <div v-else class="bubble bubble--assistant" :class="{ 'bubble--speaking': speaking }">
      <div class="bubble__header-assistant">
        <div class="bubble__avatar">c</div>
        <div class="bubble__author">
          <span class="bubble__name">Cima</span>
          <span class="bubble__role-label">Assistant</span>
        </div>

        <button
          v-if="speaking"
          class="bubble__speaking-badge"
          title="Click to stop speaking"
          @click.stop="$emit('stop-speaking')"
        >
          <SoundWave size="sm" />
          <span>Speaking</span>
        </button>

        <div
          v-if="totalTokens || formattedCost"
          class="bubble__meta"
          :title="`Model: ${model || 'default'}`"
        >
          <span v-if="totalTokens">{{ totalTokens }} tokens</span>
          <span v-if="totalTokens && formattedCost">·</span>
          <span v-if="formattedCost" class="bubble__cost">{{ formattedCost }}</span>
        </div>
      </div>

      <ThinkingIndicator v-if="thinking && !content" />
      <div v-else :class="['bubble__content', { 'bubble__content--streaming': thinking }]">
        {{ content }}
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.message-row {
  display: flex;
  width: 100%;
  margin-bottom: 14px;

  &--user {
    justify-content: flex-end;
  }

  &--assistant {
    justify-content: flex-start;
  }
}

.bubble {
  position: relative;
  box-sizing: border-box;

  &--user {
    max-width: 72%;
    background: var(--orange);
    color: var(--on-orange);
    border-radius: 26px 26px 8px 26px;
    padding: 14px 20px 16px;
    display: flex;
    flex-direction: column;
    gap: 4px;

    .bubble__header-user {
      font-family: var(--font-mono);
      font-size: 11px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      opacity: 0.85;
    }

    .bubble__content {
      font-size: 17px;
      line-height: 1.45;
      word-break: break-word;
      white-space: pre-wrap;
    }

    @media (max-width: 600px) {
      max-width: 86%;
      border-radius: 22px 22px 6px 22px;
      padding: 12px 16px;
      font-size: 15px;
    }
  }

  &--assistant {
    max-width: 78%;
    background: var(--bg-sunken);
    color: var(--ink);
    border-radius: 26px 26px 26px 8px;
    padding: 14px 20px 18px;
    display: flex;
    flex-direction: column;
    gap: 10px;

    .bubble__content {
      font-size: 17px;
      line-height: 1.5;
      word-break: break-word;
      white-space: pre-wrap;
    }

    &.bubble--speaking {
      box-shadow: 0 0 0 2px var(--orange);
    }

    @media (max-width: 600px) {
      max-width: 88%;
      border-radius: 22px 22px 22px 6px;
      padding: 12px 16px 14px;
      font-size: 15px;
    }
  }
}

.bubble__header-assistant {
  display: flex;
  align-items: center;
  gap: 10px;
}

.bubble__avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: var(--btn-primary);
  color: var(--orange);
  display: grid;
  place-items: center;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: -0.04em;
  flex: none;
}

.bubble__author {
  display: flex;
  flex-direction: column;
  line-height: 1.15;
}

.bubble__name {
  font-size: 13px;
  font-weight: 600;
  color: var(--ink);
}

.bubble__role-label {
  font-size: 11px;
  color: var(--ink-2);
}

.bubble__speaking-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  background: rgba(255, 91, 53, 0.12);
  border: 1px solid var(--orange);
  border-radius: var(--radius-pill);
  color: var(--orange-ink);
  font-size: 11px;
  cursor: pointer;

  [data-theme='dark'] & {
    color: var(--orange-ink-dark);
  }
}

.bubble__meta {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--ink-2);
  background: var(--bg-surface);
  border-radius: var(--radius-pill);
  padding: 5px 11px;
  flex: none;

  .bubble__cost {
    color: var(--orange-ink);

    [data-theme='dark'] & {
      color: var(--orange-ink-dark);
    }
  }
}
</style>
