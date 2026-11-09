import { and, eq, gte, sql } from 'drizzle-orm'
import { db } from '../../database'
import { messages } from '../../database/schema'
import { getCurrentUserId } from '../../utils/currentUser'

export default defineEventHandler(async (event) => {
  const userId = await getCurrentUserId(event)

  const now = new Date()

  // Start of day (midnight UTC / local)
  const startOfDay = new Date(now)
  startOfDay.setHours(0, 0, 0, 0)

  // Start of week (7 days ago)
  const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  // Start of month (30 days ago)
  const startOfMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const [dailyResult, weeklyResult, monthlyResult] = await Promise.all([
    // Daily stats
    db
      .select({
        totalCost: sql<string>`COALESCE(SUM(CAST(${messages.costUsd} AS NUMERIC)), 0)`,
        totalTokens: sql<string>`COALESCE(SUM(${messages.totalTokens}), 0)`,
        count: sql<number>`COUNT(*)`,
      })
      .from(messages)
      .where(
        and(
          eq(messages.userId, userId),
          eq(messages.role, 'assistant'),
          gte(messages.createdAt, startOfDay)
        )
      ),

    // Weekly stats
    db
      .select({
        totalCost: sql<string>`COALESCE(SUM(CAST(${messages.costUsd} AS NUMERIC)), 0)`,
        totalTokens: sql<string>`COALESCE(SUM(${messages.totalTokens}), 0)`,
        count: sql<number>`COUNT(*)`,
      })
      .from(messages)
      .where(
        and(
          eq(messages.userId, userId),
          eq(messages.role, 'assistant'),
          gte(messages.createdAt, startOfWeek)
        )
      ),

    // Monthly stats
    db
      .select({
        totalCost: sql<string>`COALESCE(SUM(CAST(${messages.costUsd} AS NUMERIC)), 0)`,
        totalTokens: sql<string>`COALESCE(SUM(${messages.totalTokens}), 0)`,
        count: sql<number>`COUNT(*)`,
      })
      .from(messages)
      .where(
        and(
          eq(messages.userId, userId),
          eq(messages.role, 'assistant'),
          gte(messages.createdAt, startOfMonth)
        )
      ),
  ])

  return {
    day: {
      costUsd: Number(dailyResult[0]?.totalCost || 0),
      tokens: Number(dailyResult[0]?.totalTokens || 0),
      count: Number(dailyResult[0]?.count || 0),
    },
    week: {
      costUsd: Number(weeklyResult[0]?.totalCost || 0),
      tokens: Number(weeklyResult[0]?.totalTokens || 0),
      count: Number(weeklyResult[0]?.count || 0),
    },
    month: {
      costUsd: Number(monthlyResult[0]?.totalCost || 0),
      tokens: Number(monthlyResult[0]?.totalTokens || 0),
      count: Number(monthlyResult[0]?.count || 0),
    },
  }
})
