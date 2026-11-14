import { createHealthClient } from '../health/client'

export interface ToolDefinition {
  name: string
  description: string
  parameters: {
    type: 'object'
    properties: Record<string, unknown>
    required?: string[]
  }
}

export const CIMA_TOOLS: ToolDefinition[] = [
  {
    name: 'get_recent_workouts',
    description:
      'Fetch the user recent completed activities and workouts (running, cycling, strength, etc.) with distance, pace, heart rate, and duration.',
    parameters: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Maximum number of workouts to return (default 5)',
        },
        sport: {
          type: 'string',
          description: 'Sport filter such as "run", "ride", "strength".',
        },
      },
    },
  },
  {
    name: 'get_recovery_metrics',
    description:
      'Fetch user recovery and Garmin wearable metrics: sleep, sleep score, HRV (Heart Rate Variability), resting HR, stress, or body battery.',
    parameters: {
      type: 'object',
      properties: {
        metric: {
          type: 'string',
          enum: ['restingHr', 'hrv', 'sleep', 'sleepScore', 'bodyBattery', 'stress'],
          description: 'The specific recovery metric to inspect.',
        },
        range: {
          type: 'string',
          enum: ['4w', '3m'],
          description: 'Time lookback window. Defaults to 4w.',
        },
      },
      required: ['metric'],
    },
  },
  {
    name: 'get_active_training_plan',
    description:
      'Fetch the active structured running/fitness training plan with upcoming phases and target workouts.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
]

export async function executeToolCall(
  name: string,
  args: Record<string, unknown>
): Promise<string> {
  const health = createHealthClient()

  switch (name) {
    case 'get_recent_workouts': {
      const limit = typeof args.limit === 'number' ? args.limit : 5
      const sport = typeof args.sport === 'string' ? args.sport : undefined
      const data = await health.getRecentWorkouts({ limit, sport })
      if (!data || !data.workouts || data.workouts.length === 0) {
        return JSON.stringify({ message: 'No workouts found in this period.' })
      }
      return JSON.stringify(
        data.workouts.map((w) => ({
          date: w.startTime.slice(0, 10),
          sport: w.sport,
          name: w.name,
          distanceKm: w.distanceKm,
          durationMinutes: Math.round(w.durationSeconds / 60),
          avgHr: w.averageHr,
          paceSecsPerKm: w.paceSecondsPerKm,
        }))
      )
    }

    case 'get_recovery_metrics': {
      const metric = (args.metric as any) ?? 'hrv'
      const range = (args.range as any) ?? '4w'
      const data = await health.getRecovery({ metric, range })
      if (!data) {
        return JSON.stringify({ message: 'No recovery metrics currently available.' })
      }
      return JSON.stringify({
        metric: data.metric,
        latest: data.latest,
        stats: data.stats,
      })
    }

    case 'get_active_training_plan': {
      const data = await health.getActivePlan()
      if (!data) {
        return JSON.stringify({ message: 'No active plan found.' })
      }
      return JSON.stringify(data)
    }

    default:
      return JSON.stringify({ error: `Unknown tool: ${name}` })
  }
}

export const CHI_TOOLS = CIMA_TOOLS
