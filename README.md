# VortexGin

Secure single sign-on, workspace administration, SaaS billing, sales, and
object-storage uploads. Built with Next.js 16 (App Router), React 19,
Sequelize 6 + PostgreSQL.

## Modules

| Module | Path | What |
|---|---|---|
| SSO | `app/sso` | sign in, sessions (24h TTL), forgot / update password |
| Base admin | `app/base` | users, roles, menus, actions, activity logs, file-upload tool |
| Dashboard | `app/dashboard` | shell + sidebar, profile, change password |
| SaaS billing | `app/sass` (submodule `my-sass-library`) | organizations, packages, invoices; quota/transaction credit enforcement |
| Sales | `app/sales` (submodule `my-sales-library`) | leads (kanban board), activities, metadata, metadata fields, statuses |

## Tech Stack

Next.js 16 App Router · React 19 · Tailwind 4 · Sequelize 6 + PostgreSQL ·
Joi validation · hybrid RSA + AES-GCM API transport · `cos-nodejs-sdk-v5`
(Tencent COS, S3-compatible).

## Getting Started

```bash
npm install
npm run keys:generate                      # RSA keypair for API encryption (keys/)
export DATABASE_URL="postgres://..."       # dotenv is NOT installed; sequelize-cli needs this exported
npx sequelize-cli db:migrate
psql "$DATABASE_URL" -f database/seed-master-data.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/seed-product-sample.sql  # optional sample catalog
npm run dev                                # http://localhost:3000
```

Production (PM2, process name `my-next-app`):

```bash
npm run build
pm2 start ecosystem.config.js            # next start -p 3000
pm2 restart my-next-app
```

### Environment (`.env`)

| Key | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string |
| `APP_URL` | public origin for outbound links |
| `MAILGUN_API_KEY` / `MAILGUN_DOMAIN` / `MAILGUN_FROM` | outbound mail |
| `COS_SECRET_ID` / `COS_SECRET_KEY` / `COS_BUCKET` / `COS_REGION` | Tencent COS uploads (required) |
| `COS_ENDPOINT` / `COS_UPLOAD_PREFIX` / `COS_MAX_FILE_BYTES` | COS overrides (optional) |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` / `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` | Google Drive/Docs service account credentials |
| `GOOGLE_DRIVE_TEMP_FOLDER_ID` | Dedicated folder for temporary document copies |
| `PDF_TEMP_DIRECTORY` | Local temporary PDF directory (default `/tmp/vortexgin-pdf`) |
| `PDF_MAX_BYTES` / `PDF_STOCK_MAX_ROWS` / `PDF_GENERATION_TIMEOUT_MS` | PDF safety limits |

Google Docs masters must be shared with the service account and kept outside
the temporary folder. Schedule `npm run pdf:cleanup` to remove temporary Drive
copies and local UUID-named PDFs older than one hour.

## Conventions

- **Vertical slice** per entity (see `app/base/models/UserModel.ts` flow):
  `models/` (`toApi()` + lazy factory) → `useCases/` (`List/Get/Create/Update/Delete`
  extending `BaseUseCase`: Joi in `preExec`, activity log in `postExec`) →
  `api/[version]/` routes (`withAuthorization` + `withEncryption`, `ok`/`fail`
  envelopes) → `components/` + `views/` + `paths.ts`.
- **Billing baseline** (`useCases/TransactionUseCase.ts`): gated creates call
  `checkTransaction(actor, action)` in `preExec` and `settleTransaction(...)` in
  `postExec` — consumes invoice `credit_usage` on quota/transaction packages and
  records `credit` on the activity timeline. Only lead/user creates are gated;
  master-data creates log plain activity rows.
- **Permissions** `"domain:entity:view:scope"` (e.g. `sales:lead:list:list`) or
  `"authorized"`; checked server-side (`withAuthorization`) and client-side
  (`AuthComponent`). Sidebar menus are gated by `base:menu:*` codes.
- **Encrypted transport:** clients handshake `GET /base/api/v1/public-key`, send
  `x-key-exchange` + `{iv,data}` JSON envelopes; `x-app-verbose: 1` bypasses for
  debugging (file uploads use base64-inside-JSON for this reason). Auth-layer
  rejections (401/403 from `withAuthorization`) are plaintext `fail()` envelopes
  by design — `EncryptedFetch` passes them through instead of decrypting, so the
  real message surfaces.
- **Forms** (`components/FormField.tsx` shared kit): `TextField` (with `action`
  slot for buttons like File upload), `TextAreaField`, `SelectField`,
  `DateField`/`DateTimeField`, plus `components/UploadButton.tsx` (picker +
  base64-inside-JSON upload, plugs into `action`). Same `label`/`hint`/`size`/`error` API on all
  fields; `className`/`labelClassName` merge per utility-group (override wins its
  group). Use the kit for every form; submit buttons are
  `disabled={isPending || loading}` with a matching guard in `handleSubmit` so
  edits can't wipe relations before dropdown data arrives.
- **Organization scoping:** `organization_id` is resolved from the actor's link,
  never from payloads, never updatable; list endpoints scope to the actor's org
  (unlinked actors see unlinked rows). `UserListUseCase` additionally accepts
  `filter[org_scope]=actor` for pickers.
- **Soft delete** everywhere (`deleted_at`); master-data names are unique per
  organization (partial unique index with `NULLS NOT DISTINCT` + 409 guards).

## Sales module notes

- Leads board (`LeadBoard`) fetches statuses + leads independently
  (`Promise.allSettled`) and degrades per-panel; drag-and-drop moves status.
- Lead `status` is a free-form string backed by lead-status master data.
- `POST /base/api/v1/tools/upload-file` takes
  `{filename, content_type?, data (base64)}` → Tencent COS, returns
  `{key, url, content_type, size, etag}` (permission `base:tools:upload:upload`).
  File buttons are permission-gated in the UI (lead metadata rows, activity
  attachment field); activity cards show a `View attachment` link when set.
  Session permissions snapshot at login — re-login after seed/grant changes.
- Lead metadata edits sync with full-replacement semantics (omitted rows are
  soft-deleted, `[]` deletes all); dropdown fetches degrade independently
  (`Promise.allSettled`, per-panel errors).
- UI smoke scripts live outside the repo: `/tmp/opencode/sales-smoke.mjs`
  (`SMOKE_ENCRYPTED=1` for the real exchange), `sales-ui-smoke.mjs`
  (`BASE_URL=` override). Test reports accumulate in `testsuite/` (gitignored) —
  latest form audit `20261005-014506.md` (F-01…F-09 fixed; F-04 dead SSO buttons
  and the UpdateProfileForm logout note intentionally excluded).

## Known issues

- `npm run build` type-checking fails on the generated `.next/dev` route-type
  validator (flags untouched route/layout files). `tsc --noEmit` on source is
  clean; builds have been produced with a temporary `ignoreBuildErrors` (always
  reverted afterwards — never commit that flag).
- Never delete `.next/` while the server runs (`next start` crash-loops);
  stop pm2 first.
- `testsuite/` is gitignored by design; `app/sass` and `app/sales` are separate
  repos (commit + push inside each, then update the parent pointer, submodule first).
