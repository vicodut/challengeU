import type { Role } from '../domain/role';

/** What the auth guard resolves from the credentials and attaches to the request. */
export interface AuthenticatedUser {
  userId: string;
  role: Role;
}
