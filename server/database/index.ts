import { Pool } from 'pg'
import { drizzle } from 'drizzle-orm/node-postgres'
import * as schema from './schema'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL ?? 'postgresql://cima:cima@localhost:5434/cima',
})

export const db = drizzle(pool, { schema })
