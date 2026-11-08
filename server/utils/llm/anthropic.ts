import OpenAI from 'openai'
import type { ChatMessage, ChatOptions, LlmProvider } from './types'

export function splitSystemMessages(messages: ChatMessage[]): {
  systemPrompt?: string
  nonSystemMessages: Array<{ role: 'user' | 'assistant'; content: string }>
} {
  const systemParts: string[] = []
  const nonSystemMessages: Array<{ role: 'user' | 'assistant'; content: string }> = []

  for (const msg of messages) {
    if (msg.role === 'system') {
      systemParts.push(msg.content)
    } else {
      nonSystemMessages.push({ role: msg.role, content: msg.content })
    }
  }

  return {
    systemPrompt: systemParts.length > 0 ? systemParts.join('\n\n') : undefined,
    nonSystemMessages,
  }
}

export function createAnthropicProvider(
  apiKey: string,
  defaultModel = 'claude-3-5-sonnet-latest'
): LlmProvider {
  if (!apiKey) {
    throw new Error('Missing API key for Anthropic')
  }

  return {
    name: 'anthropic',

    async *streamChat(messages: ChatMessage[], options?: ChatOptions): AsyncIterable<string> {
      const { Anthropic } = await import('@anthropic-ai/sdk')
      const client = new Anthropic({ apiKey, fetch: globalThis.fetch })
      const { systemPrompt, nonSystemMessages } = splitSystemMessages(messages)

      const stream = await client.messages.stream({
        model: options?.model ?? defaultModel,
        max_tokens: options?.maxTokens ?? 2048,
        temperature: options?.temperature ?? 0.7,
        ...(systemPrompt ? { system: systemPrompt } : {}),
        messages: nonSystemMessages,
      })

      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          yield chunk.delta.text
        }
      }
    },

    async completeJson<T>(messages: ChatMessage[], options?: ChatOptions): Promise<T> {
      const { Anthropic } = await import('@anthropic-ai/sdk')
      const client = new Anthropic({ apiKey, fetch: globalThis.fetch })
      const { systemPrompt, nonSystemMessages } = splitSystemMessages(messages)

      const augmentedSystem = [
        systemPrompt,
        'CRITICAL: Respond with valid JSON only. Do not include markdown formatting, code blocks, or explanatory text.',
      ]
        .filter(Boolean)
        .join('\n\n')

      const response = await client.messages.create({
        model: options?.model ?? defaultModel,
        max_tokens: options?.maxTokens ?? 2048,
        temperature: options?.temperature ?? 0.1,
        system: augmentedSystem,
        messages: nonSystemMessages,
      })

      const block = response.content[0]
      if (!block || block.type !== 'text') {
        throw new Error('Anthropic response did not contain text content')
      }

      const text = block.text.trim()
      const cleaned = text.startsWith('```')
        ? text
            .replace(/^```(?:json)?\s*/i, '')
            .replace(/```\s*$/, '')
            .trim()
        : text

      return JSON.parse(cleaned) as T
    },
  }
}
