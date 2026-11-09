import { describe, expect, it, vi } from 'vitest'
import * as llmModule from '../../../server/utils/llm'
import * as factsModule from '../../../server/utils/memory/facts'
import { extractFacts } from '../../../server/utils/memory/extract'
import { db } from '../../../server/database'
import type { Message, ProfileFact } from '../../../server/database/schema'

vi.mock('../../../server/utils/llm')
vi.mock('../../../server/utils/memory/facts')
vi.mock('../../../server/database', () => ({
  db: {
    select: vi.fn(),
  },
}))

describe('memory fact extraction', () => {
  it('saves valid facts and skips invalid categories', async () => {
    const userId = 'user-1'
    const conversationId = 'conv-1'

    vi.spyOn(factsModule, 'listFacts').mockResolvedValue([
      {
        id: 'fact-1',
        userId,
        fact: 'Lives in Zurich',
        category: 'identity',
        sourceMessageId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as ProfileFact,
    ])

    const mockMessages: Message[] = [
      {
        id: 'm1',
        userId,
        conversationId,
        role: 'user',
        content: 'I want to run a 5k next spring. Also I eat bananas right now.',
        model: null,
        promptTokens: null,
        completionTokens: null,
        totalTokens: null,
        costUsd: null,
        createdAt: new Date(),
      },
    ]

    const selectChain = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue(mockMessages),
    }
    vi.mocked(db.select).mockReturnValue(selectChain as any)

    const addFactSpy = vi.spyOn(factsModule, 'addFact').mockResolvedValue({} as any)
    const updateFactSpy = vi.spyOn(factsModule, 'updateFact').mockResolvedValue({} as any)

    vi.spyOn(llmModule, 'getLlm').mockResolvedValue({
      name: 'openai',
      streamChat: vi.fn(),
      completeJson: vi.fn().mockResolvedValue({
        add: [
          { fact: 'Goal to run a 5k next spring', category: 'goal' },
          { fact: 'Invalid category fact', category: 'unknown_stuff' },
          { fact: '   ', category: 'goal' },
        ],
        update: [
          { id: 'fact-1', fact: 'Lives in Zurich downtown' },
          { id: 'non-existent-fact-id', fact: 'Should be ignored' },
        ],
      }),
    })

    await extractFacts(userId, conversationId)

    expect(addFactSpy).toHaveBeenCalledTimes(1)
    expect(addFactSpy).toHaveBeenCalledWith(userId, 'Goal to run a 5k next spring', 'goal')

    expect(updateFactSpy).toHaveBeenCalledTimes(1)
    expect(updateFactSpy).toHaveBeenCalledWith(userId, 'fact-1', 'Lives in Zurich downtown')
  })
})
