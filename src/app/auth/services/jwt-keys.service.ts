import { createPublicKey } from 'node:crypto'

type JsonWebKey = {
  kty: string
  n?: string
  e?: string
  x?: string
  y?: string
  crv?: string
  kid?: string
  use?: string
  alg?: string
}

type JwksDocument = {
  keys: JsonWebKey[]
}

const stripWrappingQuotes = (value: string) => {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1)
  }

  return value
}

const normalizeKey = (value: string | undefined): string | undefined => {
  if (!value) {
    return value
  }

  const normalized = stripWrappingQuotes(value)
    .replace(/\\n/g, '\n')
    .replace(/\r\n/g, '\n')
    .trim()

  if (normalized.includes('-----BEGIN')) {
    return normalized
  }

  const maybeBase64 = normalized.replace(/\s+/g, '')
  const isBase64 = /^[A-Za-z0-9+/=]+$/.test(maybeBase64)

  if (!isBase64) {
    return normalized
  }

  try {
    const decoded = Buffer.from(maybeBase64, 'base64').toString('utf8').trim()
    if (decoded.includes('-----BEGIN')) {
      return decoded
    }
  } catch {
    return normalized
  }

  return normalized
}

const toPemBlock = (raw: string, type: 'public' | 'private') => {
  if (raw.includes('-----BEGIN')) {
    return raw
  }

  const compact = raw.replace(/\s+/g, '')
  const chunked = compact.match(/.{1,64}/g)?.join('\n') ?? compact

  if (type === 'public') {
    return `-----BEGIN PUBLIC KEY-----\n${chunked}\n-----END PUBLIC KEY-----`
  }

  return `-----BEGIN PRIVATE KEY-----\n${chunked}\n-----END PRIVATE KEY-----`
}

const requireEnv = (name: 'JWT_PRIVATE_KEY' | 'JWT_PUBLIC_KEY'): string => {
  const value = normalizeKey(process.env[name])
  if (!value) {
    throw new Error('JWT_PRIVATE_KEY and JWT_PUBLIC_KEY are required for RS256')
  }

  return value
}

const privateKey = toPemBlock(requireEnv('JWT_PRIVATE_KEY'), 'private')
const publicKey = toPemBlock(requireEnv('JWT_PUBLIC_KEY'), 'public')

const keyId = process.env.JWT_KID ?? 'api-auth-rs256-1'
const issuer =
  process.env.JWT_ISSUER ??
  process.env.AUTH_API_URL ??
  `http://${process.env.APP_HOST}:${process.env.APP_PORT}`

let publicJwk: JsonWebKey

try {
  publicJwk = createPublicKey(publicKey).export({ format: 'jwk' }) as JsonWebKey
} catch (error) {
  throw new Error(
    `Invalid JWT_PUBLIC_KEY format. Provide a valid PEM public key (or base64 PEM). Details: ${
      (error as Error).message
    }`,
  )
}

publicJwk.kid = keyId
publicJwk.use = 'sig'
publicJwk.alg = 'RS256'

export function getJwtPrivateKey() {
  return privateKey
}

export function getJwtPublicKey() {
  return publicKey
}

export function getJwtIssuer() {
  return issuer
}

export function getJwtKeyId() {
  return keyId
}

export function getJwksDocument(): JwksDocument {
  return {
    keys: [publicJwk],
  }
}
