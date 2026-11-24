# Lancer ChallengeU en local

## Etat des lieux
Projet build en ~4h.
J'ai pris le choix de générer le projet full avec l'IA (claude code haiku / sonnet / opus).
~1/4 du temps à définir les specs / domain / architecture et le reste du temps à  implementer.
Tous les tickets sont décris dans [les issues](https://github.com/vicodut/challengeU/issues), où sont aussi tracker le RAF.
Chaque PR contiens un diagram mermaid + un screenshot de ce qui a été implementer.
Le choix à été fait de partir sur une architecture hexagonale avec NestJS en backend et React + Shadcn + Tanstack sur le front.

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

## Hypothèses / Assumptions

- **Fuseau horaire** : chaque utilisateur a un fuseau IANA (`users.time_zone`, validé contre `Intl.supportedValuesOf('timeZone')`). Le seed couvre Toronto, Vancouver et Paris.
- **Créneaux en UTC** : les blocs de disponibilité sont stockés en `timestamptz` (instants UTC), commencent à :00 ou :30 UTC et durent 30 ou 60 min (contrainte `CHECK`). Hypothèse : les fuseaux visés ont des décalages en demi-heure, donc un alignement UTC suffit.
- **Authentification** : HTTP Basic sur toutes les routes, sauf `@Public()`. Mots de passe hashés en argon2id.
- **Conflit dans le brief** : la section 7 (EN) demande un « simple authentication mechanism », alors que la version FR met l'authentification hors périmètre (« une simple liste pour choisir le coach ou l'élève courant suffit »). J'ai suivi la version EN. **À confirmer.**
- **Inscriptions séparées** : `enrollments.student_id` et `program_coaches.coach_id` sont des identifiants d'identité, sans clé étrangère vers `identity`. Un étudiant a au plus une inscription (clé primaire).
- **Heure courante** : toujours fournie par le port `Clock`, jamais lue directement.
- **Hors périmètre** (brief et choix) : base cloud, paiements, vrais SMS ou courriels, déploiement, UI soignée. Réservation, annulation et messagerie ne sont pas encore implémentées (voir Prochaines étapes).

## Compromis / Trade-offs

- **Basic auth plutôt que sessions ou JWT** : simple et sans état, derrière un seul guard. *Coût* : identifiants renvoyés à chaque requête, stockés en `sessionStorage` (exposés en cas de XSS), pas de révocation côté serveur. *Remplaçable* dans le guard seul.
- **Drizzle plutôt qu'un ORM complet (Prisma, TypeORM)** : SQL proche de la base, typage léger, migrations SQL lisibles. *Coût* : `drizzle-kit` ne sait pas exprimer les contraintes `EXCLUDE`, donc la migration 0003 est écrite à la main.
- **Contrainte `EXCLUDE` dans Postgres pour les chevauchements** : deux publications simultanées ne peuvent pas passer, même en course. *Coût* : extension `btree_gist` et erreur `23P01` à traduire en erreur métier ; la seule vérification applicative ne suffit pas.
- **Monolithe modulaire plutôt que services** : un déploiement, une base, des tests rapides. Les frontières sont imposées par `index.ts` et `eslint-plugin-boundaries`. *Coût* : les modules partagent un processus et une base ; l'extraction d'`enrollment` (prévue l'an prochain) demandera un travail de séparation, limité car les liens sont déjà des identifiants sans clé étrangère.
- **Node 24 épinglé** (`engine-strict`) : évite les surprises de version. *Coût* : Node 26 fait échouer `pnpm install` ; il faut `nvm use 24`.
- **Pas de polish UI** : le temps va aux règles métier et aux tests, comme le brief le demande. *Coût* : l'interface est fonctionnelle, pas agréable.

## Prochaines étapes / Next steps

Dans l'ordre, avec les issues GitHub ouvertes :

1. **Réservation étudiant** (#16) : table `sessions`, contrainte d'unicité sur le créneau, plafond de 3 séances à venir, annulation jusqu'à 24 h avant (#19). Un coach voit ses séances (#18), un étudiant voit les siennes (#17).
2. **Suspension et réactivation** (#9) : règle « un étudiant suspendu voit ses séances mais ne peut rien réserver ».
3. **Messagerie in-app** (#20, #21, #22) : boîte de réception, statut lu et badge, messages pour réservations et annulations.
4. **Vue des créneaux libres pour l'étudiant** (#15).
5. **ADR et glossaire** (#26).
6. **Polish** : UI, documentation des décisions.

Autres tickets ouverts : #10 (changer de programme), #11 (coachs du programme), #23 (retirer un bloc avec réservations), #24 (désassigner un coach), #25 (seed complet).

## Outils IA utilisés

- **Claude Code** avec les modèles haiku, sonnet et opus, pour générer le projet (voir l'état des lieux).
- **Agents Orca** : `AGENTS.md` décrit le pipeline (orchestrateur Opus, implémenteurs Sonnet dans des worktrees Orca, revue avec les skills `mattpocock-skills`). Le dépôt ne permet pas de vérifier, commit par commit, quel agent a écrit quel code.
