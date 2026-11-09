import { describe, expect, it } from 'vitest'

describe('cost period formatting logic', () => {
  it('toggles periods sequentially', () => {
    const periods = ['day', 'week', 'month'] as const
    let current = 0

    function cycle() {
      current = (current + 1) % periods.length
      return periods[current]
    }

    expect(cycle()).toBe('week')
    expect(cycle()).toBe('month')
    expect(cycle()).toBe('day')
  })

  it('formats token count metrics cleanly', () => {
    function format(t: number) {
      if (t >= 1_000_000) return `${(t / 1_000_000).toFixed(1)}M`
      if (t >= 1_000) return `${(t / 1_000).toFixed(1)}k`
      return `${t}`
    }

    expect(format(500)).toBe('500')
    expect(format(12400)).toBe('12.4k')
    expect(format(2450000)).toBe('2.5M')
  })
})
