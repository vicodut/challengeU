import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { AuthenticatedUser } from '../application/authenticated-user';
import { InvalidCredentialsError } from '../domain/errors';
import type { AuthenticatedRequest } from './auth.guard';

/** The caller resolved by the auth guard. Only valid on non-public routes. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedUser => {
    const { user } = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!user) throw new InvalidCredentialsError();
    return user;
  },
);
