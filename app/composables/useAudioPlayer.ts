export function useAudioPlayer() {
  const isPlaying = ref(false)
  const isSynthesizing = ref(false)
  const error = ref<string | null>(null)

  let currentAudio: HTMLAudioElement | null = null

  async function speak(text: string): Promise<void> {
    const clean = text.trim()
    if (!clean) return

    stop()
    isSynthesizing.value = true
    error.value = null

    try {
      const response = await fetch('/api/voice/synthesize', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ text: clean }),
      })

      if (!response.ok) {
        throw new Error(`Synthesis failed: ${response.statusText}`)
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)

      currentAudio = new Audio(url)
      isPlaying.value = true

      currentAudio.onended = () => {
        isPlaying.value = false
        URL.revokeObjectURL(url)
        currentAudio = null
      }

      currentAudio.onerror = () => {
        isPlaying.value = false
        URL.revokeObjectURL(url)
        currentAudio = null
        error.value = 'Failed to play synthesized audio.'
      }

      await currentAudio.play()
    } catch (err: any) {
      error.value = err?.message || 'Audio playback error'
      isPlaying.value = false
    } finally {
      isSynthesizing.value = false
    }
  }

  function stop() {
    if (currentAudio) {
      currentAudio.pause()
      currentAudio.currentTime = 0
      currentAudio = null
    }
    isPlaying.value = false
  }

  return {
    isPlaying,
    isSynthesizing,
    error,
    speak,
    stop,
  }
}
