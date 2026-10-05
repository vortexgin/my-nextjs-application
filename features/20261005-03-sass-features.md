# SaaS Module — Features Description

> Module: `app/sass` (submodule `my-sass-library`) · Tables: `sass_organization`, `sass_organization_user`, `sass_package`, `sass_invoice`
> Stack: Next.js 16 App Router · Sequelize 6 + Postgres · Joi · `withAuthorization` + `EncryptedFetch`
> Conventions: vertical slice `models/` (`toApi()` + lazy factory, `underscored:true`, `timestamps:false`) → `useCases/<entity>/` (`BaseUseCase`: Joi in `preExec`, `recordActivityLog` in `postExec`) → `api/[version]/` (`runtime="nodejs"`, `withAuthorization`, `ok()`/`fail()`) → `components/` + `views/` + `paths.ts`. Soft delete everywhere. Joi rejects unknown keys.

## Overview

Multi-tenant SaaS billing foundation: tenants (organizations + user links), sellable plans (packages with billable actions + credits), and running entitlements (invoices with credit consumption). It does not process payments — it enforces entitlements via `UserModel.checkActiveInvoiceAndPackage` (`useCases/TransactionUseCase.ts`: `checkTransaction` in `preExec`, `settleTransaction` in `postExec`), which gates `base:user:create:create` and `sales:lead:create:create`.

Submodule note: commit inside `app/sass` first, then update the parent pointer.

## Feature map

| # | Feature | Collection route | Permissions | Writes |
|---|---------|------------------|-------------|--------|
| F-01 | Organizations CRUD (tenants) | `/sass/api/v1/organizations` | `sass:organization:list:list`, `create:create`, `view:detail/update/delete` | `recordActivityLog` |
| F-02 | Organization ↔ user links | via `UserModel.assignOrganization` / `resolveOrganization` (no sass route) | guarded by `base:user:view:update-organization` | link create/update/destroy |
| F-03 | Packages CRUD (plans) | `/sass/api/v1/packages` | `sass:package:list:list`, `create:create`, `view:detail/update/delete` | `recordActivityLog`, action-existence check |
| F-04 | Invoices read-only + credit enforcement | `GET /sass/api/v1/invoices`, `GET /:uuid` | `sass:invoice:list:list`, `view:detail` (list route additionally `authorized` + `withEncryption`) | no create/update API; `credit_usage` incremented by `settleTransaction` |
| F-05 | Billing gate for gated creates | `UserModel.checkActiveInvoiceAndPackage` | throws 403 on denial | invoice `increment("credit_usage")` + activity row with credit |

Views: `views/organizations|packages|invoices/` (`requireSession()` + `AuthComponent` + `AccessDenied`) + `paths.ts`. Invoices views are list + detail only (no create/edit pages).

---

### F-01 Organizations

As admin, I manage tenants (name, address, email, phone, npwp) so users, leads, and invoices isolate by `organization_id`.

- Model `sass_organization {uuid, name(120), address(255), email(160), phone(30), npwp(30 null), status enum active|inactive|deleted, created/updated/deleted_at}`. Email lowercased on write.
- UseCases `OrganizationList/Get/Create/Update/Delete`: list Joi `filter{q,name,email}`, `q` over name/email/phone/npwp (`Op.iLike` + `escapeLike`), `limit 1-100 default 20`; create Joi `name min2 max120, address min5 max255, email max160, phone min6 max30, npwp max30, status`. No org scoping on the list itself (tenants are top-level); no billing.
- API `api/[version]/organizations/route.ts` + `[uuid]/route.ts`; components `OrganizationTable`/`OrganizationForm` (shared `FormField.tsx` kit) + `DeleteOrganizationButton`.

### F-02 Organization ↔ user links

As admin (with org perm), I attach a user to an organization so all org-scoped lists (`UserList`, `LeadList`) and billing resolution follow the link. One link per user (`user_id` unique).

- Model `sass_organization_user {uuid, organization_id FK sass_organization CASCADE, user_id FK base_users unique CASCADE, status enum, timestamps}`.
- No sass HTTP routes — managed through `UserModel.assignOrganization(userUuid, organizationId)`: `undefined` → no-op; empty → `destroy` link; uuid → 404 when org missing else upsert link. Called from `UserCreateUseCase.execute` (and user update path).
- Reads via `UserModel.resolveOrganization(userUuid)` (null when module/table/link absent) and `loadOrganizationLinkModels` (lazy imports + `showAllTables` guard so base works without sass). `UserListUseCase.applyOrganizationScope` restricts to same-org peers when linked; `filter[org_scope]=actor` strict mode for pickers (linked → peers only, unlinked → only unlinked users). `LeadListUseCase` pushes `{organization_id}` condition. `requireOrganizationPermission` enforces `base:user:view:update-organization` before accepting `organization_id`.

