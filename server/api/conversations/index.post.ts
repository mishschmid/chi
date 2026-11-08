import { db } from '../../database'
import { conversations } from '../../database/schema'
import { getCurrentUserId } from '../../utils/currentUser'

export default defineEventHandler(async (event) => {
  const userId = getCurrentUserId(event)

  const [created] = await db
    .insert(conversations)
    .values({
      userId,
      title: null,
    })
    .returning()

  return created
})
