import { describe, expect, it } from 'vitest'
import { toOpenAiMessages } from '../../../server/utils/llm/openai'
import type { ChatMessage } from '../../../server/utils/llm/types'

describe('openai message mapping', () => {
  it('maps all roles accurately to OpenAI parameters', () => {
    const input: ChatMessage[] = [
      { role: 'system', content: 'System instruction' },
      { role: 'user', content: 'User query' },
      { role: 'assistant', content: 'Assistant reply' },
    ]

    const result = toOpenAiMessages(input)

    expect(result).toEqual([
      { role: 'system', content: 'System instruction' },
      { role: 'user', content: 'User query' },
      { role: 'assistant', content: 'Assistant reply' },
    ])
  })
})
