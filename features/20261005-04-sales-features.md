# Sales Module — Features Description

> Module: `app/sales` (submodule `my-sales-library`) · Tables: `sales_leads`, `sales_lead_activities`, `sales_lead_statuses`, `sales_lead_metadata`, `sales_lead_metadata_fields`
> Stack: Next.js 16 App Router · Sequelize 6 + Postgres · Joi · `withAuthorization` + `EncryptedFetch` · COS base64 upload
> Conventions: vertical slice `models/` (`toApi()` + lazy factory, `underscored:true`, `timestamps:false`) → `useCases/<entity>/` (`List/Get/Create/Update/Delete` extending `BaseUseCase`: Joi in `preExec`, `recordActivityLog`/`settleTransaction` in `postExec`) → `api/[version]/` (`runtime="nodejs"`, `withAuthorization`, `ok()`/`fail()`) → `components/` + `views/` + `paths.ts`. Soft delete everywhere. `organization_id` resolved from actor, never from payload, never updatable. Joi rejects unknown keys.

## Overview

Prospect pipeline from first contact to conversion. Core object is the lead (kanban board grouped by master-data statuses); supporting objects are activities (meetings/calls log), statuses (pipeline columns), and metadata fields + values (custom attributes incl. file URLs). Only lead creates are billing-gated; master-data logs plain activity rows.

Submodule note: commit inside `app/sass`… same rule applies here — commit inside `app/sales` first, then update the parent pointer.

## Feature map

| # | Feature | Collection route | Permissions | Billing |
|---|---------|------------------|-------------|---------|
| F-01 | Leads CRUD + kanban board + import | `/sales/api/v1/leads` (+ `/import`, `/import/preview`) | `sales:lead:list:list`, `create:create`, `view:detail/update/delete` | create + import gated `sales:lead:create:create` |
| F-02 | Lead activities (interaction log) | `/sales/api/v1/lead-activities` | `sales:lead-activity:list:list`, `create:create`, `view:detail/update/delete` | plain log |
| F-03 | Lead statuses (pipeline columns) | `/sales/api/v1/lead-statuses` | `sales:lead-status:*` | plain log |
| F-04 | Lead metadata fields (custom schema) | `/sales/api/v1/lead-metadata-fields` | `sales:lead-metadata-field:*` | plain log |
| F-05 | Lead metadata values (custom data) | `/sales/api/v1/lead-metadata` | `sales:lead-metadata:*` | plain log (nested via lead create/update) |
| F-06 | Lead detail timeline | via `ActivityTimeline` (`base/activity-logs`) | `authorized`-level read | n/a |

Views: `views/leads/` (board + `create` + `import` + `[uuid]` + `[uuid]/edit`), `views/lead-statuses/`, `views/lead-metadata-fields/` (each `requireSession()` + `AuthComponent` + `AccessDenied`) + `paths.ts`. No dedicated views for activities/metadata (surfaced inside lead detail + forms).

---

### F-01 Leads

As sales end-user, I capture, qualify, assign, and move prospects across stages so the pipeline stays actionable.

- Model `sales_leads {uuid, name(120), email(160 unique, lowercased), phone_number(30), company(160 null), source enum website|referral|ads|cold_call|event|other default website, status string(60) default "new" (free-form, resolved against lead-status master data), value int null, assigned_to FK base_users null, organization_id auto-filled immutable, notes text null, created/updated/deleted_at}`. Conventional stages `new|contacted|qualified|converted|lost` are docs only — DB accepts any `min2 max60` string.
- `LeadListUseCase`: Joi `filter{q,name,email,phone,company,status,source,assigned_to uuid}` + extended filters (forwarded generically — route forwards every `filter[*]` so Joi `unknown(false)` 400s unknown keys), `sortProperty valid(uuid,name,email,phone,company,source,status,value,created_at,updated_at)`, `limit 1-1000 default 20` (board requests 500). `q` over name/email/phone/company (`Op.iLike` + `escapeLike`); exact matches for email(lowercased)/phone/status/source/assigned_to. Scoped by `applyOrganizationScope` (actor org; unlinked keep full visibility).
- `LeadCreateUseCase`: `checkTransaction(actor,"sales:lead:create:create")` in `preExec`, `settleTransaction(operation:"create",entity:"lead")` in `postExec`. Validates duplicate email → 409, assignee exists → 404, metadata rows need field or new name. Inserts lead + nested metadata (supports on-the-fly field creation by name, reusing existing by name). `LeadUpdateUseCase`: same checks + full-replacement metadata sync in `execute` (omitted rows soft-deleted; clearing a value = deleting the row).
- API `api/[version]/leads/route.ts` + `[uuid]/route.ts` (`GET sales:lead:list:list`, `POST sales:lead:create:create`, detail/update/delete on `view:*`).
- Board `views/leads/page.tsx` → `LeadBoard.tsx`: fetches statuses + leads independently (`Promise.allSettled`, `limit 500`, keyword `filter[q]`), groups by `status.name`, unknown statuses fall into `Other` column, statuses outage degrades to scoped warning (never blanks leads). Drag-drop + per-card `<select>` → `PUT /leads/{uuid} {status}` with optimistic update + rollback on failure; read-only users get drag disabled notice. Search filters are display-only — submit payloads built from full selection state. Modals portal to `document.body` (ancestor `backdrop-blur` traps fixed overlays).
- `LeadForm` (create/edit): status + metadata-field + assignee dropdowns degrade independently (empty on failure, free-form still allowed); assignees from `GET /base/api/v1/users?filter[org_scope]=actor&limit=100` with current-assignee pinning; metadata rows support pick-existing / `+ Add new field` + per-row COS `File` upload (base64-inside-JSON via `POST /base/api/v1/tools/upload-file`); submit `disabled={isPending}` + guard before option fetches settle (empty `action_ids`-style wipe prevention).
- Import (`views/leads/import/page.tsx` gated on `create:create` → `LeadImportClient`): client parses CSV → JSON, `POST .../import/preview` (dry-run: `new/duplicates_in_file/existing_emails/invalid`, no writes, no credit, perm `list:list`) then `POST .../import` (partial success `{created[], skipped[{index,email,reason}]}`; one `checkTransaction` in `preExec`, per-created-row `settleTransaction`; race-safe duplicate skip via `DuplicateEntityException`/`UniqueConstraintError`; `organization_id` from actor, payload key rejected).

