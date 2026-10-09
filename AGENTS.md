<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# VortexGin — agent guide

Next.js 16.3.4 (App Router) · React 19 · Sequelize 6 + Postgres · Joi · Tailwind 4.
Submodules (separate repos, commit inside each first, then the parent pointer):
`app/sass` (`my-sass-library`), `app/sales` (`my-sales-library`),
`app/product` (`my-product-library`), `app/warehouse` (`my-warehouse-library`).

## Project requirements (source of truth)

- `features/` is the requirements directory — per-file calendar-date prefixed (`YYYYMMDD-NN-*.md`), chronological by filename. Read the relevant spec before designing or coding; the lowest-numbered spec for a domain is the oldest context.
- Current order: `01-sso`, `02-base`, `03-sass`, `04-sales`, `05-sales-d-a-b-mvp`, `06-product-design`, `07-warehouse-design`, `08-sales-customer-pr-so-do`. New specs continue the sequence (`09-...`), never rename existing files.

## Breaking framework conventions (verified in tree)

- Root layout uses global `LayoutProps<'/'>` (no import). Route/page params are
  `params: Promise<{...}>` — always `await params`. Keep this shape in every new
  route, page, and layout; the generated `.next/dev` route validator rejects
  anything else (and is currently failing repo-wide — see Known issues).
- `export const runtime = "nodejs"` on every API route (Sequelize needs it).

## Where things live

- Entity slice: `app/<domain>/models/` (`toApi()` + lazy `getXModel()` factory,
  `underscored: true`, `timestamps: false`) → `useCases/<entity>/`
  (`List/Get/Create/Update/Delete` extending `@/useCases/BaseUseCase`: Joi in
  `preExec`, `recordActivityLog`/`settleTransaction` in `postExec`) →
  `api/[version]/<entities>/route.ts` + `[uuid]/route.ts`
  (`withAuthorization(handler, [...codes])`, `ok()`/`fail()` envelopes) →
  `components/<entity>/` (`*Table` generic `Table`, `*Form` built on the shared
  `components/FormField.tsx` kit, `Delete*Button`) →
  `views/<entities>/` (server pages: `requireSession()` + `AuthComponent` +
  `AccessDenied`) + `paths.ts`.
- Shared: `libraries/` (Auth, Permissions, EncryptedRoute/Fetch, Encryption,
  Http, cos, mail), `useCases/BaseUseCase.ts`,
  `useCases/TransactionUseCase.ts` (billing baseline: `checkTransaction` /
  `settleTransaction`), `exceptions/` (typed errors with HTTP `.code`),
  `database/sequelize.ts` (lazy singleton), `migrations/` (sequelize-cli),
  `database/seed-master-data.sql` (idempotent `ON CONFLICT DO NOTHING` + role
  grants; rerun freely) + `database/seed-product-sample.sql` (sample catalog).
- Non-useCase helpers (sync/insert/row builders) live in
  `app/<domain>/libraries/`, never inside `useCases/`.
- Google Docs PDF templates are organization-scoped `base_document_templates`.
  Google clients/renderers live in `libraries/google/`; canonical PR/SO/DO and
  stock parameter builders live under each module's `libraries/pdf/`. PDF APIs
  return encrypted base64 JSON, never raw/multipart bytes or caller template IDs.

## Rules that bite

- `withEncryption` only passes JSON `{iv,data}` envelopes — no multipart bodies.
  File upload = base64-inside-JSON (`tools/upload-file` pattern).
  `withAuthorization` 401/403 rejections are plaintext `fail()` by design;
  `EncryptedFetch` passes them through (`unwrapResponse`) instead of decrypting.
- Session permissions snapshot at login — after changing grants/seeds, re-login
  before probing; otherwise 403s mask as client errors.
- New forms use `components/FormField.tsx` (`TextField` + `action` slot,
  `TextAreaField`, `SelectField`, `DateField`/`DateTimeField`) and
  `components/UploadButton.tsx` for file uploads through that slot; field errors via
  the `error` prop (ids/`aria-describedby` automatic), submit feedback with
  `role="status"`/`role="alert"`. Auth forms keep `noValidate` (Joi is the
  authority) with schemas declaring every validated key (no `allowUnknown`).
- Submit buttons are `disabled={isPending || loading}` with a matching guard in
  `handleSubmit` — never submit an edit before its option fetches settle
  (empty `action_ids` wipes relations).
- Search filters are display-only: build submit payloads from full selection
  state, never from the filtered view (see testsuite F-01).
- Lead metadata sync is full-replacement in `LeadUpdateUseCase` postExec:
  omitted rows are soft-deleted, so clearing a value = deleting the row.
- Cross-module relation labels come from guarded eager `include`s in the
  Get/List useCases (local `belongsTo` + associations-guard, dynamic imports,
  missing modules degrade to nulls); `toApi` reads the included objects with
  UUID fallback on pages. Exception: invoices snapshot `{id, name, ...}` as
  JSONB at write time. Ledger history resolves names as they were at write
  time — no `deleted_at` condition on display includes. Never join on the page
  with extra GetUseCase calls; never block writes on relation reads.
