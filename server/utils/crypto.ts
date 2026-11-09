import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto'

const VERSION = 'v1'
const ALGORITHM = 'aes-256-gcm'
const IV_BYTES = 12
const TAG_BYTES = 16

let cachedKey: Buffer | null = null

function getKey(): Buffer {
  if (cachedKey) return cachedKey
  const secret = process.env.ENCRYPTION_KEY || process.env.BETTER_AUTH_SECRET
  if (!secret) {
    throw new Error(
      'ENCRYPTION_KEY (or BETTER_AUTH_SECRET fallback) is not configured — cannot encrypt/decrypt secrets'
    )
  }
  cachedKey = createHash('sha256').update(secret).digest()
  return cachedKey
}

export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(IV_BYTES)
  const cipher = createCipheriv(ALGORITHM, getKey(), iv)
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${VERSION}:${iv.toString('hex')}:${tag.toString('hex')}:${enc.toString('hex')}`
}

export function decryptSecret(payload: string): string {
  const parts = payload.split(':')
  if (parts.length !== 4 || parts[0] !== VERSION) {
    throw new Error('Invalid encrypted payload')
  }
  const [, ivHex, tagHex, cipherHex] = parts
  if (!ivHex || !tagHex || !cipherHex) {
    throw new Error('Invalid encrypted payload')
  }
  const iv = Buffer.from(ivHex, 'hex')
  const tag = Buffer.from(tagHex, 'hex')
  const enc = Buffer.from(cipherHex, 'hex')
  if (iv.length !== IV_BYTES || tag.length !== TAG_BYTES) {
    throw new Error('Invalid IV/tag length')
  }
  const decipher = createDecipheriv(ALGORITHM, getKey(), iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8')
}

export function maskSecret(plaintext: string): string {
  if (plaintext.length <= 6) return '…'
  const tail = plaintext.slice(-4)
  const prefix = plaintext.slice(0, 3)
  return `${prefix}…${tail}`
}
