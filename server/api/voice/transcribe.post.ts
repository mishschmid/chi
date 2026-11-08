import OpenAI, { toFile } from 'openai'

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

  const client = new OpenAI({ apiKey, fetch: globalThis.fetch })

  try {
    const filename = audioPart.filename || 'recording.webm'
    const mimeType = audioPart.type || 'audio/webm'

    const file = await toFile(audioPart.data, filename, { type: mimeType })

    const transcription = await client.audio.transcriptions.create({
      file,
      model: 'whisper-1',
    })

    return { text: transcription.text }
  } catch (err: any) {
    console.error('Audio transcription error:', err)
    throw createError({
      statusCode: 500,
      statusMessage: err?.message || 'Failed to transcribe audio',
    })
  }
})
