# Sales Extension — Customer, PR, SO, DO + Lead-Status Lifecycle (approved)

> Status: approved spec, to implement · Modules: `app/sales` (new entities) + `app/sass` (invoice link migration only) + `app/warehouse` (movement writer, guarded) + `app/product` (existence checks, guarded)
> Locked decisions: lead start = weight-only; prices from client; discount % only; paper DO allowed; popup has Do-nothing

Vertical-slice rule: `models/` (`toApi()` + lazy factory, `underscored:true`, `timestamps:false`) → `useCases/<entity>/` (extending `BaseUseCase`: Joi in `preExec`, `recordActivityLog`/`settleTransaction` in `postExec`) → `api/[version]/` (`export const runtime="nodejs"`, `withAuthorization(handler,[...codes])`, `ok()`/`fail()`, JSON-only `{iv,data}`) → `components/` + `views/` + `paths.ts`.

Global invariants: `organization_id` from actor (`UserModel.resolveOrganization`), never from payload; soft delete (movements append-only); Joi `unknown(false)`; perms snapshot at login; dropdowns degrade via `Promise.allSettled`; submit `disabled={isPending||loading}` + guard; filters display-only; cross-module reads degrade (uuid fallback), never block writes except DO→movement system path.

## Entities & tables

| Entity | Table | Key fields |
|---|---|---|
| `customer` | `sales_customers` | `lead_id null (origin), name, email (unique per org), phone, company_name null, notes null, organization_id, status, timestamps` |
| `customer-metadata-field` | `sales_customer_metadata_fields` | `organization_id, name (unique per org), description, status` (mirrors `lead-metadata-field`) |
| `customer-metadata` | `sales_customer_metadata` | `customer_id FK, customer_metadata_field_id FK, value text, status` (mirrors `lead-metadata`; nested write + full-replacement sync like leads) |
| `customer-activity` | `sales_customer_activities` | `customer_id FK, type enum call\|email\|meeting\|other, subject, body, occurred_at, attachment_url null, status` |
| `purchase-request` | `sales_purchase_requests` | `customer_id FK, warehouse_id null (requested bin), status draft\|submitted\|approved\|rejected\|closed, subtotal, discount_pct, grand_total, notes, organization_id` |
| `purchase-request-item` | `sales_purchase_request_items` | `purchase_request_id FK, product_id, variant_id null, qty>0, unit_price>=0 (client), discount_pct 0-100, line_total snapshot` |
| `sales-order` | `sales_orders` | `customer_id FK, purchase_request_id null, warehouse_id, status draft\|confirmed\|paid\|shipped\|cancelled, subtotal, discount_pct, grand_total, organization_id` |
| `sales-order-item` | `sales_order_items` | `sales_order_id FK, product_id, variant_id null, qty>0, unit_price>=0 (client), discount_pct 0-100, line_total snapshot` |
| `delivery-order` | `sales_delivery_orders` | `sales_order_id FK, warehouse_id, status draft\|packed\|shipped\|delivered\|cancelled, fulfillment system\|paper, stock_deducted bool, organization_id` |
| `delivery-order-item` | `sales_delivery_order_items` | `delivery_order_id FK, product_id, variant_id null, qty>0` |
| lead-status (alter) | `sales_lead_statuses` | += `weight int default 0`, `is_final bool default false` |
| invoice (alter, sass) | `sass_invoice` | += `sales_order_id uuid null`, `sales_order_number string null` (snapshot, no FK) |

Money math (server snapshot, % only): `line_total = round(qty * unit_price * (1 - discount_pct/100))`, `subtotal = Σ line_total`, `grand_total = round(subtotal * (1 - header_discount_pct/100))`. Never recomputed on read.

## F-01 Lead-status lifecycle (weight-only start)

- Migration: add `weight`, `is_final`; backfill `new(0) contacted(10) qualified(20) converted(90,final) lost(100,final)`.
- Start = `ORDER BY weight ASC, created_at ASC LIMIT 1` among `active` per org. `LeadCreate` defaults to start name (fallback `"new"`).
- Board columns sorted by `(weight, created_at)`; `Other` last. Final columns styled distinctly.
- Drop onto `is_final` (or Convert button) → portal modal: **Create running invoice** · **Create purchase request** · **Do nothing**. First two pre-fill and hide/disable with reason when target module absent; Do nothing always available and simply completes the move.

