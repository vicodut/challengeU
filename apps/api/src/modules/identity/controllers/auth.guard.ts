import { type CanActivate, type ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { IS_PUBLIC_KEY, PUBLIC_PATHS } from '../../../shared/auth/public.decorator';
import { AuthenticateUser } from '../application/authenticate-user';
import type { AuthenticatedUser } from '../application/authenticated-user';
import { InvalidCredentialsError, RoleForbiddenError } from '../domain/errors';
import type { Role } from '../domain/role';
import { parseBasicAuthorization } from './basic-credentials';
import { ROLES_KEY } from './roles.decorator';

export type AuthenticatedRequest = Request & { user?: AuthenticatedUser };

/** Global guard: HTTP Basic auth for every route except `@Public()` ones and PUBLIC_PATHS. */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authenticate: AuthenticateUser,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const targets = [context.getHandler(), context.getClass()];
    if (this.reflector.getAllAndOverride<boolean | undefined>(IS_PUBLIC_KEY, targets)) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (PUBLIC_PATHS.includes(request.path)) return true;

    const credentials = parseBasicAuthorization(request.headers.authorization);
    if (!credentials) throw new InvalidCredentialsError();
    const user = await this.authenticate.execute(credentials.username, credentials.password);

    const roles = this.reflector.getAllAndOverride<Role[] | undefined>(ROLES_KEY, targets);
    if (roles && !roles.includes(user.role)) throw new RoleForbiddenError();

    request.user = user;
    return true;
  }
}
