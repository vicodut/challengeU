import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import boundaries from 'eslint-plugin-boundaries';
import tseslint from 'typescript-eslint';

const rootDir = dirname(fileURLToPath(import.meta.url));

// Layers of a backend module (apps/api/src/modules/<name>/<layer>).
const layers = ['domain', 'application', 'infrastructure', 'controllers'];

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.turbo/**',
      '**/drizzle/**',
      'apps/web/src/api/generated/**',
      '**/*.config.{js,mjs,mts,ts}',
      'scripts/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: rootDir },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      // Nest modules are intentionally empty decorated classes.
      '@typescript-eslint/no-extraneous-class': ['error', { allowWithDecorator: true }],
      // Flags plain option objects passed where a framework class type is declared (Nest).
      '@typescript-eslint/no-unsafe-class-instance-assignment': 'off',
    },
  },

  // ---- API: module boundaries -------------------------------------------------------------
  {
    files: ['apps/api/src/**/*.ts'],
    plugins: { boundaries },
    settings: {
      'import/resolver': { node: { extensions: ['.ts', '.tsx', '.js', '.mjs', '.json'] } },
      'boundaries/elements': [
        // Layers of a module (src/modules/<module>/<layer>). A module's index.ts sits outside
        // every layer folder and is therefore the "api-module" element: its public surface.
        ...layers.map((layer) => ({
          type: `api-${layer}`,
          pattern: `src/modules/*/${layer}`,
          capture: ['module'],
        })),
        { type: 'api-module', pattern: 'src/modules/*', capture: ['module'] },
        { type: 'api-shared', pattern: 'src/shared' },
        { type: 'api-other', pattern: 'src/*' },
      ],
    },
    rules: {
      'boundaries/element-types': [
        'error',
        {
          default: 'allow',
          rules: [
            // Modules are reached only through their index.ts (ports and events): importing
            // any layer folder of ANOTHER module is forbidden.
            ...layers.map((from) => ({
              from: [`api-${from}`],
              disallow: layers.map((to) => [`api-${to}`, { module: '!${from.module}' }]),
              message: 'Import other modules only through their public index.ts',
            })),
            // Domain is pure: it may only import from itself.
            {
              from: ['api-domain'],
              disallow: ['api-application', 'api-infrastructure', 'api-controllers'],
              message: 'The domain layer must not depend on other layers',
            },
            // Application depends on ports, not on adapters or HTTP.
            {
              from: ['api-application'],
              disallow: ['api-infrastructure', 'api-controllers'],
              message: 'The application layer depends on ports, not on adapters or controllers',
            },
          ],
        },
      ],
    },
  },
  // Domain code must be framework- and ORM-free.
  {
    files: ['apps/api/src/modules/*/domain/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@nestjs/*', 'drizzle-orm', 'drizzle-orm/*', 'pg'],
              message: 'The domain layer must not import Nest, Drizzle or pg.',
            },
          ],
        },
      ],
    },
  },

  // ---- Web: feature isolation -------------------------------------------------------------
  {
    files: ['apps/web/src/**/*.{ts,tsx}'],
    plugins: { boundaries },
    settings: {
      'import/resolver': { node: { extensions: ['.ts', '.tsx', '.js', '.mjs', '.json'] } },
      'boundaries/elements': [
        { type: 'web-feature', pattern: 'src/features/*', capture: ['feature'] },
        { type: 'web-shared', pattern: 'src/shared' },
        { type: 'web-generated', pattern: 'src/api' },
        { type: 'web-app', pattern: 'src/app' },
        { type: 'web-entry', pattern: 'src/*.{ts,tsx}', mode: 'file' },
      ],
    },
    rules: {
      // Other code reaches a feature only through its index.ts.
      'boundaries/entry-point': [
        'error',
        { default: 'disallow', rules: [{ target: ['web-feature'], allow: 'index.ts' }] },
      ],
      'boundaries/element-types': [
        'error',
        {
          default: 'allow',
          rules: [
            {
              from: ['web-feature'],
              // A feature may import shared, generated api and itself, never another feature.
              disallow: [['web-feature', { feature: '!${from.feature}' }], 'web-app'],
              message:
                'Features are isolated: import only shared/, the generated client or this feature',
            },
            {
              from: ['web-shared'],
              disallow: ['web-feature', 'web-app'],
              message: 'shared/ must not depend on features or the app shell',
            },
          ],
        },
      ],
    },
  },
  // The import resolver cannot follow the "@/" alias, so guard it with plain patterns.
  {
    files: ['apps/web/src/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/features/*/*'],
              message: "Import a feature only through its public index ('@/features/<name>').",
            },
          ],
        },
      ],
    },
  },
  {
    files: ['apps/web/src/features/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/features/*', '@/features/*/*', '@/app/*'],
              message: 'Features are isolated: no imports from other features or the app shell.',
            },
          ],
        },
      ],
    },
  },
);
