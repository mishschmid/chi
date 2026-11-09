import { eq } from 'drizzle-orm'
import { db } from '../../database'
import { user } from '../../database/schema'
import { requireUser } from '../../utils/session'
import { encryptSecret, decryptSecret, maskSecret } from '../../utils/crypto'
import { validateOpenAiKey } from '../../utils/aiKeys'

export default defineEventHandler(async (event) => {
  const authUser = await requireUser(event)
  const body = await readBody<{ apiKey?: unknown }>(event)
  const apiKey = typeof body?.apiKey === 'string' ? body.apiKey.trim() : ''

  if (!apiKey) {
    throw createError({ statusCode: 400, statusMessage: 'API key cannot be empty' })
  }

  await validateOpenAiKey(apiKey)

  const encrypted = encryptSecret(apiKey)
  await db
    .update(user)
    .set({
      openaiApiKey: encrypted,
      updatedAt: new Date(),
    })
    .where(eq(user.id, authUser.id))

  return {
    hasKey: true,
    maskedKey: maskSecret(apiKey),
  }
})
