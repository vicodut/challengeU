import { SetMetadata } from '@nestjs/common';
import { DOCS_JSON_PATH, DOCS_PATH } from '../docs/docs-paths';

export const IS_PUBLIC_KEY = 'isPublic';

/** Marks a route as reachable without credentials (health, docs). */
export const Public = (): MethodDecorator & ClassDecorator => SetMetadata(IS_PUBLIC_KEY, true);

/**
 * Routes that are public without a decorator (they are not Nest controllers). The global auth
 * guard must let these through, alongside handlers marked with `@Public()`.
 */
export const PUBLIC_PATHS: readonly string[] = [`/${DOCS_PATH}`, `/${DOCS_JSON_PATH}`];
