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
        { name: 'theme-color', content: '#ECECEA' },
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'icon', type: 'image/png', sizes: '192x192', href: '/icon-192.png' },
        { rel: 'icon', type: 'image/png', sizes: '512x512', href: '/icon-512.png' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
        { rel: 'manifest', href: '/manifest.webmanifest' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@300;400;500;600&family=Geist+Mono:wght@400;500&display=swap',
        },
      ],
    },
  },

  css: ['~/assets/styles/global.scss'],

  runtimeConfig: {
    databaseUrl: process.env.DATABASE_URL ?? 'postgresql://chi:chi@localhost:5434/chi',
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
