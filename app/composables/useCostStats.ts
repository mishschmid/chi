export interface CostPeriodStats {
  costUsd: number
  tokens: number
  count: number
}

export interface CostSummary {
  day: CostPeriodStats
  week: CostPeriodStats
  month: CostPeriodStats
}

export type CostPeriod = 'day' | 'week' | 'month'

export function useCostStats() {
  const stats = ref<CostSummary | null>(null)
  const activePeriod = ref<CostPeriod>('day')
  const loading = ref(false)

  async function refresh() {
    loading.value = true
    try {
      stats.value = await $fetch<CostSummary>('/api/stats/costs')
    } catch (err) {
      console.warn('Failed to fetch cost summary:', err)
    } finally {
      loading.value = false
    }
  }

  function cyclePeriod() {
    if (activePeriod.value === 'day') activePeriod.value = 'week'
    else if (activePeriod.value === 'week') activePeriod.value = 'month'
    else activePeriod.value = 'day'
  }

  const currentStats = computed(() => {
    if (!stats.value) return null
    return stats.value[activePeriod.value]
  })

  const label = computed(() => {
    switch (activePeriod.value) {
      case 'day':
        return 'Today'
      case 'week':
        return '7 Days'
      case 'month':
        return '30 Days'
    }
  })

  return {
    stats,
    activePeriod,
    currentStats,
    label,
    loading,
    refresh,
    cyclePeriod,
  }
}
