import { Inject, Injectable } from '@nestjs/common';
import { InvalidCredentialsError } from '../domain/errors';
import type { AuthenticatedUser } from './authenticated-user';
import {
  PASSWORD_HASHER,
  USER_REPOSITORY,
  type PasswordHasher,
  type UserRepository,
} from './ports';

@Injectable()
export class AuthenticateUser {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasher,
  ) {}

  async execute(username: string, password: string): Promise<AuthenticatedUser> {
    const user = await this.users.findByUsername(username);
    if (!user) {
      // Spend comparable time as a real check so response time does not reveal usernames.
      await this.hasher.hash(password);
      throw new InvalidCredentialsError();
    }
    if (!(await this.hasher.verify(user.passwordHash, password))) {
      throw new InvalidCredentialsError();
    }
    return { userId: user.id, role: user.role };
  }
}
