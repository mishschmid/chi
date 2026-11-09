<script setup lang="ts">
import { computed } from 'vue'
import { useCostStats } from '~/composables/useCostStats'

const { activePeriod, currentStats, label, cyclePeriod, refresh } = useCostStats()

defineExpose({
  refresh,
})

const formattedCost = computed(() => {
  if (!currentStats.value) return '$0.00'
  const val = currentStats.value.costUsd
  if (val > 0 && val < 0.001) return '<$0.001'
  return `$${val.toFixed(3)}`
})

const formattedTokens = computed(() => {
  if (!currentStats.value || !currentStats.value.tokens) return '0'
  const t = currentStats.value.tokens
  if (t >= 1_000_000) return `${(t / 1_000_000).toFixed(1)}M`
  if (t >= 1_000) return `${(t / 1_000).toFixed(1)}k`
  return `${t}`
})
</script>

<template>
  <button
    class="cost-toggle"
    :title="`Click to toggle timeframe: Today → 7 Days → 30 Days. Total tokens: ${currentStats?.tokens || 0}`"
    @click="cyclePeriod"
  >
    <span class="period-pill">{{ label }}</span>
    <span class="cost-amount">{{ formattedCost }}</span>
    <span class="tokens-amount">({{ formattedTokens }} tkn)</span>
  </button>
</template>

<style scoped lang="scss">
.cost-toggle {
  background-color: rgba(255, 255, 255, 0.03);
  border: 1px solid $border-subtle;
  color: $text-secondary;
  border-radius: $radius-full;
  padding: 0.25rem 0.65rem;
  font-size: 0.75rem;
  font-family: monospace;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;

  &:hover {
    background-color: $bg-surface-elevated;
    border-color: $border-strong;
    color: $text-primary;
  }

  .period-pill {
    background-color: rgba($accent, 0.12);
    color: $accent;
    font-size: 0.65rem;
    font-weight: 600;
    padding: 0.1rem 0.35rem;
    border-radius: $radius-sm;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .cost-amount {
    font-weight: 600;
    color: $text-primary;
  }

  .tokens-amount {
    color: $text-muted;
    font-size: 0.7rem;
  }
}
</style>