```ts
// LeadStatus list sort + create/update Joi delta
sort: [["weight","ASC"],["created_at","ASC"]]
Joi: { name, description, weight: Joi.number().integer().min(0).default(0), is_final: Joi.boolean().default(false), status }
```

## F-02 Lead → customer conversion

`POST /sales/api/v1/customers/convert {lead_id}` (perm `sales:customer:create:create`):
1. Load lead same-org → 404 otherwise. Lookup `sales_customers where {email: lead.email.lower, organization_id}` → return `{customer, already_existed:true}` when found.
2. Create `{name, email, phone, company_name: company, notes, lead_id, organization_id}` + copy lead metadata rows → customer metadata (field resolve-by-id or create-by-`field_name` per org, reuse-by-name; values copied verbatim; lead rows untouched). Nested `metadata[]` also accepted on direct customer create/update with the same full-replacement sync as leads (omitted rows soft-deleted).
3. Mark lead `status=<converted final>` when not already (internal update, no billing).
4. UI routes to customer detail `?converted=1`. Duplicate email per org → 409 on direct customer create (plus race-map).

## F-03 Purchase request (customer-based, client prices)

```ts
const prItem = Joi.object({
  product_id: Joi.string().uuid({version:"uuidv4"}).required(),
  variant_id: Joi.string().uuid({version:"uuidv4"}).allow(null).optional(),
  qty: Joi.number().integer().min(1).required(),
  unit_price: Joi.number().integer().min(0).required(),
  discount_pct: Joi.number().min(0).max(100).default(0),
  notes: Joi.string().trim().allow("", null).optional(),
});
Joi.object({
  customer_id: Joi.string().uuid({version:"uuidv4"}).required(),
  warehouse_id: Joi.string().uuid({version:"uuidv4"}).allow(null).optional(),
  discount_pct: Joi.number().min(0).max(100).default(0),
  notes: Joi.string().trim().allow("", null).optional(),
  items: Joi.array().items(prItem).min(1).max(200).required(),
}).unknown(false);
```

`customer_id` same-org validated; product/variant existence via guarded import (absent module → skip check, store uuids). Plain activity logs. Statuses `draft→submitted→approved→(SO)→closed`, `rejected` terminal.

Purchase requests support shared document metadata rows (`sales_doc_metadata_fields`): create/update accepts `metadata[]` as `{uuid?, sales_doc_metadata_field_id?, field_name?, value}`. The submitted array is a full replacement (omitted rows are soft-deleted); `field_name` creates or reuses a field in the actor organization. Forms support shared-field selection, inline field creation, and file-upload values; detail reads expose field names with UUID fallback.

## F-04 Sales order (billing-gated, PR-referable)

Same item shape as PR. `purchase_request_id` optional same-org; UI "Copy deal prices from PR" pre-fills items client-side (payload stays explicit). Server snapshots totals (same formulas). Creating SO from PR marks PR `closed` best-effort in-scope.

Sales orders use the same shared document metadata contract as purchase requests: nested `metadata[]` accepts `{uuid?, sales_doc_metadata_field_id?, field_name?, value}`, replaces the active set in full, scopes fields through the parent SO organization, and soft-deletes omitted rows. The form independently loads central field options, supports inline field creation and uploaded-file values, and Get/detail reads batch field names with UUID fallback.

PR, SO, and DO share one organization-scoped field catalog (`sales_doc_metadata_fields`, exposed at `/sales/api/v1/doc-metadata-fields`) rather than separate field-definition tables.

- `checkTransaction(actor,"sales:sales-order:create:create")` in `preExec`, per-order `settleTransaction(entity:"sales-order")` in `postExec`. SO create is gated (the money event); PR create is not.
- Routes `GET/POST /sales/api/v1/sales-orders` + `/:uuid` (+ `/:uuid/items` read via order detail joins or item list `filter[sales_order_id]`).

## F-05 Delivery order (paper allowed, system posts movements)

```ts
Joi create: { sales_order_id: uuid required, warehouse_id: uuid required, notes?, items: [{product_id, variant_id null, qty min1}] min1 max200 }
Joi ship: { fulfillment: Joi.string().valid("system","paper").required(), notes? }
```

