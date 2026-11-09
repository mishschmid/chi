import { and, desc, eq } from 'drizzle-orm'
import { db } from '../../../database'
import { conversations, messages } from '../../../database/schema'
import { getCurrentUserId } from '../../../utils/currentUser'
import { buildSystemPrompt } from '../../../utils/chat/prompt'
import { getLlm, type ChatMessage } from '../../../utils/llm'
import { listFacts } from '../../../utils/memory/facts'
import { extractFacts } from '../../../utils/memory/extract'

export default defineEventHandler(async (event) => {
  const userId = await getCurrentUserId(event)
  const conversationId = getRouterParam(event, 'id')

  if (!conversationId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing conversation id' })
  }

  const body = await readBody<{ content?: unknown }>(event)
  const content = typeof body?.content === 'string' ? body.content.trim() : ''

  if (!content) {
    throw createError({ statusCode: 400, statusMessage: 'Message content cannot be empty' })
  }

  if (content.length > 8000) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Message exceeds maximum length of 8000 characters',
    })
  }

  // Ensure conversation exists and belongs to current user
  const [conversation] = await db
    .select()
    .from(conversations)
    .where(and(eq(conversations.id, conversationId), eq(conversations.userId, userId)))
    .limit(1)

  if (!conversation) {
    throw createError({ statusCode: 404, statusMessage: 'Conversation not found' })
  }

  // Save the user message
  const [userMessage] = await db
    .insert(messages)
    .values({
      userId,
      conversationId,
      role: 'user',
      content,
    })
    .returning()

  // Load existing profile facts & last 30 messages for prompt context
  const facts = await listFacts(userId)
  const recentMessages = await db
    .select()
    .from(messages)
    .where(and(eq(messages.conversationId, conversationId), eq(messages.userId, userId)))
    .orderBy(desc(messages.createdAt))
    .limit(30)

  // Order back chronologically
  recentMessages.reverse()

  const systemPrompt = buildSystemPrompt(facts)
  const chatMessages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...recentMessages.map((m: (typeof recentMessages)[number]) => ({
      role: m.role as 'user' | 'assistant' | 'system',
      content: m.content,
    })),
  ]

  const llm = getLlm('chat')
  const stream = llm.streamChat(chatMessages)

  // Set response headers for direct streaming
  setHeader(event, 'content-type', 'text/plain; charset=utf-8')
  setHeader(event, 'cache-control', 'no-cache, no-transform')

  const encoder = new TextEncoder()
  let fullAssistantReply = ''

  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          fullAssistantReply += chunk
          controller.enqueue(encoder.encode(chunk))
        }
        controller.close()

        // Background persistence after stream completes
        try {
          await db.insert(messages).values({
            userId,
            conversationId,
            role: 'assistant',
            content: fullAssistantReply,
            model: llm.name,
          })

          const updateValues: { updatedAt: Date; title?: string } = {
            updatedAt: new Date(),
          }

          if (!conversation.title) {
            updateValues.title = content.slice(0, 60)
          }

          await db
            .update(conversations)
            .set(updateValues)
            .where(eq(conversations.id, conversationId))

          // Trigger fact extraction non-blockingly
          extractFacts(userId, conversationId).catch((err: unknown) => {
            console.error('Fact extraction failed:', err)
          })
        } catch (persistErr) {
          console.error('Failed to persist assistant message:', persistErr)
        }
      } catch (streamErr) {
        controller.error(streamErr)
      }
    },
  })

  return sendStream(event, readable)
})
