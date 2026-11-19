import { SetMetadata } from '@nestjs/common';
import type { Role } from '../domain/role';

export const ROLES_KEY = 'roles';

/** Restricts a controller or handler to the given roles; others get 403. */
export const Roles = (...roles: Role[]): MethodDecorator & ClassDecorator =>
  SetMetadata(ROLES_KEY, roles);
