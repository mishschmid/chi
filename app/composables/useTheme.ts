import { ref, watch, onMounted } from 'vue'

export type AppTheme = 'light' | 'dark' | 'system'

const theme = ref<AppTheme>('light')
const orangeStartScreen = ref<boolean>(true)
const voiceInput = ref<boolean>(true)
const sendAfterPause = ref<boolean>(false)
const showTokenCost = ref<boolean>(true)

export function useTheme() {
  function applyTheme(val: AppTheme) {
    if (typeof document === 'undefined') return
    const root = document.documentElement
    if (val === 'system') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      root.setAttribute('data-theme', isDark ? 'dark' : 'light')
    } else {
      root.setAttribute('data-theme', val)
    }
  }

  function setTheme(newTheme: AppTheme) {
    theme.value = newTheme
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('chi_theme', newTheme)
    }
    applyTheme(newTheme)
  }

  function setOrangeStartScreen(val: boolean) {
    orangeStartScreen.value = val
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('chi_orange_start_screen', val ? '1' : '0')
    }
  }

  function setVoiceInput(val: boolean) {
    voiceInput.value = val
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('chi_voice_input', val ? '1' : '0')
    }
  }

  function setSendAfterPause(val: boolean) {
    sendAfterPause.value = val
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('chi_send_after_pause', val ? '1' : '0')
    }
  }

  function setShowTokenCost(val: boolean) {
    showTokenCost.value = val
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('chi_show_token_cost', val ? '1' : '0')
    }
  }

  onMounted(() => {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem('chi_theme') as AppTheme | null
      if (stored && ['light', 'dark', 'system'].includes(stored)) {
        theme.value = stored
      } else {
        theme.value = 'light'
      }

      const storedOrange = localStorage.getItem('chi_orange_start_screen')
      if (storedOrange !== null) {
        orangeStartScreen.value = storedOrange === '1'
      }

      const storedVoice = localStorage.getItem('chi_voice_input')
      if (storedVoice !== null) {
        voiceInput.value = storedVoice === '1'
      }

      const storedPause = localStorage.getItem('chi_send_after_pause')
      if (storedPause !== null) {
        sendAfterPause.value = storedPause === '1'
      }

      const storedMeta = localStorage.getItem('chi_show_token_cost')
      if (storedMeta !== null) {
        showTokenCost.value = storedMeta === '1'
      }
    }
    applyTheme(theme.value)

    if (typeof window !== 'undefined') {
      const media = window.matchMedia('(prefers-color-scheme: dark)')
      media.addEventListener('change', () => {
        if (theme.value === 'system') {
          applyTheme('system')
        }
      })
    }
  })

  return {
    theme,
    orangeStartScreen,
    voiceInput,
    sendAfterPause,
    showTokenCost,
    setTheme,
    setOrangeStartScreen,
    setVoiceInput,
    setSendAfterPause,
    setShowTokenCost,
  }
}
