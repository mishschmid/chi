export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const apiKey = (config.openaiApiKey as string | undefined) ?? ''
  if (!apiKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Missing OPENAI_API_KEY for audio transcription',
    })
  }

  const form = await readMultipartFormData(event)
  if (!form || form.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'No audio file provided' })
  }

  const audioPart = form.find((part) => part.name === 'file' || part.name === 'audio')
  if (!audioPart || !audioPart.data || audioPart.data.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Audio payload is empty' })
  }

  try {
    const filename = audioPart.filename || 'recording.webm'
    const mimeType = audioPart.type || 'audio/webm'

    const formData = new FormData()
    formData.append('model', 'whisper-1')
    const uint8 = new Uint8Array(audioPart.data)
    formData.append('file', new Blob([uint8], { type: mimeType }), filename)

    const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: formData,
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error('Whisper API error:', res.status, errText)
      throw createError({
        statusCode: res.status,
        statusMessage: `Whisper error: ${errText}`,
      })
    }

    const data = (await res.json()) as { text: string }
    return { text: data.text }
  } catch (err: any) {
    console.error('Audio transcription error:', err)
    throw createError({
      statusCode: err?.statusCode || 500,
      statusMessage: err?.statusMessage || err?.message || 'Failed to transcribe audio',
    })
  }
})
