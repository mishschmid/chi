export type ChatRole = 'system' | 'user' | 'assistant'

export interface ChatMessage {
  role: ChatRole
  content: string
}

export interface ChatOptions {
  model?: string
  temperature?: number
  maxTokens?: number
  enableTools?: boolean
}

export interface LlmProvider {
  name: 'openai' | 'anthropic'
  streamChat(messages: ChatMessage[], options?: ChatOptions): AsyncIterable<string>
  completeJson<T>(messages: ChatMessage[], options?: ChatOptions): Promise<T>
}
