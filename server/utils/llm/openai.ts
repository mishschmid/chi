import OpenAI from 'openai'
import type { ChatMessage, ChatOptions, LlmProvider } from './types'

export function toOpenAiMessages(
  messages: ChatMessage[]
): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
  return messages.map((m) => {
    if (m.role === 'system') {
      return { role: 'system', content: m.content }
    }
    if (m.role === 'assistant') {
      return { role: 'assistant', content: m.content }
    }
    return { role: 'user', content: m.content }
  })
}

export function createOpenAiProvider(apiKey: string, defaultModel = 'gpt-4o'): LlmProvider {
  if (!apiKey) {
    throw new Error('Missing API key for OpenAI')
  }

  const client = new OpenAI({ apiKey, fetch: globalThis.fetch })

  return {
    name: 'openai',

    async *streamChat(messages: ChatMessage[], options?: ChatOptions): AsyncIterable<string> {
      const stream = await client.chat.completions.create({
        model: options?.model ?? defaultModel,
        messages: toOpenAiMessages(messages),
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens,
        stream: true,
      })

      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content
        if (text) {
          yield text
        }
      }
    },

    async completeJson<T>(messages: ChatMessage[], options?: ChatOptions): Promise<T> {
      const response = await client.chat.completions.create({
        model: options?.model ?? defaultModel,
        messages: toOpenAiMessages(messages),
        temperature: options?.temperature ?? 0.1,
        max_tokens: options?.maxTokens,
        response_format: { type: 'json_object' },
      })

      const content = response.choices[0]?.message?.content
      if (!content) {
        throw new Error('OpenAI response did not contain content')
      }

      return JSON.parse(content) as T
    },
  }
}
