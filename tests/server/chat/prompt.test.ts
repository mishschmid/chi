import { describe, expect, it } from 'vitest'
import { buildSystemPrompt } from '../../../server/utils/chat/prompt'
import type { ProfileFact } from '../../../server/database/schema'

describe('chat prompt builder', () => {
  it('builds system prompt without facts', () => {
    const prompt = buildSystemPrompt([])
    expect(prompt).toContain('You are Cima')
    expect(prompt).not.toContain('What you know about the user')
  })

  it('builds system prompt with facts', () => {
    const mockFacts: ProfileFact[] = [
      {
        id: '1',
        userId: 'u1',
        fact: 'Training for a marathon in autumn',
        category: 'goal',
        embedding: null,
        sourceMessageId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '2',
        userId: 'u1',
        fact: 'Lives in Zurich',
        category: 'identity',
        embedding: null,
        sourceMessageId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    const prompt = buildSystemPrompt(mockFacts)
    expect(prompt).toContain('You are Cima')
    expect(prompt).toContain('What you know about the user:')
    expect(prompt).toContain('- [goal] Training for a marathon in autumn')
    expect(prompt).toContain('- [identity] Lives in Zurich')
  })
})
