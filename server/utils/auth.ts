import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from '../database'
import * as schema from '../database/schema'

const betterAuthUrl = process.env.BETTER_AUTH_URL ?? 'http://localhost:3000'
const betterAuthSecret =
  process.env.BETTER_AUTH_SECRET ?? 'chi-dev-secret-key-replace-in-production-min-32-chars'

const trustedOrigins = [
  betterAuthUrl,
  ...(process.env.NODE_ENV === 'production' ? [] : ['http://localhost:*', 'http://127.0.0.1:*']),
].filter(Boolean)

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'pg', schema }),
  baseURL: betterAuthUrl,
  secret: betterAuthSecret,
  trustedOrigins,
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 8,
    disableSignUp: false, // In Chi, users can sign up
    resetPasswordTokenExpiresIn: 60 * 60 * 24,
    sendResetPassword: async ({ url }) => {
      console.log(`[auth] password reset link: ${url}`)
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  rateLimit: {
    enabled: true,
  },
  user: {
    changeEmail: {
      enabled: true,
      updateEmailWithoutVerification: true,
    },
    deleteUser: {
      enabled: true,
    },
  },
})

export type Auth = typeof auth
