# Sales MVP — D + A + B

> Status: draft for review · Module: `app/sales` (submodule `my-sales-library`)
> Scope: end-users, manual-process pain · Constraints: repo conventions + encrypted JSON-only API + billing-gated creates
> Baseline verified: `LeadListUseCase.ts`, `LeadCreateUseCase.ts`, `LeadUpdateUseCase.ts`, `api/[version]/leads/route.ts`, `TransactionUseCase.ts`, `BaseUseCase.ts`, `LeadBoard.tsx`, `LeadForm.tsx`, `LeadActivitySection.tsx`

Vertical-slice rule (all three items): `models/` (`toApi()` + lazy factory, `underscored:true`, `timestamps:false`) → `useCases/<entity>/` (`BaseUseCase`: Joi in `preExec`, `recordActivityLog`/`settleTransaction` in `postExec`) → `api/[version]/` (`export const runtime="nodejs"`, `withAuthorization(handler,[...codes])`, `ok()`/`fail()` envelopes, JSON-only `{iv,data}` via `EncryptedFetch`) → `components/` + `views/` + `paths.ts`. No migrations for D/A/B except where noted (none required).

Global invariants (do not break):
- `organization_id` resolved from actor via `UserModel.resolveOrganization(actorUuid)`, never from payload, never updatable. Lists scope via `applyOrganizationScope`; unlinked actors keep full visibility.
- Soft delete (`deleted_at`); all reads filter `deleted_at:null`.
- Joi rejects unknown keys (keep default). `email` lowercased, globally unique → `DuplicateEntityException` 409.
- Client dropdowns degrade independently (`Promise.allSettled`, per-panel errors) — never blank primary view on sibling failure.
- File bytes only as base64-inside-JSON (`tools/upload-file` pattern). No multipart.

---

## D. CSV import (billing-gated) + duplicate preview

### Problem
Single-entry `LeadForm` only. Bulk capture is fully manual.

### User stories
1. As sales end-user with `sales:lead:create:create`, I upload a CSV (≤2MB, ≤500 rows) with headers `name,email,phone_number,company,source,status,value,assigned_to,notes` so I can bulk-create leads without retyping.
2. As same user, I see a pre-flight preview (`new: N, duplicates_in_file: M, existing_email: K, invalid: J` with row errors) so I correct the file before consuming quota.
3. As same user, I get a partial-success result (`created[], skipped[{row,email,reason}]`) so one bad/duplicate row never aborts the whole batch, and quota is consumed only for created rows.

### API shape (follows `leads/route.ts` pattern)

```
POST /sales/api/v1/leads/import/preview  — dry-run, no writes, no credit
POST /sales/api/v1/leads/import          — creates, billing-gated
```

Both accept encrypted JSON-only (no multipart):

```json
{
  "rows": [
    {"name":"Jane Doe","email":"jane@acme.id","phone_number":"+628123","company":"Acme","source":"website","status":"new","value":100,"assigned_to":null,"notes":"..."}
  ]
}
```

Client parses CSV → JSON (Papa-style, in `LeadImportClient`). `content_type` validation client-side; server never sees raw CSV.

Joi — reuse `createLeadSchema` per row (do not fork rules):

```ts
// LeadImportPreviewUseCase.preExec / LeadImportUseCase.preExec
const importSchema = Joi.object({
  rows: Joi.array().items(Joi.object({
    name: Joi.string().trim().min(2).required(),
    email: Joi.string().trim().email().required(),
    phone_number: Joi.string().trim().min(6).required(),
    company: Joi.string().trim().allow("", null).max(160).optional(),
    source: Joi.string().valid("website","referral","ads","cold_call","event","other").optional(),
    status: Joi.string().trim().min(2).max(60).optional(),
    value: Joi.number().integer().min(0).allow(null).optional(),
    assigned_to: Joi.string().uuid({version:"uuidv4"}).allow(null).optional(),
    notes: Joi.string().trim().allow("", null).optional(),
  }).unknown(false)).min(1).max(500).required(),
}).unknown(false);
```

Preview response (`ok()` envelope):

```json
{"new": [...], "duplicates_in_file": [...], "existing_emails": [...], "invalid": [{"index":3,"errors":"..."}]}
```

Import response (`201`):

```json
{"created": [<Lead>], "skipped": [{"index":2,"email":"x@y.z","reason":"duplicate|validation|assignee-not-found"}]}
```

### Permission codes
- Reuse existing: `sales:lead:list:list` for `.../import/preview` (GET-equivalent dry run), `sales:lead:create:create` for `.../import` (POST creates).
- Rationale: avoids new seed/master-data migration. Optional follow-up `sales:lead:import:create` only if you need to gate import separately from single create.

```ts
// app/sales/api/[version]/leads/import/route.ts
export const runtime = "nodejs";
export const POST = withAuthorization(handlePost, ["sales:lead:create:create"]);
// app/sales/api/[version]/leads/import/preview/route.ts
export const POST = withAuthorization(handlePreview, ["sales:lead:list:list"]);
```