### F-02 Lead activities

As sales user, I log calls/visits/meetings per lead so follow-ups are traceable.

- Model `sales_lead_activities {uuid, leads_id FK, pic(120), phone(30), email(160), meeting_start, meeting_end null, notes text, attachment(500) URL null, status enum active|inactive|deleted default active}`.
- CRUD same slice; list supports `filter[leads_id]` (detail page requests 500, `meeting_start desc`). Plain activity logs.
- UI: `LeadDetailClient` → `LeadActivitySection` + `LeadActivityModal` (portalled; fields pic/phone/email/meeting_start/end/notes/attachment-URL; `postEncrypted` create; created row prepended). No `due_at/type/done_at`, no reminders; attachment is URL-only here (COS parity lives in `LeadForm` metadata rows).

### F-03 Lead statuses

As admin, I define pipeline columns per organization so the board reflects our process.

- Model `sales_lead_statuses {uuid, organization_id auto-filled, name(160), description text, status enum}`. Names unique per org (partial unique index `NULLS NOT DISTINCT` + `DuplicateEntityException` 409 on create/rename, `UniqueConstraintError` mapping for races).
- CRUD same slice; list `limit 500 sort name/created_at`. Board columns ← `GET /lead-statuses` (perm `sales:lead-status:list:list`); drag-drop target keys are `status.name` strings, so renames orphan leads into `Other` until leads are moved.

### F-04 Lead metadata fields

As admin, I define reusable custom attributes (e.g. Budget, File) so leads carry structured context.

- Model `sales_lead_metadata_fields {uuid, organization_id auto-filled, name(160), description text, status enum}`; same per-org uniqueness + 409 handling as statuses.
- CRUD same slice; `LeadForm`/import resolve by `lead_metadata_field_id` or create-by-`field_name` (trimmed, min2).

### F-05 Lead metadata values

As sales user, I attach field values (incl. COS file URLs) to a lead inline while creating/editing, so no second screen is needed.

- Model `sales_lead_metadata {uuid, leads_id FK null, lead_metadata_field_id FK, value text, status enum}`. Direct CRUD exists but primary path is nested `metadata[]` in lead create/update payloads (`{lead_metadata_field_id|field_name, value, uuid?}`); update is full-replacement (see F-01).
- Detail page renders values with field-name resolution (`fieldNameById` over 500 fields, `catch(()=>[])` degrade) plus timeline uuids.

### F-06 Detail timeline

`views/leads/[uuid]/page.tsx` (perm `view:detail`, `notFound()` on missing): server fetches lead + metadata + fields + activities (`Promise.all`, scoped `catch`), renders attribute grid + metadata list + `LeadDetailClient` (`LeadActivitySection` gated on `sales:lead-activity:create:create`) + `ActivityTimeline` over entities `lead,lead_metadata,lead_activity,lead_metadata_field` with all related uuids. Edit/delete buttons gated on `view:update` / `view:delete`.

## Permissions & billing summary

- Codes `sales:<entity>:list:list`, `create:create`, `view:detail/update/delete` via `withAuthorization` (API) + `AuthComponent` (views); sidebar via `base:menu:sales:*` (Sales → Lead, Lead Status, Metadata Field). Re-login after grant changes (snapshot at login).
- Only `LeadCreate` (+ `LeadImport`, one check + N settles) is `TransactionUseCase`-gated; activities/statuses/metadata log plain rows.
