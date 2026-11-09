import { asc, and, eq } from 'drizzle-orm'
import { db } from '../../database'
import { profileFacts, type ProfileFact } from '../../database/schema'
import { generateEmbedding } from './embeddings'

export async function listFacts(userId: string): Promise<ProfileFact[]> {
  return db
    .select()
    .from(profileFacts)
    .where(eq(profileFacts.userId, userId))
    .orderBy(asc(profileFacts.createdAt))
}

export async function addFact(
  userId: string,
  fact: string,
  category: 'identity' | 'goal' | 'preference' | 'person' | 'health' | 'other',
  sourceMessageId?: string | null
): Promise<ProfileFact> {
  const embedding = await generateEmbedding(fact, userId)

  const [created] = await db
    .insert(profileFacts)
    .values({
      userId,
      fact: fact.trim(),
      category,
      embedding: embedding ?? null,
      sourceMessageId: sourceMessageId ?? null,
    })
    .returning()
  if (!created) {
    throw new Error('Failed to insert profile fact')
  }
  return created
}

export async function updateFact(
  userId: string,
  id: string,
  fact: string
): Promise<ProfileFact | null> {
  const embedding = await generateEmbedding(fact, userId)

  const [updated] = await db
    .update(profileFacts)
    .set({
      fact: fact.trim(),
      embedding: embedding ?? null,
      updatedAt: new Date(),
    })
    .where(and(eq(profileFacts.id, id), eq(profileFacts.userId, userId)))
    .returning()
  return updated ?? null
}

export async function deleteFact(userId: string, id: string): Promise<boolean> {
  const deleted = await db
    .delete(profileFacts)
    .where(and(eq(profileFacts.id, id), eq(profileFacts.userId, userId)))
    .returning()
  return deleted.length > 0
}
