export interface TokenUsage {
  promptTokens: number
  completionTokens: number
  totalTokens: number
  costUsd: number
  model: string
}

// Pricing per 1M tokens (USD)
// Listed with longer prefixes first so 'gpt-4o-mini' matches before 'gpt-4o'
const PRICING: Array<{ prefix: string; prompt: number; completion: number }> = [
  { prefix: 'gpt-4o-mini', prompt: 0.15, completion: 0.6 },
  { prefix: 'gpt-4o', prompt: 2.5, completion: 10.0 },
  { prefix: 'claude-3-5-sonnet', prompt: 3.0, completion: 15.0 },
  { prefix: 'claude-3-5-haiku', prompt: 0.8, completion: 4.0 },
]

export function calculateCost(
  model: string,
  promptTokens: number,
  completionTokens: number
): number {
  const target = model.toLowerCase()
  const matched = PRICING.find((p) => target.includes(p.prefix))
  const rates = matched || { prompt: 2.5, completion: 10.0 }

  const promptCost = (promptTokens / 1_000_000) * rates.prompt
  const completionCost = (completionTokens / 1_000_000) * rates.completion

  return Number((promptCost + completionCost).toFixed(6))
}
