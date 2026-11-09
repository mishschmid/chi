import { eq } from 'drizzle-orm'
import { db } from '../../database'
import { user } from '../../database/schema'
import { requireUser } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const authUser = await requireUser(event)
  await db
    .update(user)
    .set({
      openaiApiKey: null,
      updatedAt: new Date(),
    })
    .where(eq(user.id, authUser.id))

  return { hasKey: false, maskedKey: null }
})
