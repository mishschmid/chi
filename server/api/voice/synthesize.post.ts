import OpenAI from 'openai'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const apiKey = (config.openaiApiKey as string | undefined) ?? ''
  if (!apiKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Missing OPENAI_API_KEY for speech synthesis',
    })
  }

  const body = await readBody<{ text?: unknown; voice?: unknown }>(event)
  const text = typeof body?.text === 'string' ? body.text.trim() : ''

  if (!text) {
    throw createError({ statusCode: 400, statusMessage: 'Text content is required' })
  }

  // Cap length to avoid excessive billing and latency
  const cleanText = text.slice(0, 4000)

  const voice =
    typeof body?.voice === 'string' && body.voice
      ? body.voice
      : (config.openaiVoice as string) || 'nova'

  const model = (config.openaiTtsModel as string) || 'tts-1'

  const client = new OpenAI({ apiKey, fetch: globalThis.fetch })

  try {
    const response = await client.audio.speech.create({
      model,
      voice: voice as any,
      input: cleanText,
      response_format: 'mp3',
    })

    setHeader(event, 'content-type', 'audio/mpeg')
    setHeader(event, 'cache-control', 'no-cache')

    const arrayBuffer = await response.arrayBuffer()
    return Buffer.from(arrayBuffer)
  } catch (err: any) {
    console.error('Speech synthesis error:', err)
    throw createError({
      statusCode: 500,
      statusMessage: err?.message || 'Failed to synthesize speech',
    })
  }
})