- `draft→packed→shipped→delivered`, `cancelled` terminal. Ship transition handler (`DeliveryOrderShipUseCase`, perm `sales:delivery-order:view:ship`, **billing-gated**: `checkTransaction(actor,"sales:delivery-order:view:ship")` in `preExec`, one `settleTransaction(operation:"update", entity:"delivery_order")` in `postExec` per successful ship — paper and system alike; draft create stays a plain log):
  - `system`: guarded `import("@/app/warehouse/...")` → availability (`on_hand - reserved`, 422 when short) → `insertMovementRow` per item `{type:"out", ref_type:"delivery-order", ref_id: do_uuid}` in DB transaction → `fulfillment=system, stock_deducted=true`.
  - `paper`: no warehouse touch → `fulfillment=paper, stock_deducted=false` + persistent banner ("Paper delivery — stock not deducted"). Later `POST .../ship {fulfillment:"system"}` posts movements and flips flags without a second settle (billing happened at first ship).
  - Warehouse module absent + `fulfillment=system` requested → 400 with guidance to use paper (no 501; paper keeps ops moving).

Delivery orders use the same nested shared-document metadata contract as PR/SO. Create and update accept a full-replacement `metadata[]`; metadata remains editable without making line items mutable. Standalone metadata CRUD scopes through the parent DO and returns 404 on organization mismatch. Forms load the central field catalog independently, support inline field creation and uploaded-file values, and Get/detail batch field names with UUID fallback.

## F-06 Invoice ↔ SO link (sass migration only)

`sales_order_id uuid null` + `sales_order_number string null` on `sass_invoice` (snapshot, no FK, no new routes). Invoice List adds `filter[sales_order_id]`; `toApi` returns both (null on old DBs). Popup "Create running invoice" pre-fills org/package snapshot + SO id/number when in SO context.

## F-07 Customer activity + detail page

`customer-activity {customer_id, type call|email|meeting|other, subject, body, occurred_at, attachment_url null (COS base64-JSON parity)}`, full CRUD slice, plain logs. Customer metadata follows the lead pattern: `CustomerForm` supports pick-existing / `+ new field` rows with per-row COS File button; update syncs full-replacement per customer scope. Detail `views/customers/[uuid]` (perm `view:detail`): header + metadata list + `Sales-order history` (`SalesOrderList {customer_id, limit 50}` degraded) + `Activity section` (degraded) + `ActivityTimeline` over `customer, customer_metadata, customer_metadata_field, customer_activity, sales_order, purchase_request, delivery_order` uuids.

## Cross-module guards

```ts
// pattern for every different-module read (product labels, warehouse stock, invoice package)
try { const m = await import("@/app/product/models/ProductModel"); ... }
catch { return null; } // degrade to uuid fallback, never block writes
```

Only DO system-ship depends on warehouse writes; all other cross-module data is uuid + snapshot.

## Permission codes

```
sales:customer:list:list, create:create, view:detail/update/delete
sales:customer-metadata:list:list, create:create, view:detail/update/delete
sales:customer-metadata-field:list:list, create:create, view:detail/update/delete
sales:customer-activity:list:list, create:create, view:detail/update/delete
sales:doc-metadata-field:list:list, create:create, view:detail/update/delete
sales:purchase-request:list:list, create:create, view:detail/update/delete
sales:purchase-request-metadata:list:list, create:create, view:detail/update/delete
sales:sales-order:list:list, create:create (gated), view:detail/update/delete
sales:sales-order-metadata:list:list, create:create, view:detail/update/delete
sales:delivery-order:list:list, create:create, view:detail/update/delete, view:ship (gated)
sales:delivery-order-metadata:list:list, create:create, view:detail/update/delete
sass:invoice gains filter only (no new codes)
```

## Files to implement (order)

1. Migrations: lead-status `weight/is_final`, customers, customer-metadata-fields, customer-metadata, customer-activities, PR(+items), SO(+items), DO(+items), sass invoice SO link (+ partial unique `(organization_id,email)` on customers, `(organization_id,name)` on customer-metadata-fields, `(organization_id,code)`-style dup handling per entity)
2. `useCases/customer|customerActivity/` → routes → tables/forms → `views/customers/`
3. Lead-status weight + start-default + board sort + final popup
4. `useCases/purchaseRequest|salesOrder/` (+ totals snapshot, convert, PR→SO close) → routes → views
5. `useCases/deliveryOrder/` (+ ship system/paper) → routes → views
6. Sass invoice filter + pre-fill only

## Acceptance criteria

