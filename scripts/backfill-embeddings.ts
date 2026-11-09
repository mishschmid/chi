import { eq, isNull } from 'drizzle-orm'
import { db } from '../server/database'
import { profileFacts } from '../server/database/schema'
import { generateEmbedding } from '../server/utils/memory/embeddings'

async function backfill() {
  console.log('Finding profile facts without embeddings...')
  const facts = await db.select().from(profileFacts).where(isNull(profileFacts.embedding))

  console.log(`Found ${facts.length} facts to vectorize.`)

  for (const f of facts) {
    console.log(`Vectorizing fact [${f.id}]: "${f.fact}"...`)
    const embedding = await generateEmbedding(f.fact, f.userId)
    if (embedding) {
      await db.update(profileFacts).set({ embedding }).where(eq(profileFacts.id, f.id))
      console.log(`Saved embedding for [${f.id}].`)
    } else {
      console.warn(`Could not generate embedding for [${f.id}].`)
    }
  }

  console.log('Backfill complete.')
  process.exit(0)
}

backfill().catch((err) => {
  console.error('Backfill error:', err)
  process.exit(1)
})
