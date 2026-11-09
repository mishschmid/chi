import { existsSync } from 'node:fs'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { db } from '../database'

export default defineNitroPlugin(async () => {
  if (existsSync('./drizzle')) {
    try {
      await migrate(db, { migrationsFolder: './drizzle' })
      console.log('[db] Migrations applied successfully at boot')
    } catch (err) {
      console.error('[db] Boot migration failed:', err)
    }
  }
})
