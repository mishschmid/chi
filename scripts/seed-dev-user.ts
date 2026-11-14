import { eq } from 'drizzle-orm'
import { db } from '../server/database'
import { user } from '../server/database/schema'

const DEV_USER_ID = process.env.DEV_USER_ID ?? '00000000-0000-0000-0000-000000000001'
const DEV_USER_NAME = 'Michael'
const DEV_USER_EMAIL = 'michael@cima.test'

async function seed() {
  const existing = await db.select().from(user).where(eq(user.id, DEV_USER_ID)).limit(1)

  if (existing.length > 0) {
    console.log(`Dev user ${DEV_USER_NAME} (${DEV_USER_ID}) already exists.`)
    process.exit(0)
  }

  await db.insert(user).values({
    id: DEV_USER_ID,
    name: DEV_USER_NAME,
    email: DEV_USER_EMAIL,
    role: 'user',
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  console.log(`Created dev user ${DEV_USER_NAME} (${DEV_USER_ID}).`)
  process.exit(0)
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