### organization_id + TransactionUseCase handling
- `LeadImportUseCase.preExec`: `const billing = await checkTransaction(actor, "sales:lead:create:create")` once (same string as `LeadCreateUseCase` so quota packages match). Resolve `organizationId` once via `UserModel.resolveOrganization(actorUuid)`. Validate rows via shared schema; check `assigned_to` existence (`UserModel.findOne {uuid, deleted_at:null}` → `NotFoundException` → per-row `skipped`, not throw); check `email` lowercased uniqueness via single `LeadModel.findAll({where:{email: In(lowered)}})` + in-file duplicate set.
- `execute`: loop rows; per valid non-duplicate row delegate to same insert path as `LeadCreateUseCase.execute` (same field normalization: `trim`, `email.toLowerCase()`, `company||null`, `source??"website"`, `status??"new"`, `organization_id: organizationId`). Do not accept `organization_id` from payload. Per-row try/catch → `skipped` on `DuplicateEntityException` (race) / `UniqueConstraintError` (map to 409-skip, not 500).
- `postExec`: `settleTransaction({... billing})` once per created lead (loop), same as single create (`operation:"create", entity:"lead", entity_uuid, updated: lead`). Credit consumed only for `created.length`. Preview UseCase does no `check/settle` and calls only `recordActivityLog`? No — preview does neither (read-only dry run).

### Files (vertical slice)
- `app/sales/useCases/lead/LeadImportPreviewUseCase.ts` (extends `BaseUseCase`, Joi in `preExec`, no billing)
- `app/sales/useCases/lead/LeadImportUseCase.ts` (extends `BaseUseCase`, `checkTransaction` in `preExec`, `settleTransaction` per row in `postExec`)
- `app/sales/api/[version]/leads/import/preview/route.ts` + `app/sales/api/[version]/leads/import/route.ts` (`runtime="nodejs"`, `withAuthorization`, `ok`/`fail`, `queryParam` n/a — JSON body via `request.json()`)
- `app/sales/components/lead/LeadImportClient.tsx` (file picker → CSV→JSON → `postEncrypted` preview → confirm → `postEncrypted` import; `Promise.allSettled`-safe error panels)
- `app/sales/views/leads/import/page.tsx` (`requireSession()` + `AuthComponent` + `AccessDenied`) + link from `LeadBoard.tsx` `New lead` cluster
- `app/sales/views/leads/paths.ts`: add `LEAD_IMPORT_PATH`

### Acceptance criteria
- [ ] 500-row CSV with 3 duplicates + 1 bad email → preview shows `N-4 new`, import creates `N-4`, `skipped` lists 4 with reasons, no 500.
- [ ] Duplicate `email` (case-insensitive, incl. race) → per-row skip with `reason:"duplicate"`, mapped from `DuplicateEntityException`/`UniqueConstraintError`, never aborts batch.
- [ ] Quota package: `invoice.credit_usage` increments by `credit * created.length` (0 for preview / 0-created import). Open billing (`isTransaction:false`) still works.
- [ ] Cross-org isolation: imported rows inherit actor org; payload `organization_id` ignored (Joi `unknown(false)` rejects it).
- [ ] Encrypted transport passes (`SMOKE_ENCRYPTED=1` style `postEncrypted`); `x-app-verbose:1` debug path still works.
- [ ] No `.next` deletion while PM2 `my-next-app` runs; build via temp `ignoreBuildErrors` → revert → `pm2 restart` per README.

---

## A. Advanced board filters + saved views

### Problem
Board only has `filter[q]`. Triage by owner/source/value/recency is manual scrolling (cap 500).

### User stories
1. As end-user, I filter board by `source, status, assigned (me/unassigned/specific user), value_min/max, updated_before (stale_days)` combined with `q`, so I can triage my queue.
2. As end-user, I save current filter set as a named view (localStorage v1, no migration) so daily triage is one click.

### Joi / API shape — extend `LeadListUseCase`, do not fork
Extend `ListLeadsFilter` (backward compatible; existing callers unaffected):

```ts
filter: Joi.object({
  q: Joi.string().trim().allow("").optional(),
  name: Joi.string().trim().allow("").optional(),
  email: Joi.string().trim().allow("").optional(),
  phone: Joi.string().trim().allow("").optional(),
  company: Joi.string().trim().allow("").optional(),
  status: Joi.string().trim().allow("").optional(),
  source: Joi.string().valid("website","referral","ads","cold_call","event","other").optional(), // tighten from string
  assigned_to: Joi.string().uuid({version:"uuidv4"}).optional(),
  assigned: Joi.string().valid("me","unassigned","all").optional(), // new
  value_min: Joi.number().integer().min(0).optional(),               // new
  value_max: Joi.number().integer().min(0).optional(),               // new
  updated_before: Joi.date().iso().optional(),                       // new
  stale_days: Joi.number().integer().min(1).max(90).optional(),       // new (alt to updated_before)
}).optional()
```