### F-03 Packages

As admin, I define plans (`subscription | transaction | quota`) bundling billable actions with per-action credits so invoices can gate and meter usage.

- Model `sass_package {uuid, name(120), description(255 null), type enum, duration_days int null, duration_description null, credit_quota int null, actions JSONB [{action_id uuid, credit int?}] default [], status enum}`.
- `PackageCreate/Update`: Joi `name min2 max120 required, type required, duration_days min1, credit_quota min0, actions[{action_id uuid required, credit min0}]`, deduped by `normalizePackageActions` (first wins). `ensurePackageActionsExist` → 404 when any `action_id` missing/deleted (actions must exist in `base_actions`).
- `PackageForm`: loads `GET /base/api/v1/actions?limit=100`, filters to `is_transactions===true` only (display-only search; submit payload built from full selection state), per-action credit inputs (non-negative int), guards submit until actions load (`disabled={isPending||actionsLoading}` + `handleSubmit` guard — empty selection never wipes relations pattern). Type-conditional fields: `subscription` → duration_*, `quota` → credit_quota, else null.
- API perms `sass:package:*`; plain activity logs.

### F-04 Invoices (read-only API)

As ops/finance, I inspect running entitlements and credit consumption so quota disputes are auditable. Invoices are provisioned outside the API (seed/DB — no POST/PUT/DELETE routes or UseCases exist); the API only reads, and gated creates only increment usage.

- Model `sass_invoice {uuid, organization JSONB {id,name,npwp}, package JSONB {id,name,description,type}, start_date DATEONLY null, end_date DATEONLY null, credit_limit int null, credit_usage int default 0, status enum running|active|inactive|paid|deleted, timestamps}`. Snapshotted org/package JSON (not live FKs).
- `InvoiceListUseCase`: Joi `filter{status}` + `limit 1-100 default 20`; `InvoiceGetUseCase`: uuid → 404. No writes, no org scoping, no activity log on read.
- `GET /sass/api/v1/invoices` = `withAuthorization(withEncryption(handleGet), ["authorized"])` (any live session; note double-wrap order), detail route per `sass:invoice:view:detail`. Views list + `[uuid]` detail (`InvoiceTable`, no form/delete button).

### F-05 Billing gate (how packages + invoices enforce)

`UserModel.checkActiveInvoiceAndPackage(actor, actionString)` (called as `checkTransaction`):

1. Open `{isTransaction:false, credit:null, invoice:null}` when sass models absent, tables missing, or actor unlinked (feature off → unblocked).
2. Else require one `sass_invoice where {status:"running", deleted_at:null, organization.id = link.organization_id}` latest → 403 `"No running invoice."` when none.
3. Load `sass_package {uuid: invoice.package.id}` → 403 when missing; resolve package `actions[].action_id` → `base_actions` codes; require `codes.includes(actionString)` → 403 `"Action is not included in the package."`. Return per-action `credit` (matched by code equality).
4. Type rules: `subscription` → 403 when `end_date` expired; `quota` → 403 when `credit_usage >= credit_limit`.
5. `settleTransaction` (postExec): for `quota|transaction` packages with numeric credit, atomic `invoice.increment("credit_usage", {by: credit})` (never throws — console only), then `recordActivityLog({..., credit, is_transaction})` with sanitized payloads.

Gated today: `UserCreateUseCase` (`base:user:create:create`) and `LeadCreateUseCase` (`sales:lead:create:create`). All other creates log plain activity rows.

## Validation / error contract

Joi in `preExec` (`abortEarly:false` → `BadParameterException` 400). `NotFoundException` 404 (action/org/invoice), `DuplicateEntityException` 409, `ForbiddenException` 403 (billing denial, admin/org guards). `ok()`/`fail()` envelopes; `queryParam` for `filter[]/sort/offset/limit`. Encrypted transport is JSON-only (`{iv,data}`); 401/403 `fail()` passes through undecrypted by design.
