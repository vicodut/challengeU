# Lancer ChallengeU en local

## Etat des lieux
Projet build en ~4h.
J'ai pris le choix de générer le projet full avec l'IA (claude code haiku / sonnet / opus).
~1/4 du temps à définir les specs / domain / architecture et le reste du temps à  implementer.
Tous les tickets sont décris dans [les issues](https://github.com/vicodut/challengeU/issues), où sont aussi tracker le RAF.
Chaque PR contiens un diagram mermaid + un screenshot de ce qui a été implementer.
Le choix à été fait de partir sur une architecture hexagonale avec NextJS en backend et React + Shadcn + Tanstack sur le front.

## Prérequis

- **Node 24** (`>=24 <25`). Node 26 fait échouer `pnpm install`. Avec nvm : `nvm use 24`.
- **pnpm 9.15.9** (`packageManager` du `package.json`).
- **Docker** (Docker Desktop ou équivalent) : la base PostgreSQL tourne dans un conteneur.

## Premier lancement

```bash
pnpm install
pnpm dev
```

`pnpm dev` fait, dans l'ordre :

1. crée `.env` au premier lancement, avec des ports et un nom de base propres au dossier ;
2. démarre la base Postgres via `docker compose` ;
3. applique les migrations ;
4. charge les données de démo (seed) ;
5. génère le client web depuis le contrat OpenAPI ;
6. démarre l'API et le web en mode dev.

Les ports sont dans `.env` :

- `WEB_PORT` : l'interface, par exemple `http://localhost:14450`
- `API_PORT` : l'API, par exemple `http://localhost:13450`
- `DB_PORT` : la base

Ouvre `http://localhost:<WEB_PORT>/login`.

## Comptes de démo

Mot de passe : `<identifiant>$123` (par exemple `admin$123`).

| Identifiant | Rôle |
| --- | --- |
| `admin` | admin |
| `coachA`, `coachB` | coach |
| `studentA`, `studentB` | étudiant |

## Tests et qualité

```bash
pnpm test        # API et web (la base de test est créée automatiquement)
pnpm typecheck
pnpm lint
pnpm format:check
```

## Autres commandes

```bash
pnpm db:up       # démarre seulement la base
pnpm db:down     # arrête la base
pnpm openapi     # régénère apps/api/openapi.json
```

## Architecture

Monorepo pnpm + Turborepo, deux applications :

```
apps/
├── api/   NestJS + Drizzle (PostgreSQL)
└── web/   React + Vite + React Router + TanStack Query
```

### Backend (`apps/api`)

Trois modules métier dans `src/modules/` : `identity` (comptes, connexion, profils), `enrollment` (programmes, coachs assignés, étudiants inscrits) et `booking` (plages de disponibilité des coachs).

Chaque module a les mêmes couches :

- `domain/` : règles métier en TypeScript pur (sans Nest ni Drizzle) ;
- `application/` : cas d'usage et ports (interfaces) ;
- `infrastructure/` : implémentations Drizzle des ports, schéma de table ;
- `controllers/` : routes HTTP ;
- `index.ts` : seule API publique du module.

`src/shared/` regroupe le code transverse : `db` (connexion et pool), `clock`, `errors` (erreurs en Problem Details avec un `code` stable), `pagination` (pagination par curseur), `auth` et `config`.

Les migrations sont dans `apps/api/drizzle/` et numérotées dans l'ordre. Le seed (`src/db/seed*.ts`) passe par les vrais cas d'usage.

### API et client web

- La spec OpenAPI est générée depuis le code et versionnée dans `apps/api/openapi.json` (`pnpm openapi`).
- Le client web est généré depuis cette spec par Orval dans `apps/web/src/api/generated/`. Ce dossier est ignoré par git : `pnpm dev` et `pnpm test` le régénèrent.

### Frontend (`apps/web`)

- `src/features/` reprend les modules métier (`identity`, `enrollment`, `availability`, `ops`). Une feature n'importe que `shared/` et son propre client généré.
- `src/app/` est le shell : routes, garde par rôle (`/student`, `/coach`, `/admin`), navigation et fil d'Ariane (défini par `handle.crumb` sur chaque route).
- `src/shared/` contient les composants UI, l'authentification (identifiants en `sessionStorage`), le client HTTP et les textes traduits (`en.json`, `fr.json`).

### Tests

- Tests HTTP de l'API contre la vraie base PostgreSQL de test : c'est le niveau principal.
- Tests de composants web avec Testing Library et MSW.
- Tests unitaires uniquement pour la logique combinatoire (alignement des créneaux, bornes DST).