Route mapping (extend `api/[version]/leads/route.ts` `handleGet`):

```ts
filter: {
  q: queryParam(params,"filter[q]"), status: ..., source: ...,
  assigned_to: queryParam(params,"filter[assigned_to]"),
  assigned: queryParam(params,"filter[assigned]"),
  value_min: queryParam(params,"filter[value_min]"),
  value_max: queryParam(params,"filter[value_max]"),
  updated_before: queryParam(params,"filter[updated_before]"),
  stale_days: queryParam(params,"filter[stale_days]"),
}
```

Execute semantics (`Sequelize Op`):
- `assigned=me` → `{assigned_to: actor.uuid}`; `unassigned` → `{assigned_to: null}`; explicit `assigned_to` wins if both present (document + Joi `.oxor` optional — keep simple: explicit wins).
- `value_min/max` → `{value:{[Op.gte]:min,[Op.lte]:max}}` (null values excluded when filter present — document).
- `updated_before` or `stale_days` → `{updated_at:{[Op.lt]: date}}` (`stale_days` computes `new Date(Date.now()-days*86400e3)`).
- Keep `escapeLike` for `q/name/company`, `deleted_at:null`, then `applyOrganizationScope`.

### Permission codes
- No new codes. `GET /leads` stays `sales:lead:list:list`. Saved views are client-only (localStorage), no API/perms.

### organization_id + Transaction handling
- Read-only: no `check/settleTransaction`. `applyOrganizationScope` unchanged — filters compose with org condition via `Op.and`.

### Files
- `app/sales/useCases/lead/LeadListUseCase.ts` (extend only) + `app/sales/api/[version]/leads/route.ts` (map new `queryParam`s)
- `app/sales/components/lead/LeadBoard.tsx` (filter bar: source select, assigned select, value min/max, stale select; URLSearchParams sync for shareable links) + `LeadFilterViews.ts` (localStorage helper, no API)
- No model/migration change.

### Acceptance criteria
- [ ] `filter[source]=ads&filter[assigned]=unassigned&filter[value_min]=100&filter[stale_days]=7` returns only matching org-scoped rows; unknown keys rejected 400.
- [ ] `assigned=me` resolves from actor, not payload; `assigned_to=<uuid>` still works for managers with list perm.
- [ ] Board with statuses API down still shows leads with warning (existing `allSettled` preserved); filters apply to leads fetch only.
- [ ] Saved view round-trips via URL + localStorage; empty result shows empty columns (not error).

---

## B. Stale + unassigned highlights + column totals

### Problem
No visual cue for neglected leads or pipeline value; `updated_at`/`value`/`assigned_to` already fetched but unused.

### User stories
1. As end-user, I see a `STALE >Xd` badge on cards not updated in X days (default 7, adjustable via A filter) so I follow up.
2. As end-user, I see `Unassigned` ring/badge on cards with `assigned_to:null` so queue ownership is obvious.
3. As end-user, I see per-column `count + SUM(value)` header so pipeline value is visible without export.

### API shape
- None. Pure client computation over existing `Lead[]` (`uuid,name,email,phone_number,company,source,status,value,assigned_to,updated_at`). Honors A filters automatically.

```ts
// LeadBoard.tsx helpers (new, tested)
const staleCutoff = Date.now() - staleDays*86400e3;
const isStale = (l: Lead) => new Date(l.updated_at).getTime() < staleCutoff;
const colTotal = (rows: Lead[]) => rows.reduce((s,r)=> s + (typeof r.value==="number"?r.value:0), 0);
```

### Permission codes / billing / org
- None new. No API call, no `check/settle`, no org logic (inherits board scope).

### Files
- `app/sales/components/lead/LeadBoard.tsx` only (+ tiny `leadBoardStats.ts` helper if preferred). No UseCase/API/model/view change.

### Acceptance criteria
- [ ] Card with `updated_at` 8d ago + `stale_days=7` shows `STALE` badge; 6d ago shows none. `null value` counts as 0 in totals.
- [ ] `assigned_to:null` shows `Unassigned` style; assigned shows nothing extra.
- [ ] Column header shows `{n} · {total}`; `Other` column included when present.
- [ ] No perf regression at 500 cards (memoize grouping via `useMemo`); drag-drop + optimistic rollback (`moveLead`) unchanged.

---

## Cross-cutting test plan
- `tsc --noEmit` clean; build via temp `ignoreBuildErrors` → revert (never commit flag); `pm2 restart my-next-app` only after build.
- Probes: `admin@vortexgin.com / admin123`; `SMOKE_ENCRYPTED=1 BASE_URL=... /tmp/opencode/sales-smoke.mjs`; clean probe rows via API afterwards.
- Manual: preview→import 500 rows; board filters combo; statuses-outage degrade; encrypted + verbose header paths.

## Out of scope (explicit)
- No `organization_id` in payloads; no status transition rules; no auto-assign; no `due_at` reminders; no new `sales:lead:import:*` perm (revisit if PM needs separate gating); no CSV on server (client parses → JSON).
