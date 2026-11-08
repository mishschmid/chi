import { describe, expect, it, vi } from 'vitest'
import { executeToolCall, CHI_TOOLS } from '../../../server/utils/llm/tools'
import * as healthModule from '../../../server/utils/health/client'

describe('health tools & execution', () => {
  it('exposes well-defined tools', () => {
    const names = CHI_TOOLS.map((t) => t.name)
    expect(names).toContain('get_recent_workouts')
    expect(names).toContain('get_recovery_metrics')
    expect(names).toContain('get_active_training_plan')
  })

  it('executes get_recent_workouts and returns formatted json', async () => {
    vi.spyOn(healthModule, 'createHealthClient').mockReturnValue({
      getRecentWorkouts: vi.fn().mockResolvedValue({
        workouts: [
          {
            id: 1,
            publicId: 'w1',
            name: 'Sunday Morning Long Run',
            sport: 'run',
            startTime: '2026-11-01T08:00:00Z',
            distanceKm: 15.5,
            durationSeconds: 4800,
            averageHr: 145,
            paceSecondsPerKm: 310,
          },
        ],
        total: 1,
      }),
      getRecovery: vi.fn(),
      getActivePlan: vi.fn(),
      getDashboard: vi.fn(),
    })

    const result = await executeToolCall('get_recent_workouts', { limit: 1 })
    const parsed = JSON.parse(result)

    expect(parsed).toHaveLength(1)
    expect(parsed[0].name).toBe('Sunday Morning Long Run')
    expect(parsed[0].distanceKm).toBe(15.5)
    expect(parsed[0].durationMinutes).toBe(80)
  })

  it('executes get_recovery_metrics accurately', async () => {
    vi.spyOn(healthModule, 'createHealthClient').mockReturnValue({
      getRecentWorkouts: vi.fn(),
      getRecovery: vi.fn().mockResolvedValue({
        metric: 'hrv',
        range: '4w',
        latest: { date: '2026-11-07', value: 65, status: 'balanced' },
        stats: { avg: 62, min: 54, max: 70 },
      }),
      getActivePlan: vi.fn(),
      getDashboard: vi.fn(),
    })

    const result = await executeToolCall('get_recovery_metrics', { metric: 'hrv' })
    const parsed = JSON.parse(result)

    expect(parsed.metric).toBe('hrv')
    expect(parsed.latest.value).toBe(65)
    expect(parsed.latest.status).toBe('balanced')
  })
})
