import type { TokenHasher } from '@/app/common/interfaces/token-hasher'
import crypto from 'node:crypto'

export class Sha256TokenHasherAdapater implements TokenHasher {
  hash(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex')
  }
}
