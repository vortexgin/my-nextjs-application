# Base Module — Features Description

> Module: `app/base` · Tables: `base_users`, `base_roles`, `base_user_roles`, `base_actions`, `base_permissions`, `base_menus`, `base_activity_logs`
> Stack: Next.js 16 App Router · Sequelize 6 + Postgres · Joi · `withAuthorization` + `EncryptedFetch` · Tencent COS (`cos-nodejs-sdk-v5`)
> Conventions: vertical slice `models/` (`toApi()` + lazy factory, `underscored:true`, `timestamps:false`) → `useCases/<entity>/` (`List/Get/Create/Update/Delete` extending `BaseUseCase`: Joi in `preExec`, `recordActivityLog`/`settleTransaction` in `postExec`) → `api/[version]/` (`runtime="nodejs"`, `withAuthorization`, `ok()`/`fail()`) → `components/` + `views/` + `paths.ts`. Soft delete everywhere. `organization_id` never from payload.

## Overview

Workspace administration foundation every other module builds on: identity (users), RBAC (roles + actions + permissions + menus), audit (activity logs), and platform tools (RSA public-key, COS file upload). Also owns the shared libraries: `Auth` session guards, `Permissions.hasPermission`, billing baseline `TransactionUseCase`.

## Feature map

| # | Feature | Collection route | Permissions | Billing |
|---|---------|------------------|-------------|---------|
| F-01 | Users CRUD + org scoping + pickers | `/base/api/v1/users` | `base:user:list:list`, `create:create`, `view:detail/update/delete`, `view:update-organization` | create gated `base:user:create:create` |
| F-02 | Roles CRUD + grant assignment | `/base/api/v1/roles` | `base:role:*` | plain log |
| F-03 | Actions registry (perm codes) | `/base/api/v1/actions` | `base:action:*` | plain log |
| F-04 | Menus (sidebar, perm-gated) | `/base/api/v1/menus` | `base:menu:*` | plain log |
| F-05 | Activity logs + timeline | `/base/api/v1/activity-logs` | read via `authorized` (timeline) | n/a (write-only) |
| F-06 | File upload to COS | `POST /base/api/v1/tools/upload-file` | `base:tools:upload:upload` | n/a |
| F-07 | RSA public-key for encrypted transport | `GET /base/api/v1/public-key` | public, plaintext | n/a |

Views: `views/users|roles|menus|actions/` (list + `create` + `[uuid]` + `[uuid]/edit`, each `requireSession()` + `AuthComponent` + `AccessDenied`) + `paths.ts`. No dedicated views for activity-logs (surfaced via `components/ActivityTimeline.tsx`) or tools.

---

### F-01 Users

As admin, I manage workspace users (create with role + org link, search/filter, edit, soft-delete) so login, perms, org isolation, and lead assignment work.

- Model `base_users {uuid, name(120), email(160 unique), phone_number(30), password sha256 hex(255), status enum active|inactive|deleted, created_at/updated_at/deleted_at}`. `toApi` strips password, resolves `role` (`resolveRole` via `base_user_roles`) + `organization` (`resolveOrganization` via sass link, null when module/table absent). Email lowercased, unique → `DuplicateEntityException` 409.
- `UserListUseCase`: Joi `filter{q,name,email,phone,org_scope}`, `sortProperty valid(name,email,phone_number,status,created_at,updated_at)`, `limit 1-100 default 20`. `q` searches name/email/phone (`Op.iLike` + `escapeLike`). Always scopes to actor org peers when linked (`applyOrganizationScope`); opt-in `filter[org_scope]=actor` for pickers (lead assignee dropdown): linked see only same-org peers, unlinked see only unlinked users.
- `UserCreateUseCase`: billing-gated (`checkTransaction(actor,"base:user:create:create")` in `preExec`, `settleTransaction(operation:"create",entity:"user")` in `postExec`). Joi `name min2, email, phone min6, password min6, status, role_id uuid, organization_id uuid`. Guards: `organization_id` present requires `base:user:view:update-organization` (`requireOrganizationPermission`); `role_id` with slug `admin` requires `isAdmin(actor)` else 403. Creates user + `base_user_roles` row + `assignOrganization` (link create/update, `destroy` when empty, 404 when org missing).
- Update/Delete/Get follow same slice (update never accepts org change via payload pattern; delete sets `deleted_at`).
- API `api/[version]/users/route.ts` + `[uuid]/route.ts`, components `UserTable`/`UserForm` (shared `FormField.tsx` kit, `error` prop, `role=status/alert`, submit `disabled={isPending||loading}`) + `DeleteUserButton`, views + `paths.ts`.

### F-02 Roles

As admin, I define roles (e.g. `admin`) and grant them action codes so `hasPermission` + `withAuthorization` enforce access, snapshotted into sessions at login.

- Model `base_roles {uuid, name(120), slug(160 unique), status enum, timestamps}`. `toApi` includes `permissions: string[]` via `resolvePermissions(roleUuid)` (grants → live `action.action` where action active).
- UseCases `RoleList/Get/Create/Update/Delete`: Joi `name min2, slug, status, action_ids: uuid[]`. Create/update replace grant rows in `base_permissions {role_id, action_id}` (full-replacement on update — submit full selection, never filtered view). Duplicate slug → 409. Plain `recordActivityLog` (no billing).
- Special: `ADMIN_ROLE_SLUG="admin"` — only admins can assign it (see F-01). Session perms snapshot means re-login required after grant changes.

