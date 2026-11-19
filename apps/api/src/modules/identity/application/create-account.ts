import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { UsernameTakenError } from '../domain/errors';
import type { Role } from '../domain/role';
import { createUser } from '../domain/user';
import {
  PASSWORD_HASHER,
  USER_REPOSITORY,
  type PasswordHasher,
  type UserRepository,
} from './ports';

export interface CreateAccountInput {
  username: string;
  password: string;
  displayName: string;
  timeZone: string;
  role: Role;
}

/** The account-creation port other modules (and the seed) use to create users. */
@Injectable()
export class CreateAccount {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasher,
  ) {}

  /** Returns the new user's id. Throws `UsernameTakenError` or `InvalidTimeZoneError`. */
  async execute(input: CreateAccountInput): Promise<string> {
    if (await this.users.findByUsername(input.username)) {
      throw new UsernameTakenError(input.username);
    }
    const user = createUser({
      id: randomUUID(),
      username: input.username,
      passwordHash: await this.hasher.hash(input.password),
      displayName: input.displayName,
      timeZone: input.timeZone,
      role: input.role,
    });
    await this.users.add(user);
    return user.id;
  }
}
