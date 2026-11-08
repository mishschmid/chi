import { eq } from 'drizzle-orm'
import { db } from '../server/database'
import { users } from '../server/database/schema'

const DEV_USER_ID = process.env.DEV_USER_ID ?? '00000000-0000-0000-0000-000000000001'
const DEV_USER_NAME = 'Michael'

async function seed() {
  const existing = await db.select().from(users).where(eq(users.id, DEV_USER_ID)).limit(1)

  if (existing.length > 0) {
    console.log(`Dev user ${DEV_USER_NAME} (${DEV_USER_ID}) already exists.`)
    process.exit(0)
  }

  await db.insert(users).values({
    id: DEV_USER_ID,
    name: DEV_USER_NAME,
  })

  console.log(`Created dev user ${DEV_USER_NAME} (${DEV_USER_ID}).`)
  process.exit(0)
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
