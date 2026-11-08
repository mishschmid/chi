import type { ProfileFact } from '../../database/schema'

export function buildSystemPrompt(facts: ProfileFact[] = []): string {
  const parts: string[] = [
    `You are Chi, a warm, thoughtful, curious AI companion and personal friend.
You talk naturally and concisely. You avoid generic, robotic boilerplate.
Always respond in the primary language the user is speaking (DE, FR, IT, EN, etc.).
Your goal is to understand the user deeply over time, support their life, and be a steady, trusted sounding board.`,
  ]

  if (facts.length > 0) {
    const factsList = facts.map((f) => `- [${f.category}] ${f.fact}`).join('\n')
    parts.push(`What you know about the user:\n${factsList}`)
  }

  return parts.join('\n\n')
}
