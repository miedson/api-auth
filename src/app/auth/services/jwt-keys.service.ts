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

const normalizePem = (value: string | undefined) =>
  value?.replace(/\\n/g, '\n').trim()

const requireEnv = (name: 'JWT_PRIVATE_KEY' | 'JWT_PUBLIC_KEY'): string => {
  const value = normalizePem(process.env[name])
  if (!value) {
    throw new Error('JWT_PRIVATE_KEY and JWT_PUBLIC_KEY are required for RS256')
  }
  return value
}

const privateKey = requireEnv('JWT_PRIVATE_KEY')
const publicKey = requireEnv('JWT_PUBLIC_KEY')

const keyId = process.env.JWT_KID ?? 'api-auth-rs256-1'
const issuer =
  process.env.JWT_ISSUER ??
  process.env.AUTH_API_URL ??
  `http://${process.env.APP_HOST}:${process.env.APP_PORT}`

const publicJwk = createPublicKey(publicKey).export({ format: 'jwk' }) as JsonWebKey

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
