import { and, desc, eq } from 'drizzle-orm'
import { db } from '../../database'
import { messages } from '../../database/schema'
import { getLlm, type ChatMessage } from '../llm'
import { addFact, listFacts, updateFact } from './facts'

const VALID_CATEGORIES = new Set(['identity', 'goal', 'preference', 'person', 'health', 'other'])

interface ExtractionResponse {
  add?: Array<{ fact?: unknown; category?: unknown }>
  update?: Array<{ id?: unknown; fact?: unknown }>
}

export async function extractFacts(userId: string, conversationId: string): Promise<void> {
  const [existingFacts, recentMessages] = await Promise.all([
    listFacts(userId),
    db
      .select()
      .from(messages)
      .where(and(eq(messages.conversationId, conversationId), eq(messages.userId, userId)))
      .orderBy(desc(messages.createdAt))
      .limit(6),
  ])

  recentMessages.reverse()

  if (recentMessages.length === 0) return

  const factsContext =
    existingFacts.length > 0
      ? existingFacts.map((f) => `ID: ${f.id} | [${f.category}] ${f.fact}`).join('\n')
      : 'None'

  const conversationText = recentMessages
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join('\n')

  const prompt = `Analyze the conversation snippet and identify lasting facts about the user.
Lasting facts are:
- identity (name, location, job, core traits)
- goal (fitness targets, career goals, personal ambitions)
- preference (dietary preferences, likes, dislikes, communication style)
- person (family members, friends, colleagues, pets)
- health (injuries, allergies, sleep patterns, physical conditions)
- other (long-term projects, enduring life circumstances)

Do NOT save:
- ephemeral, temporary details ("I am eating an apple right now", "I'm tired today")
- conversational pleasantries
- duplicates of existing facts

Existing facts:
${factsContext}

Recent conversation:
${conversationText}

Respond ONLY with valid JSON in this schema:
{
  "add": [{ "fact": "...", "category": "identity|goal|preference|person|health|other" }],
  "update": [{ "id": "existing-fact-id", "fact": "updated wording" }]
}`

  const llm = getLlm('extraction')
  const chatMessages: ChatMessage[] = [{ role: 'user', content: prompt }]

  let parsed: ExtractionResponse
  try {
    parsed = await llm.completeJson<ExtractionResponse>(chatMessages)
  } catch (err) {
    console.error('LLM completeJson extraction failed:', err)
    return
  }

  // Validate and apply additions
  if (Array.isArray(parsed.add)) {
    for (const item of parsed.add) {
      if (typeof item.fact !== 'string' || !item.fact.trim()) continue
      if (typeof item.category !== 'string' || !VALID_CATEGORIES.has(item.category)) continue

      const category = item.category as
        'identity' | 'goal' | 'preference' | 'person' | 'health' | 'other'

      await addFact(userId, item.fact.trim(), category)
    }
  }

  // Validate and apply updates
  if (Array.isArray(parsed.update)) {
    const validIds = new Set(existingFacts.map((f) => f.id))
    for (const item of parsed.update) {
      if (typeof item.id !== 'string' || !validIds.has(item.id)) continue
      if (typeof item.fact !== 'string' || !item.fact.trim()) continue

      await updateFact(userId, item.id, item.fact.trim())
    }
  }
}
