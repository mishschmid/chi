<script setup lang="ts">
import { computed } from 'vue'
import { useCostStats } from '~/composables/useCostStats'

const props = withDefaults(
  defineProps<{
    variant?: 'standard' | 'hero'
  }>(),
  {
    variant: 'standard',
  }
)

const { currentStats, label, cyclePeriod, refresh } = useCostStats()

defineExpose({
  refresh,
})

const formattedCost = computed(() => {
  if (!currentStats.value) return '$0.000'
  const val = currentStats.value.costUsd
  if (val > 0 && val < 0.001) return '<$0.001'
  return `$${val.toFixed(3)}`
})

const formattedTokens = computed(() => {
  if (!currentStats.value || !currentStats.value.tokens) return '0 tkn'
  const t = currentStats.value.tokens
  if (t >= 1_000_000) return `${(t / 1_000_000).toFixed(1)}M tkn`
  if (t >= 1_000) return `${(t / 1_000).toFixed(1)}k tkn`
  return `${t} tkn`
})
</script>

<template>
  <button
    :class="['cost-badge', `cost-badge--${variant}`]"
    :title="`Click to toggle timeframe (${label}). Total tokens: ${currentStats?.tokens || 0}`"
    @click="cyclePeriod"
  >
    <span class="cost-badge__period">{{ label }}</span>
    <span class="cost-badge__cost">{{ formattedCost }}</span>
    <span class="cost-badge__tokens">{{ formattedTokens }}</span>
  </button>
</template>

<style scoped lang="scss">
.cost-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border-radius: var(--radius-pill);
  padding: 5px 14px 5px 5px;
  font-family: var(--font-mono);
  font-size: 12px;
  flex: none;
  border: none;
  cursor: pointer;
  transition: opacity 0.15s ease;
  user-select: none;

  &:hover {
    opacity: 0.9;
  }

  &--standard {
    background: var(--bg-sunken);
    color: var(--ink);

    .cost-badge__period {
      background: var(--orange);
      color: var(--on-orange);
      border-radius: var(--radius-pill);
      padding: 4px 10px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .cost-badge__cost {
      font-weight: 500;
      color: var(--ink);
    }

    .cost-badge__tokens {
      color: var(--ink-2);
    }
  }

  &--hero {
    background: rgba(17, 17, 17, 0.1);
    color: var(--on-orange);

    .cost-badge__period {
      background: #111111;
      color: var(--orange);
      border-radius: var(--radius-pill);
      padding: 4px 10px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .cost-badge__cost {
      font-weight: 500;
      color: #111111;
    }

    .cost-badge__tokens {
      color: var(--on-orange-muted);
    }
  }
}
</style>