- [ ] Lead create without status → start-status (lowest weight); drop to final → popup with Invoice/PR/Do-nothing; Do-nothing completes move with no side effects.
- [ ] Convert lead twice → second returns `already_existed`, no duplicate customer; converted customer carries all lead metadata values under same field names (fields auto-created per org when missing).
- [ ] PR/SO item missing `unit_price` → 400; `discount_pct 101` → 400; totals match formulas; SO copies PR deal lines exactly.
- [ ] SO create on quota package increments `credit_usage` by 1; PR create does not; DO ship (paper or system) increments `credit_usage` by 1 exactly once (re-ship/post-to-system does not double-charge; failed 422 ship charges nothing).
- [ ] DO system-ship with short stock → 422, status unchanged; paper-ship with warehouse absent → 200 `fulfillment=paper`, banner shows; later system-post flips flags + writes `out` movements with `ref_id=do_uuid`.
- [ ] Payload `organization_id` anywhere → 400; cross-org `customer_id` → 403; unknown `filter[*]` → 400.
- [ ] `tsc --noEmit` clean; temp `ignoreBuildErrors` build → revert → `pm2 restart my-next-app`; probes `admin@vortexgin.com/admin123`, cleanup afterwards.

## Out of scope

Lot/expiry, fixed-amount discounts, auto `is_start` flag, SO←DO reverse flows, payment gateway, invoice creation inside sales (sass-owned, pre-fill only).

## Delivered updates (2026-10-09, implemented on top of this spec)

Locked decisions below extend the spec; the approved sections above are unchanged.

- **Strict same-org everywhere** (closes the unlinked-actor leak): every
  `*ListUseCase` (sales, product, warehouse) always pushes an
  `organization_id` condition — linked actors see their org, unlinked see
  unlinked-only. Lead Get/Update/Delete + convert 404 (never 403) on org
  mismatch. Exception: `UserListUseCase` keeps full visibility for admin user
  administration. Same-org `customer_id` on convert is therefore guaranteed.
- **Document numbers**: `{PR|SO|DO}/YYYY/{roman MM}/{5-digit seq}`, stamped at
  create from per-(org, type, year-month) `sales_doc_sequences` via atomic
  `nextDocNumber()` (`app/sales/libraries/docNumber.ts`); unique per
  organization (partial unique index, `NULLS NOT DISTINCT`); updates never
  touch it. Lists show/sort Doc No instead of ID; detail titles + dropdown
  labels use it with UUID fallback.
- **Relation labels on reads**: PR/SO/DO Get useCases attach
  customer/warehouse/PR + item product/variant labels (guarded eager includes
  + batch lookups, UUID fallback); detail pages render names/SKUs and items as
  tables; PR/SO/DO lists show customer names (DO resolved via parent SO).
- **Money display**: `libraries/Currency.ts` `formatMoney` (id-ID grouping),
  right-aligned `tabular-nums` on detail rows, table cells, board badges, form
  previews/labels. Inputs and snapshots stay raw.
- **Converted-state + lifecycle buttons** (ground-truth rows, not status):
  converted lead hides Convert → View customer; converted PR hides
  Edit/Delete → View sales order (SO list pre-filtered by PR); PR Create only
  on approved/closed; SO Edit/Delete only on draft, Create delivery when not
  draft/cancelled; DO Edit on draft/packed/shipped, Delete on draft.
  `Table` gained `isRowLocked` + `isRowUpdateLocked`/`isRowDeleteLocked` +
  `lockedLabel`.
- **DO remaining-qty cap**: lines capped by SO remaining (ordered −
  shipped/delivered, paper and system; exact product+variant match, summed),
  400 never silently capped; form restricts products/variants to the SO's
  lines with `max` + hint.
- **DO edit + flows**: DO edit page (notes/status only, items fixed, redirect
  to detail); `delivered` only from `shipped` (via Edit after shipping);
  deep-linked creates lock the link field (`?purchase_request_id=`,
  `?sales_order_id=`); SO/DO lists accept the same presets via
  searchParams → `initialParams`; PR/SO/DO lists filter by
  customer/warehouse (+PR/SO link) and status.
- **Forms**: create payloads omit immutable links and create-only keys per
  mode; PR creates start at draft (schema draft-only, static note in form);
  `OrderItemsEditor` moved to `app/sales/components/orderItems/`.
- **Seed**: `database/seed-sales-customer-so-sample.sql` — Acme chain
  (customer → PR closed → SO confirmed → DO packed → running invoice linked
  to SO) + sales menu rows/actions + admin menu grants (re-login to pick up).
