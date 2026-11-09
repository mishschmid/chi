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

  const cleanText = text.slice(0, 4000)
  const voice =
    typeof body?.voice === 'string' && body.voice
      ? body.voice
      : (config.openaiVoice as string) || 'nova'
  const model = (config.openaiTtsModel as string) || 'tts-1'

  try {
    const res = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        voice,
        input: cleanText,
        response_format: 'mp3',
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error('TTS API error:', res.status, errText)
      throw createError({
        statusCode: res.status,
        statusMessage: `TTS error: ${errText}`,
      })
    }

    setHeader(event, 'content-type', 'audio/mpeg')
    setHeader(event, 'cache-control', 'no-cache')

    const arrayBuffer = await res.arrayBuffer()
    return Buffer.from(arrayBuffer)
  } catch (err: any) {
    console.error('Speech synthesis error:', err)
    throw createError({
      statusCode: err?.statusCode || 500,
      statusMessage: err?.statusMessage || err?.message || 'Failed to synthesize speech',
    })
  }
})
