export interface HealthWorkout {
  id: number
  publicId: string
  name: string
  sport: string
  startTime: string
  distanceKm: number
  durationSeconds: number
  averageHr: number | null
  paceSecondsPerKm: number | null
}

export interface HealthWorkoutsResponse {
  workouts: HealthWorkout[]
  total: number
}

export interface HealthRecoveryResponse {
  metric: string
  range: string
  latest: { date: string; value: number; status?: string } | null
  stats: {
    avg: number | null
    min: number | null
    max: number | null
  }
}

export interface HealthClient {
  getRecentWorkouts(options?: {
    limit?: number
    sport?: string
  }): Promise<HealthWorkoutsResponse | null>
  getRecovery(options?: {
    metric?: 'restingHr' | 'hrv' | 'sleep' | 'sleepScore' | 'bodyBattery' | 'stress'
    range?: '4w' | '3m'
  }): Promise<HealthRecoveryResponse | null>
  getActivePlan(): Promise<unknown | null>
  getDashboard(): Promise<unknown | null>
}

export function createHealthClient(): HealthClient {
  const config = useRuntimeConfig()
  const baseUrl = (config.sansaApiUrl as string) || 'http://localhost:4444'
  const secret = (config.sansaServiceSecret as string) || ''
  const userId = (config.sansaUserId as string) || ''

  const headers: Record<string, string> = {
    'content-type': 'application/json',
  }
  if (secret) {
    headers['x-cima-secret'] = secret
    headers['x-chi-secret'] = secret
  }
  if (userId) {
    headers['x-user-id'] = userId
  }

  return {
    async getRecentWorkouts(options) {
      try {
        const query: Record<string, string | number> = {
          limit: options?.limit ?? 10,
        }
        if (options?.sport) query.sport = options.sport

        const res = await $fetch<HealthWorkoutsResponse>(`${baseUrl}/api/workouts`, {
          headers,
          query,
        })
        return res
      } catch (err) {
        console.warn('Failed to fetch workouts from Sansa:', err)
        return null
      }
    },

    async getRecovery(options) {
      try {
        const metric = options?.metric ?? 'hrv'
        const range = options?.range ?? '4w'
        const res = await $fetch<HealthRecoveryResponse>(`${baseUrl}/api/stats/recovery`, {
          headers,
          query: { metric, range },
        })
        return res
      } catch (err) {
        console.warn('Failed to fetch recovery stats from Sansa:', err)
        return null
      }
    },

    async getActivePlan() {
      try {
        return await $fetch(`${baseUrl}/api/plan`, { headers })
      } catch (err) {
        console.warn('Failed to fetch training plan from Sansa:', err)
        return null
      }
    },

    async getDashboard() {
      try {
        return await $fetch(`${baseUrl}/api/dashboard`, { headers })
      } catch (err) {
        console.warn('Failed to fetch dashboard from Sansa:', err)
        return null
      }
    },
  }
}
