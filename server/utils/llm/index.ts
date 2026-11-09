import type { LlmProvider } from './types'
import { createOpenAiProvider } from './openai'
import { createAnthropicProvider } from './anthropic'
import { getOpenAiKeyForUser } from '../aiKeys'

export * from './types'

export async function getLlm(
  purpose: 'chat' | 'extraction' = 'chat',
  userId?: string
): Promise<LlmProvider> {
  const config = useRuntimeConfig()
  const provider = ((config.llmProvider as string | undefined) ?? 'openai').toLowerCase()

  const defaultModel =
    purpose === 'extraction'
      ? ((config.llmExtractionModel as string | undefined) ?? 'gpt-4o-mini')
      : ((config.llmChatModel as string | undefined) ?? 'gpt-4o')

  if (provider === 'anthropic') {
    const key = (config.anthropicApiKey as string | undefined) ?? ''
    if (!key) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Missing API key for Anthropic (ANTHROPIC_API_KEY)',
      })
    }
    const anthropicDefaultModel =
      purpose === 'extraction'
        ? ((config.llmExtractionModel as string | undefined) ?? 'claude-3-5-haiku-latest')
        : ((config.llmChatModel as string | undefined) ?? 'claude-3-5-sonnet-latest')
    return createAnthropicProvider(key, anthropicDefaultModel)
  }

  const key = await getOpenAiKeyForUser(userId || '')
  return createOpenAiProvider(key, defaultModel)
}
