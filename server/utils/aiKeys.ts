import OpenAI from 'openai'
import { eq } from 'drizzle-orm'
import { db } from '../database'
import { user } from '../database/schema'
import { decryptSecret } from './crypto'

export async function validateOpenAiKey(apiKey: string): Promise<void> {
  const client = new OpenAI({ apiKey })
  try {
    await client.models.list()
  } catch (err: any) {
    if (err instanceof OpenAI.AuthenticationError) {
      throw createError({
        statusCode: 400,
        statusMessage: `Invalid OpenAI API key: ${err.message}`,
      })
    }
    throw err
  }
}

export async function getOpenAiKeyForUser(userId: string): Promise<string> {
  if (userId) {
    const [row] = await db
      .select({ openaiApiKey: user.openaiApiKey })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1)

    if (row?.openaiApiKey) {
      return decryptSecret(row.openaiApiKey)
    }
  }

  // Fallback to server environment key
  const serverKey = process.env.OPENAI_API_KEY || ''
  if (serverKey) {
    return serverKey
  }

  throw createError({
    statusCode: 400,
    statusMessage: 'No OpenAI API key found. Please add your API key in Settings.',
  })
}
