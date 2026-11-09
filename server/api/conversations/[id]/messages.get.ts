import { asc, and, eq } from 'drizzle-orm'
import { db } from '../../../database'
import { conversations, messages } from '../../../database/schema'
import { getCurrentUserId } from '../../../utils/currentUser'

export default defineEventHandler(async (event) => {
  const userId = await getCurrentUserId(event)
  const conversationId = getRouterParam(event, 'id')

  if (!conversationId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing conversation id' })
  }

  const [conversation] = await db
    .select()
    .from(conversations)
    .where(and(eq(conversations.id, conversationId), eq(conversations.userId, userId)))
    .limit(1)

  if (!conversation) {
    throw createError({ statusCode: 404, statusMessage: 'Conversation not found' })
  }

  const list = await db
    .select()
    .from(messages)
    .where(and(eq(messages.conversationId, conversationId), eq(messages.userId, userId)))
    .orderBy(asc(messages.createdAt))

  return list
})
