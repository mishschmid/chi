export function useAudioRecorder() {
  const isRecording = ref(false)
  const isTranscribing = ref(false)
  const error = ref<string | null>(null)

  let mediaRecorder: MediaRecorder | null = null
  let audioChunks: Blob[] = []

  async function startRecording(): Promise<boolean> {
    error.value = null
    audioChunks = []

    if (!navigator?.mediaDevices?.getUserMedia) {
      error.value = 'Audio recording is not supported on this device/browser.'
      return false
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorder = new MediaRecorder(stream)

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunks.push(event.data)
        }
      }

      mediaRecorder.start(100)
      isRecording.value = true
      return true
    } catch (err: any) {
      error.value =
        err.name === 'NotAllowedError'
          ? 'Microphone permission was denied.'
          : 'Could not start audio recording.'
      isRecording.value = false
      return false
    }
  }

  async function stopRecording(): Promise<string | null> {
    if (!mediaRecorder || !isRecording.value) return null

    return new Promise((resolve) => {
      mediaRecorder!.onstop = async () => {
        // Stop all active microphone audio tracks
        mediaRecorder?.stream?.getTracks().forEach((track) => track.stop())
        isRecording.value = false

        if (audioChunks.length === 0) {
          resolve(null)
          return
        }

        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' })
        isTranscribing.value = true
        error.value = null

        try {
          const formData = new FormData()
          formData.append('file', audioBlob, 'speech.webm')

          const response = await $fetch<{ text: string }>('/api/voice/transcribe', {
            method: 'POST',
            body: formData,
          })

          resolve(response.text?.trim() || null)
        } catch (err: any) {
          error.value = err?.statusMessage || 'Transcription failed'
          resolve(null)
        } finally {
          isTranscribing.value = false
        }
      }

      mediaRecorder!.stop()
    })
  }

  function cancelRecording() {
    if (mediaRecorder && isRecording.value) {
      mediaRecorder.onstop = null
      mediaRecorder.stream?.getTracks().forEach((track) => track.stop())
      mediaRecorder.stop()
      isRecording.value = false
      audioChunks = []
    }
  }

  return {
    isRecording,
    isTranscribing,
    error,
    startRecording,
    stopRecording,
    cancelRecording,
  }
}
