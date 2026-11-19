import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/** Marks a route as reachable without credentials (health, docs). */
export const Public = (): MethodDecorator & ClassDecorator => SetMetadata(IS_PUBLIC_KEY, true);

/** Swagger UI and raw spec paths, served outside the API prefix. */
export const DOCS_PATH = 'docs';
export const DOCS_JSON_PATH = 'docs-json';

/**
 * Routes that are public without a decorator (they are not Nest controllers). The global auth
 * guard must let these through, alongside handlers marked with `@Public()`.
 */
export const PUBLIC_PATHS: readonly string[] = [`/${DOCS_PATH}`, `/${DOCS_JSON_PATH}`];
