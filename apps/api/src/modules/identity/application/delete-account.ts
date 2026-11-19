import { Inject, Injectable } from '@nestjs/common';
import { USER_REPOSITORY, type UserRepository } from './ports';

/** Compensation port: lets another module undo a `CreateAccount` when its own step fails. */
@Injectable()
export class DeleteAccount {
  constructor(@Inject(USER_REPOSITORY) private readonly users: UserRepository) {}

  execute(userId: string): Promise<void> {
    return this.users.remove(userId);
  }
}
