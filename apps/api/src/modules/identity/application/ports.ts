import type { User } from '../domain/user';

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  /** Inserts the user and its one-to-one role row atomically. Throws `UsernameTakenError`. */
  add(user: User): Promise<void>;
}

export interface PasswordHasher {
  hash(plain: string): Promise<string>;
  verify(hash: string, plain: string): Promise<boolean>;
}

export const USER_REPOSITORY = Symbol('UserRepository');
export const PASSWORD_HASHER = Symbol('PasswordHasher');
