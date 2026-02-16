import bcrypt from 'bcrypt'
import type { PasswordHasher } from '@/app/common/interfaces/password-hasher'

const SALT_ROUNDS = 12
const PEPPER = process.env.PASSWORD_PEPPER ?? ''

export class BcryptPasswordHasher implements PasswordHasher {
  hash(password: string): Promise<string> {
    return bcrypt.hash(password + PEPPER, SALT_ROUNDS)
  }
  compare(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password + PEPPER, hash)
  }
}
