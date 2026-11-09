import { describe, expect, it, vi } from 'vitest'
import * as embeddingsModule from '../../../server/utils/memory/embeddings'
import * as factsModule from '../../../server/utils/memory/facts'
import { searchRelevantFacts } from '../../../server/utils/memory/search'
import { db } from '../../../server/database'
import type { ProfileFact } from '../../../server/database/schema'

vi.mock('../../../server/utils/memory/embeddings')
vi.mock('../../../server/utils/memory/facts')
vi.mock('../../../server/database', () => ({
  db: {
    select: vi.fn(),
  },
}))

describe('semantic memory search', () => {
  it('falls back to listFacts when query embedding fails', async () => {
    vi.spyOn(embeddingsModule, 'generateEmbedding').mockResolvedValue(null)
    const mockFacts: ProfileFact[] = [
      {
        id: 'f1',
        userId: 'u1',
        fact: 'Lives in Zurich',
        category: 'identity',
        embedding: null,
        sourceMessageId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]
    vi.spyOn(factsModule, 'listFacts').mockResolvedValue(mockFacts)

    const res = await searchRelevantFacts('u1', 'Where do I live?')
    expect(res).toEqual(mockFacts)
  })

  it('performs vector distance query when embedding is generated', async () => {
    const mockVector = Array(1536).fill(0.01)
    vi.spyOn(embeddingsModule, 'generateEmbedding').mockResolvedValue(mockVector)

    const mockQueryResult = [
      {
        id: 'f1',
        userId: 'u1',
        fact: 'Has knee pain after running',
        category: 'health',
        embedding: mockVector,
        sourceMessageId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        distance: 0.12,
      },
    ]

    const queryChain = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue(mockQueryResult),
    }
    vi.mocked(db.select).mockReturnValue(queryChain as any)

    const res = await searchRelevantFacts('u1', 'knee hurts', 5)
    expect(res).toHaveLength(1)
    expect(res[0]?.fact).toBe('Has knee pain after running')
  })
})
