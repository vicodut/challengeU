import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import boundaries from 'eslint-plugin-boundaries';
import tseslint from 'typescript-eslint';

const rootDir = dirname(fileURLToPath(import.meta.url));

// Layers of a backend module (apps/api/src/modules/<name>/<layer>).
const layers = ['domain', 'application', 'infrastructure', 'controllers'];

// Web feature folder -> the Orval tag module it owns (src/api/generated/endpoints/<tag>).
// A feature without an entry may not use any generated endpoint module.
const featureTags = { ops: 'ops', identity: 'identity', enrollment: 'enrollment' };

function webFeatureIsolation() {
  const isolation = (ownTag) => ({
    patterns: [
      {
        group: ['@/features', '@/features/*', '@/features/*/*', '@/app', '@/app/*'],
        message: 'Features are isolated: no imports from other features or the app shell.',
      },
      {
        group: [
          '@/api/generated/endpoints/*',
          '@/api/generated/endpoints/*/*',
          ...(ownTag
            ? [`!@/api/generated/endpoints/${ownTag}`, `!@/api/generated/endpoints/${ownTag}/*`]
            : []),
        ],
        message: "A feature may use only its own tag's generated client module.",
      },
    ],
  });
  return [
    {
      files: ['apps/web/src/features/**/*.{ts,tsx}'],
      rules: { 'no-restricted-imports': ['error', isolation(undefined)] },
    },
    ...Object.entries(featureTags).map(([feature, tag]) => ({
      files: [`apps/web/src/features/${feature}/**/*.{ts,tsx}`],
      rules: { 'no-restricted-imports': ['error', isolation(tag)] },
    })),
  ];
}

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
        { type: 'api-root', pattern: 'src/*.ts', mode: 'file' },
      ],
    },
    rules: {
      // Another module's root is reachable only through its index.ts (ports and events).
      'boundaries/entry-point': [
        'error',
        {
          default: 'allow',
          rules: [{ target: ['api-module'], allow: ['index.ts'], disallow: '!index.ts' }],
        },
      ],
      'boundaries/element-types': [
        'error',
        {
          default: 'allow',
          rules: [
            // A module's own files may not reach into ANOTHER module's layers.
            ...[...layers.map((layer) => `api-${layer}`), 'api-module'].map((from) => ({
              from: [from],
              disallow: layers.map((to) => [`api-${to}`, { module: '!${from.module}' }]),
              message: 'Import other modules only through their public index.ts',
            })),
            // Code outside modules (shared, app shell, tools) may not reach into any layer.
            {
              from: ['api-shared', 'api-other', 'api-root'],
              disallow: layers.map((to) => `api-${to}`),
              message: 'Import modules only through their public index.ts',
            },
            // Domain is pure: only itself. No other layers, no shared/ (Clock etc.), no app code;
            // functions receive `now: Date` as an argument.
            {
              from: ['api-domain'],
              disallow: [
                'api-application',
                'api-infrastructure',
                'api-controllers',
                'api-shared',
                'api-other',
                'api-root',
              ],
              message: 'The domain layer must stay pure: no other layers and no shared/',
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
  // Anyone may import a feature only through its public index.
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
  // Features are isolated from other features and from the app shell, and each may use only
  // its own generated client tag module (feature folder -> OpenAPI tag).
  ...webFeatureIsolation(),
  // shared/ sits below features and the app shell.
  {
    files: ['apps/web/src/shared/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/features', '@/features/*', '@/features/*/*', '@/app', '@/app/*'],
              message: 'shared/ must not depend on features or the app shell.',
            },
          ],
        },
      ],
    },
  },
);
