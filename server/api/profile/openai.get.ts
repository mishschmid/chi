import { eq } from 'drizzle-orm'
import { db } from '../../database'
import { user } from '../../database/schema'
import { requireUser } from '../../utils/session'
import { decryptSecret, maskSecret } from '../../utils/crypto'

export default defineEventHandler(async (event) => {
  const authUser = await requireUser(event)
  const [row] = await db
    .select({
      openaiApiKey: user.openaiApiKey,
    })
    .from(user)
    .where(eq(user.id, authUser.id))
    .limit(1)

  return {
    hasKey: Boolean(row?.openaiApiKey),
    maskedKey: row?.openaiApiKey ? maskSecret(decryptSecret(row.openaiApiKey)) : null,
  }
})
