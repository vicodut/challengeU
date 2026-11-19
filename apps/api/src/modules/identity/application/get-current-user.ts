import { Inject, Injectable } from '@nestjs/common';
import { UserNotFoundError } from '../domain/errors';
import type { Role } from '../domain/role';
import { USER_REPOSITORY, type UserRepository } from './ports';

export interface CurrentUserProfile {
  userId: string;
  username: string;
  displayName: string;
  role: Role;
  timeZone: string;
}

@Injectable()
export class GetCurrentUser {
  constructor(@Inject(USER_REPOSITORY) private readonly users: UserRepository) {}

  async execute(userId: string): Promise<CurrentUserProfile> {
    const user = await this.users.findById(userId);
    if (!user) throw new UserNotFoundError();
    return {
      userId: user.id,
      username: user.username,
      displayName: user.displayName,
      role: user.role,
      timeZone: user.timeZone,
    };
  }
}
