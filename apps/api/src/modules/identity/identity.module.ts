import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthenticateUser } from './application/authenticate-user';
import { CreateAccount } from './application/create-account';
import { DeleteAccount } from './application/delete-account';
import { GetCurrentUser } from './application/get-current-user';
import { PASSWORD_HASHER, PROFILE_DIRECTORY, USER_REPOSITORY } from './application/ports';
import { AuthGuard } from './controllers/auth.guard';
import { CoachesController } from './controllers/coaches.controller';
import { MeController } from './controllers/me.controller';
import { Argon2PasswordHasher } from './infrastructure/argon2-password-hasher';
import { DrizzleProfileDirectory } from './infrastructure/drizzle-profile.directory';
import { DrizzleUserRepository } from './infrastructure/drizzle-user.repository';

@Module({
  controllers: [MeController, CoachesController],
  providers: [
    AuthenticateUser,
    CreateAccount,
    DeleteAccount,
    GetCurrentUser,
    { provide: USER_REPOSITORY, useClass: DrizzleUserRepository },
    { provide: PROFILE_DIRECTORY, useClass: DrizzleProfileDirectory },
    { provide: PASSWORD_HASHER, useClass: Argon2PasswordHasher },
    { provide: APP_GUARD, useClass: AuthGuard },
  ],
  exports: [CreateAccount, DeleteAccount, PROFILE_DIRECTORY],
})
export class IdentityModule {}
