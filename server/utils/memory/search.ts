import { and, desc, eq, sql } from 'drizzle-orm'
import { db } from '../../database'
import { profileFacts, type ProfileFact } from '../../database/schema'
import { generateEmbedding } from './embeddings'
import { listFacts } from './facts'

/**
 * Searches for profile facts most relevant to the provided text query
 * using pgvector cosine distance (<=>). Falls back to recent facts if
 * query vector is unavailable or facts do not have embeddings.
 */
export async function searchRelevantFacts(
  userId: string,
  query: string,
  limit = 8
): Promise<ProfileFact[]> {
  const queryEmbedding = await generateEmbedding(query, userId)

  if (!queryEmbedding) {
    const fallback = await listFacts(userId)
    return fallback.slice(0, limit)
  }

  const vectorSql = sql`ARRAY[${sql.raw(queryEmbedding.join(','))}]::vector`

  // Cosine distance: smaller distance <=> greater similarity
  const results = await db
    .select({
      id: profileFacts.id,
      userId: profileFacts.userId,
      fact: profileFacts.fact,
      category: profileFacts.category,
      embedding: profileFacts.embedding,
      sourceMessageId: profileFacts.sourceMessageId,
      createdAt: profileFacts.createdAt,
      updatedAt: profileFacts.updatedAt,
      distance: sql<number>`${profileFacts.embedding} <=> ${vectorSql}`.as('distance'),
    })
    .from(profileFacts)
    .where(and(eq(profileFacts.userId, userId), sql`${profileFacts.embedding} IS NOT NULL`))
    .orderBy(sql`${profileFacts.embedding} <=> ${vectorSql}`)
    .limit(limit)

  if (results.length === 0) {
    const all = await listFacts(userId)
    return all.slice(0, limit)
  }

  return results.map((r) => ({
    id: r.id,
    userId: r.userId,
    fact: r.fact,
    category: r.category,
    embedding: r.embedding,
    sourceMessageId: r.sourceMessageId,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }))
}