- Generic `Table`: every header sorts by its `key` unless `sortable: false`
  (computed/label-only columns). `defaultSort` must be a server-allowed
  `sortProperty`; extend the useCase allowlist for real columns instead of
  sorting by raw UUIDs. Read-only lists set `hideManage`. Row-lifecycle locks
  via `isRowLocked` (hides Edit+Delete) with per-action overrides
  `isRowUpdateLocked` / `isRowDeleteLocked` + `lockedLabel` (e.g. PR hides both
  when closed, SO hides both unless draft, DO hides Edit on
  delivered/cancelled and Delete unless draft). Edit forms redirect
  to the detail page on update, to the list on create.
- `organization_id` is resolved from the actor, never from payloads, never
  updatable. Joi schemas reject unknown keys by default — keep it that way.
  Strict same-org everywhere: List useCases always push an `organization_id`
  condition (linked → own org, unlinked/anonymous → `NULL`, i.e. unlinked rows
  only). Get/Update/Delete/convert compare the row's org to the actor's and
  throw `NotFoundException` (404, never 403) on mismatch to avoid leaking
  cross-org existence. The only exception is `UserListUseCase` (admin user
  administration keeps full visibility + opt-in `filter[org_scope]=actor`).
- Soft delete (`deleted_at`) on everything; master-data names unique per org
  (partial unique index `NULLS NOT DISTINCT` + `DuplicateEntityException` 409
  on create/rename, plus `UniqueConstraintError` mapping for races).
- Client dropdowns that depend on other entities must degrade independently
  (`Promise.allSettled`, per-panel errors) — never blank the primary view
  because a sibling fetch failed (see testsuite F-02).
- Modals: portal to `document.body` — ancestor cards use `backdrop-blur`, which
  traps `position: fixed` overlays (see LeadActivityModal).
- Money display is `libraries/Currency.ts` `formatMoney` (id-ID thousand
  grouping, `—` fallback) with right-aligned `tabular-nums` cells/rows —
  display-only; inputs stay raw and snapshots stay unformatted numbers.
- Document numbers (PR/SO/DO): `{PR|SO|DO}/YYYY/{roman MM}/{5-digit seq}`,
  unique per organization (partial unique index `NULLS NOT DISTINCT` +
  `doc_number IS NOT NULL`). Sequence is per (org, type, year-month) via
  `sales_doc_sequences` + atomic `nextDocNumber()` (`app/sales/libraries/`,
  INSERT-then-UPDATE…RETURNING, race-safe incl. NULL orgs); creates stamp it,
  updates never touch it. Lists show Doc No instead of ID and sort by it.
- Converted-state UI reads ground-truth rows, never status strings: lead with
  `customer.lead_id` hides Convert (links View customer); PR with an SO hides
  Edit/Delete (links View sales order → SO list pre-filtered by PR). Button
  visibility by lifecycle status: PR Create on approved/closed; SO Edit/Delete
  on draft, Create delivery when not draft/cancelled; DO Edit on
  draft/packed/shipped, Delete on draft.
- DO lines are capped by remaining qty: ordered − shipped/delivered (paper and
  system both consume; draft/packed/cancelled don't), exact product+variant
  match summed across duplicate rows, 400 never silently capped — enforced in
  `DeliveryOrderCreateUseCase`, mirrored client-side (`max` + hint). DO items
  are fixed after creation (update accepts notes + status only); `packed` ships
  via the ship endpoint, `delivered` only from `shipped`.
- POS prices are server-authoritative product/variant snapshots; clients never
  submit or edit `unit_price`. Product discovery is limited to the selected
  warehouse's stock rows, and changing warehouses clears the cart and resets
  fulfillment to system stock deduction. New sales default to 10% tax and
  snapshot `tax_pct`/`tax_amount`; debit/credit requires only the card's final
  four numeric digits (`card_last_four`), never the full card number.
- Create payloads are mode-split: immutable links (`customer_id`,
  `purchase_request_id`, `sales_order_id`, `warehouse_id`) and create-only keys
  go out on edit; creates start at `draft` (PR create accepts draft-only
  status; the form shows a static note instead of the dropdown). Deep-linked
  creates (`?purchase_request_id=`, `?sales_order_id=`) lock the link field;
  list pages accept the same `filter[*]` presets via
  searchParams → `initialParams`.

## Operations

- `dotenv` is NOT installed: `export DATABASE_URL=...` before `sequelize-cli`;
  never `source .env` (line 5 breaks bash parsing).
- PM2 process is `my-next-app` (`next start -p 3000`). Never `rm -rf .next`
  while it runs. After source changes: temp `ignoreBuildErrors` → build →
  revert flag → `pm2 restart my-next-app` (see README Known issues).
- Smoke tests: `/tmp/opencode/sales-smoke.mjs` (`SMOKE_ENCRYPTED=1`,
  `BASE_URL=`), `sales-ui-smoke.mjs`. Reports in `testsuite/` (gitignored).
- Login for probes: `admin@vortexgin.com` / `admin123` (no org link).
  Clean up probe rows via the API afterwards.
