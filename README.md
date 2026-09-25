# VortexGin

Centralized SSO and workspace administration platform. One login serves the
whole workspace: secure sign-in with encrypted session tokens, password
recovery via emailed reset links, and role-based access control (RBAC)
governing every API and every screen. An admin console manages the access
model itself — actions (permission codes), menus (sidebar navigation), roles,
users, and their grants — with a full activity audit trail behind it all.

## What was built

**Foundation & access control**

- Dashboard shell: collapsible sidebar (menus served live from the menus
  API, permission-gated per item), topbar with user dropdown (update profile,
  change password, logout that kills the server session).
- Unified permission rule in one module: empty/`"authorized"` grants,
  otherwise role-slug or permission overlap — used identically by API
  middleware, server pages, and client gates.
- Encrypted transport (hybrid RSA + AES-GCM) on all protected APIs, with auth
  headers forwarded through the decryption layer.

**CRUD consoles** (`/base/views/...`, all following one pattern: server guard
→ permission gate → client components → encrypted API)

- Actions, menus (live action/parent dropdowns, hierarchical indented
  parents, cycle-safe), roles (tabbed Domain > Entity permission picker),
  users (role dropdown, password handled safely).
- Shared kit: generic `Table` (sortable headers, limit+1 pagination),
  `Pagination`, `StatusBadge`, `AccessDenied`.

**Audit**

- `activity_logs` (actor snapshot, before-state origin, after-state updated)
  written from use-case `postExec` — success-only, secrets stripped, never
  breaks the request.
- Vertical `ActivityTimeline` embedded on every detail page; list API and
  seeder wiring included.

**Data layer hygiene**

- Table rename to `base_*`/`sso_*` across models, migrations, and seed; FKs
  repaired; orphan rows removed; unique constraint restored; legacy tables
  dropped after backup.

## Impact

- **Single source of truth for access**: permissions, menus, roles, and users
  are managed in one UI instead of SQL — onboarding a new module is seed
  rows, not code.
- **Auditable by default**: every mutation records who did what, before and
  after, visible on each record's timeline.
- **Consistent enforcement**: one permission function everywhere eliminates
  view-vs-API drift (the class of bug that silently over- or under-grants).
- **Reusable patterns**: new entities ship as columns + fetch + form on top of
  the generic table, and new APIs get auth, encryption, actor context, and
  logging by wrapping handlers.

## Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see
the result. Sign in flows start at `/sso`; the admin console lives under
`/base/views/...` and the workspace dashboard under `/dashboard`.

## Database

Migrations live in `migrations/` and run with the Sequelize CLI
(`DATABASE_URL` must be exported — the repo has no `dotenv` dependency, so
`.env` is not auto-loaded for CLI runs):

```bash
DATABASE_URL="$(sed -n 's/^DATABASE_URL=//p' .env | head -1)"
DATABASE_URL="$DBURL" npx sequelize-cli db:migrate
```

Master data (roles, actions, menus, admin user, grants) seeds from
`database/seed-master-data.sql`:

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/seed-master-data.sql
```

Sample login: `admin@vortexgin.com` / `admin123` (see seed file header).
