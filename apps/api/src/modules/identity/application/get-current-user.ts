import { Inject, Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { UserNotFoundError } from '../domain/errors';
import type { Role } from '../domain/role';
import {
  STUDENT_STATUS_LOOKUP,
  USER_REPOSITORY,
  type StudentStatusLookup,
  type UserRepository,
} from './ports';

export interface CurrentUserProfile {
  userId: string;
  username: string;
  displayName: string;
  role: Role;
  timeZone: string;
  /** Students only. */
  studentStatus?: 'active' | 'suspended';
}

@Injectable()
export class GetCurrentUser {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    private readonly moduleRef: ModuleRef,
  ) {}

  async execute(userId: string): Promise<CurrentUserProfile> {
    const user = await this.users.findById(userId);
    if (!user) throw new UserNotFoundError();
    // Resolved lazily across modules: enrollment depends on identity, so identity cannot import it.
    const studentStatus =
      user.role === 'student'
        ? await this.moduleRef
            .get<StudentStatusLookup>(STUDENT_STATUS_LOOKUP, { strict: false })
            .statusOf(user.id)
        : null;
    return {
      userId: user.id,
      username: user.username,
      displayName: user.displayName,
      role: user.role,
      timeZone: user.timeZone,
      ...(studentStatus && { studentStatus }),
    };
  }
}