### F-03 Actions

As admin/dev, I register permission codes (`domain:entity:view:scope`, e.g. `sales:lead:list:list`, or `authorized`) so routes, views, menus, and billing packages reference stable strings.

- Model `base_actions {uuid, action(120 unique), description, status enum, is_transactions bool, timestamps}`. `is_transactions` marks billable actions consumed via `TransactionUseCase`.
- CRUD same slice; `action` unique → 409 + `UniqueConstraintError` mapping for races. Master-data names unique per org pattern applies where org-scoped.

### F-04 Menus

As admin, I configure sidebar navigation (tree via `parent`, ordered by `weight`) gated by action codes so users only see what `base:menu:*` allows.

- Model `base_menus {uuid, icon, parent FK base_menus null, menu(120), action_id FK base_actions CASCADE, description, redirection(500), status enum, weight int default 0}`. `toApi` resolves `action` code string via `resolveAction`.
- CRUD same slice. Dashboard shell renders by `weight`, filters by `hasPermission(session, perms, [menu.action])`. Sales entries (`Sales → Lead, Lead Status, Metadata Field`) gate on `base:menu:sales:*`.

### F-05 Activity logs + timeline

As any user, I see who did what (create/update/delete with before/after snapshots + billing credit) on detail pages so audits are transparent.

- Model `base_activity_logs {uuid, actor JSONB, operation create|update|delete, entity(60), entity_uuid, origin JSONB, updated JSONB, credit JSONB null, is_transaction bool default false, created_at}`. `sanitizeActivityData` strips `password/token/secret/*` keys. `recordActivityLog` never throws (console only) and is fire-and-forget (`void`) in every `postExec`.
- `ActivityLogListUseCase`: Joi `filter{entity,entities,entity_uuid,entity_uuids}` (singular accepts comma lists, backward compatible), `limit 1-100 default 50`. No org scope, no billing.
- `GET /base/api/v1/activity-logs` (perm `authorized`-level read). Client `components/ActivityTimeline.tsx`: `getEncrypted` with `filter[entity]=a,b&filter[entity_uuid]=u1,u2`, 50 latest desc, color dots/badges per operation, `<details>` origin/updated JSON, credit line. `LeadDetailClient` passes `lead + metadata + activity + field` uuids.

### F-06 File upload (COS)

As user, I attach files via base64-inside-JSON (encrypted transport is JSON-only, no multipart) so lead metadata / activity attachments land in Tencent COS.

- `POST /base/api/v1/tools/upload-file` perm `base:tools:upload:upload`: Joi `{filename 1-255 required, content_type max255, data base64 required}`. `sanitizeFilename`, `Buffer.from(data,"base64")`, empty + `maxFileBytes` (`COS_MAX_FILE_BYTES`, client also guards 10MB) → 400. `uploadToCos(buffer, filename, contentType)` → `{key, url, content_type, size, etag}` 201.
- Client pattern: `readAsBase64` via `FileReader` → `postEncrypted(UPLOAD_API, {filename, content_type, data})` → store returned `url` in form value (see `LeadForm` File button per metadata row; `LeadActivityModal` predates parity).
- Env: `COS_SECRET_ID / COS_SECRET_KEY / COS_BUCKET / COS_REGION` required, `COS_ENDPOINT / COS_UPLOAD_PREFIX / COS_MAX_FILE_BYTES` optional.

### F-07 Public key

`GET /base/api/v1/public-key` (plaintext by design, no auth/encryption) serves RSA public key for `x-key-exchange` handshake. Clients `GET` once, encrypt AES key, send `{iv,data}` envelopes; `x-app-verbose:1` bypasses for debugging.

## Permissions & billing summary

- Code shape `"domain:entity:view:scope"` or `"authorized"`. Server: `withAuthorization(handler,[...codes])` (401/403 plaintext `fail()` passed through undecrypted). Client: `hasPermission(user, session.permissions, codes, roleSlug?)` (role slug itself grants). Re-login after seed/grant changes.
- Billing baseline (`useCases/TransactionUseCase.ts`): gated creates (`user`, `lead`) call `checkTransaction(actor, actionString)` in `preExec` (resolves org → running invoice → package → action inclusion + subscription-expiry/quota checks; open `{isTransaction:false}` when sass absent/unlinked; 403 otherwise) and `settleTransaction` in `postExec` (atomic `credit_usage += credit` for quota/transaction packages + activity row with credit). Only user/lead creates gated; master-data logs plain rows.

## Validation / error contract

Joi in `preExec` (`abortEarly:false` → `BadParameterException` 400, unknown keys rejected). `DuplicateEntityException` 409 (email/slug/action + race-safe `UniqueConstraintError` mapping), `NotFoundException` 404 (role/org/assignee), `ForbiddenException` 403 (billing denial, admin-only, org-perm). `ok()`/`fail()` envelopes; `queryParam` helper for `filter[]/sort/offset/limit`.
