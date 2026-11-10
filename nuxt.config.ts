// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2026-03-14',
  future: { compatibilityVersion: 4 },
  devtools: { enabled: true },

  app: {
    head: {
      title: 'Chi',
      meta: [
        {
          name: 'viewport',
          content: 'width=device-width, initial-scale=1, interactive-widget=resizes-content',
        },
        { name: 'theme-color', content: '#12100e' },
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Young+Serif&family=Geist+Mono:wght@400;500&display=swap',
        },
      ],
    },
  },

  css: ['~/assets/styles/global.scss'],

  runtimeConfig: {
    databaseUrl: process.env.DATABASE_URL ?? 'postgresql://chi:chi@localhost:5433/chi',
    devUserId: process.env.DEV_USER_ID ?? '00000000-0000-0000-0000-000000000001',
    llmProvider: process.env.LLM_PROVIDER ?? 'openai',
    llmChatModel: process.env.LLM_CHAT_MODEL ?? 'gpt-4o',
    llmExtractionModel: process.env.LLM_EXTRACTION_MODEL ?? 'gpt-4o-mini',
    betterAuthSecret: process.env.BETTER_AUTH_SECRET ?? '',
    betterAuthUrl: process.env.BETTER_AUTH_URL ?? 'http://localhost:3000',
    public: {
      betterAuthUrl: process.env.BETTER_AUTH_URL ?? 'http://localhost:3000',
    },
    openaiApiKey: process.env.OPENAI_API_KEY ?? '',
    anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? '',
    openaiVoice: process.env.OPENAI_VOICE ?? 'nova',
    openaiTtsModel: process.env.OPENAI_TTS_MODEL ?? 'tts-1',
    sansaApiUrl: process.env.SANSA_API_URL ?? 'http://localhost:4444',
    sansaServiceSecret: process.env.SANSA_SERVICE_SECRET ?? '',
    sansaUserId: process.env.SANSA_USER_ID ?? '',
  },

  routeRules: {
    '/api/**': { cache: false, headers: { 'cache-control': 'no-store' } },
  },

  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: '@use "~/assets/styles/variables" as *;',
        },
      },
    },
  },

  typescript: {
    strict: true,
  },
})
