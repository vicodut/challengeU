// Public surface of the identity module: the only file other modules may import.
export { IdentityModule } from './identity.module';
export { Roles } from './controllers/roles.decorator';
export { CurrentUser } from './controllers/current-user.decorator';
export { CreateAccount, type CreateAccountInput } from './application/create-account';
export type { AuthenticatedUser } from './application/authenticated-user';
export { UsernameTakenError } from './domain/errors';
export { ROLES, type Role } from './domain/role';
