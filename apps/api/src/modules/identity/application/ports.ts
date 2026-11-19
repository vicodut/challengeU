import type { Role } from '../domain/role';
import type { User } from '../domain/user';

/** What other modules may know about a user: no credentials. */
export interface Profile {
  id: string;
  displayName: string;
  timeZone: string;
  role: Role;
}

/** Read-only profile lookups for other modules (they reference users by ID only). */
export interface ProfileDirectory {
  findByIds(ids: string[]): Promise<Profile[]>;
  listCoaches(): Promise<Profile[]>;
}

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  /** Inserts the user and its one-to-one role row atomically. Throws `UsernameTakenError`. */
  add(user: User): Promise<void>;
  /** Removes the user and its role row; a no-op when the user does not exist. */
  remove(id: string): Promise<void>;
}

export interface PasswordHasher {
  hash(plain: string): Promise<string>;
  verify(hash: string, plain: string): Promise<boolean>;
}

export const USER_REPOSITORY = Symbol('UserRepository');
export const PASSWORD_HASHER = Symbol('PasswordHasher');
export const PROFILE_DIRECTORY = Symbol('ProfileDirectory');
