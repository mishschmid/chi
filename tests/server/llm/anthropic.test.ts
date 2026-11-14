import { describe, expect, it } from 'vitest'
import { splitSystemMessages } from '../../../server/utils/llm/anthropic'
import type { ChatMessage } from '../../../server/utils/llm/types'

describe('anthropic message separation', () => {
  it('extracts system messages into a separate prompt', () => {
    const input: ChatMessage[] = [
      { role: 'system', content: 'You are Cima.' },
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi there!' },
      { role: 'system', content: 'Remember facts.' },
      { role: 'user', content: 'How are you?' },
    ]

    const result = splitSystemMessages(input)

    expect(result.systemPrompt).toBe('You are Cima.\n\nRemember facts.')
    expect(result.nonSystemMessages).toEqual([
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi there!' },
      { role: 'user', content: 'How are you?' },
    ])
  })

  it('handles messages with no system prompt', () => {
    const input: ChatMessage[] = [{ role: 'user', content: 'Hello' }]
    const result = splitSystemMessages(input)

    expect(result.systemPrompt).toBeUndefined()
    expect(result.nonSystemMessages).toEqual([{ role: 'user', content: 'Hello' }])
  })
})
