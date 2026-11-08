import { desc, eq } from 'drizzle-orm'
import { db } from '../../database'
import { conversations } from '../../database/schema'
import { getCurrentUserId } from '../../utils/currentUser'

export default defineEventHandler(async (event) => {
  const userId = getCurrentUserId(event)

  const list = await db
    .select()
    .from(conversations)
    .where(eq(conversations.userId, userId))
    .orderBy(desc(conversations.updatedAt))

  return list
})
