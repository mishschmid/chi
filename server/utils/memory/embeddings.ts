import { getOpenAiKeyForUser } from '../aiKeys'

export async function generateEmbedding(text: string, userId?: string): Promise<number[] | null> {
  const clean = text.trim()
  if (!clean) return null

  try {
    const apiKey = await getOpenAiKeyForUser(userId || '')

    const res = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: clean,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.warn('Embedding API failed:', res.status, err)
      return null
    }

    const data = (await res.json()) as {
      data: Array<{ embedding: number[] }>
    }

    return data.data[0]?.embedding || null
  } catch (err) {
    console.warn('Failed to generate embedding:', err)
    return null
  }
}
