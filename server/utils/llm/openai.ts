import OpenAI from 'openai'
import type { ChatMessage, ChatOptions, LlmProvider } from './types'
import { CHI_TOOLS, executeToolCall } from './tools'

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
      const enableTools = options?.enableTools ?? true

      if (!enableTools) {
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
        return
      }

      // Step 1: Initial call with tool definitions
      const activeMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] =
        toOpenAiMessages(messages)

      const firstResponse = await client.chat.completions.create({
        model: options?.model ?? defaultModel,
        messages: activeMessages,
        tools: CHI_TOOLS.map((t) => ({
          type: 'function' as const,
          function: {
            name: t.name,
            description: t.description,
            parameters: t.parameters,
          },
        })),
        temperature: options?.temperature ?? 0.7,
      })

      const choice = firstResponse.choices[0]
      if (!choice) return

      // Step 2: Handle tool calls if requested by model
      if (choice.message.tool_calls && choice.message.tool_calls.length > 0) {
        activeMessages.push(choice.message)

        for (const toolCall of choice.message.tool_calls) {
          let parsedArgs = {}
          try {
            parsedArgs = JSON.parse(toolCall.function.arguments || '{}')
          } catch {
            parsedArgs = {}
          }

          const result = await executeToolCall(toolCall.function.name, parsedArgs)

          activeMessages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: result,
          })
        }

        // Step 3: Stream the final synthesised response
        const secondStream = await client.chat.completions.create({
          model: options?.model ?? defaultModel,
          messages: activeMessages,
          temperature: options?.temperature ?? 0.7,
          max_tokens: options?.maxTokens,
          stream: true,
        })

        for await (const chunk of secondStream) {
          const text = chunk.choices[0]?.delta?.content
          if (text) {
            yield text
          }
        }
        return
      }

      // If no tool was called, yield the direct message content
      if (choice.message.content) {
        yield choice.message.content
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
