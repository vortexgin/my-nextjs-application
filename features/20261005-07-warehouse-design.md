# Warehouse Module — Design Spec (skeleton v1, import + opname)

> Status: skeleton scaffolded, UseCases/API/UI to implement · Submodule: `app/warehouse` (`vortexgin/my-warehouse-library`)
> Includes: `warehouse`, `stock` (read-only, movement-written), `movement` (append-only) + import (opening-balance / opname)
> Consumes: `app/product` (`product_id` / `variant_id` FK only) · Prepares: Sales Order (`qty_reserved`, `ref_type/ref_id`, `reserve/release` reserved)

Vertical-slice rule: `models/` (`toApi()` + lazy factory, `underscored:true`, `timestamps:false`) → `useCases/<entity>/` (extending `BaseUseCase`: Joi in `preExec`, `recordActivityLog` in `postExec`) → `api/[version]/` (`export const runtime="nodejs"`, `withAuthorization(handler,[...codes])`, `ok()`/`fail()`, JSON-only `{iv,data}`) → `components/` + `views/` + `paths.ts`.

Global invariants: `organization_id` from actor (`UserModel.resolveOrganization`), never from payload; soft delete (movements: never edited — reversal is a new row); Joi `unknown(false)`; perms snapshot at login (re-login after grants); dropdowns degrade via `Promise.allSettled`; submit `disabled={isPending||loading}` + guard; filters display-only; base64-inside-JSON for files (import uses CSV→JSON client-side, no file bytes to server).

## Skeleton landed

```
app/warehouse/
  layout.tsx (DashboardShell + requireSession)
  README.md (entity→table→route map)
  models/ WarehouseModel (wrh_warehouses), StockModel (wrh_stocks), MovementModel (wrh_movements)
  useCases/ warehouse/, stock/, movement/ (.gitkeep — implement next)
  api/[version]/ warehouses/, stocks/, movements/ (dirs — routes next)
  components/ warehouse/, stock/, movement/ (dirs — tables/forms next)
  views/ warehouses/paths.ts (+ stocks/, movements/ dirs — pages next)
```

Migrations + partial unique indexes are next (not scaffolded): `(organization_id, code)` on warehouses, `(organization_id, warehouse_id, product_id, variant_id)` on stocks with `NULLS NOT DISTINCT`.

---

## F-01 Warehouse

As ops admin, I manage locations (code, name, address) per org so stock isolates by bin.

```ts
const createWarehouseSchema = Joi.object({
  code: Joi.string().trim().min(2).max(30).required(), // normalized toUpperCase
  name: Joi.string().trim().min(2).max(120).required(),
  address: Joi.string().trim().allow("", null).max(255).optional(),
  status: Joi.string().valid("active","inactive","deleted").optional(),
}).unknown(false);
```

List: `filter{q,code,name,status}` (`q` over code/name), `limit 1-100 default 20`, `applyOrganizationScope`. Duplicate `code` per org → 409 + race-map. Routes `GET/POST /warehouse/api/v1/warehouses` + `GET/PUT/DELETE /:uuid` with `warehouse:warehouse:list:list`, `create:create`, `view:detail/update/delete`.

## F-02 Stock (read-only API)

As ops/sales user, I see `on_hand / reserved / available (= on_hand - reserved)` per warehouse×product×variant so orders validate and counters plan opname.

- No Create/Update/Delete UseCases or routes. Rows are find-or-created by the movement writer (`where {warehouse_id, product_id, variant_id, organization_id, deleted_at:null}` → create `{qty 0}` when absent). Direct qty edits are rejected by design (single-writer principle).
- `StockListUseCase`: `filter{warehouse_id uuid, product_id uuid, variant_id uuid, low_only boolean, q}` (`q` matches product sku/name via org product map, server-side, capped), `limit 1-100 default 20`, org-scoped. `StockGetUseCase`: uuid → 404. No billing, no activity write on read.
- Routes: `GET /warehouse/api/v1/stocks`, `GET /:uuid` with `warehouse:stock:list:list`, `view:detail`. UI `StockTable` read-only + `LOW` badge (`available<=0`) + link to movement history (`filter[product_id]&filter[warehouse_id]`).

## F-03 Movement (append-only ledger)

As warehouse staff, I record `in` (inbound), `out` (outbound), `transfer`, and `adjust` (opname) so every qty change is auditable. Rows are never edited — mistakes are reversed by a counter-movement.

```ts
const createMovementSchema = Joi.object({
  warehouse_id: Joi.string().uuid({version:"uuidv4"}).required(),
  product_id: Joi.string().uuid({version:"uuidv4"}).required(),
  variant_id: Joi.string().uuid({version:"uuidv4"}).allow(null).optional(),
  // reserve/release RESERVED for sales-order phase — rejected in V1
  type: Joi.string().valid("in","out","adjust","transfer_in","transfer_out").required(),
  // in/out/transfer: delta qty. adjust (opname): ABSOLUTE counted qty.
  qty: Joi.number().integer().min(0).required(),
  ref_type: Joi.string().trim().max(60).allow("", null).optional(), // e.g. "opname", "import"
  ref_id: Joi.string().uuid({version:"uuidv4"}).allow(null).optional(), // opname batch uuid
  notes: Joi.when("type", {
    is: "adjust",
    then: Joi.string().trim().min(2).required(), // WHO counted + evidence — required
    otherwise: Joi.string().trim().allow("", null).optional(),
  }),
}).unknown(false);
```

Opname hardening (locked per request):
- `adjust` input `qty` = absolute counted quantity (not delta). Server computes `delta = counted - current_on_hand`.
- `balance_after >= 0` enforced in Joi-adjacent validation AND in `execute` (counted `< 0` → 400 `BadParameterException("Counted quantity cannot be negative.")`; `balance_after` is derived, never accepted from payload).
- `notes` required on `adjust` (min 2) — counter identity + evidence (e.g. `"Aisle-03 / Budi / recount-2"`). Missing → 400.
- `transfer` accepted only as a pair: UseCase writes `transfer_out` + `transfer_in` rows sharing one generated `ref_id` (`ref_type="transfer"`) in a single DB transaction; single-leg `transfer_*` from payload is expanded server-side (client sends `{type:"transfer", to_warehouse_id, qty}` — see routes).

`MovementCreateUseCase` (no Update/Delete):
- `preExec`: Joi → resolve `organizationId` → existence + same-org checks (`warehouse`, `product`, `variant` belongs to `product`) → 404/403. `qty_reserved` ignored in V1 math except `out` availability uses `on_hand - reserved`.
- `execute` (DB transaction): lock/find-or-create stock row → compute `next` per type (`in: +qty`, `out: -qty` with `next>=0` else 422 `UnprocessableEntityException("Insufficient stock.")`, `adjust: counted` with `counted>=0` else 400, transfer legs mirrored) → update `stock.qty_on_hand = next` → insert movement row(s) with `balance_after: next`. `postExec`: plain `recordActivityLog(operation:"create", entity:"movement")` (master-data class billing V1).

List: `filter{warehouse_id, product_id, variant_id, type, ref_type, ref_id, date_from, date_to}`, `sort created_at desc`, `limit 1-100 default 50`. The list query eagerly resolves warehouse `{code,name}` and product/variant `{sku,name}` labels (including soft-deleted master rows for ledger history); the table shows those labels with UUID fallback and does not issue page-level relation lookups.

## F-04 Import (opening-balance + opname)

As ops user, I upload counted/opening balances (≤500 rows) with pre-flight preview so one bad SKU never aborts the batch and quota-free master-data stays free.

CSV headers: `warehouse_code, sku, variant_sku, qty, type(in|adjust), notes`. Client parses CSV→JSON (Papa-style, `LeadImportClient` pattern); server sees JSON only.

```ts
const importRowSchema = Joi.object({
  warehouse_code: Joi.string().trim().min(1).max(30).required(),
  sku: Joi.string().trim().min(1).max(60).required(),
  variant_sku: Joi.string().trim().allow("", null).max(60).optional(),
  type: Joi.string().valid("in","adjust").required(), // transfer/out excluded from import V1
  qty: Joi.number().integer().min(0).required(), // adjust: absolute counted; in: delta
  notes: Joi.when("type", { is: "adjust",
    then: Joi.string().trim().min(2).required(),
    otherwise: Joi.string().trim().allow("", null).optional() }),
}).unknown(false);
const importEnvelope = Joi.object({ rows: Joi.array().items(importRowSchema).min(1).max(500).required() }).unknown(false);
```

- `POST .../movements/import/preview` (perm `warehouse:movement:list:list`, no writes): resolves `warehouse_code→id`, `sku→product_id`, `variant_sku→variant_id` org-scoped (upper-normalized, single batched queries) → `{valid[], unknown_warehouse[], unknown_sku[], invalid[]}`.
- `POST .../movements/import` (perm `warehouse:movement:create:create`): one logical opname batch `ref_id = randomUUID()` (`ref_type="import"`; rows with `type=adjust` additionally carry client `ref_id` when provided else batch id) → per-row `insertMovementRow` (same helper as single create, same `balance_after>=0` + notes-required rules) → `{created[], skipped[{index, reason}]}` (`unknown-warehouse|unknown-sku|validation|insufficient-stock`). Race-safe, never aborts batch.
- UI `views/movements/import/page.tsx` (gated `create:create`) → `MovementImportClient` (file → preview table → confirm → result), `Promise.allSettled`-safe panels.

## Permission codes

```
warehouse:warehouse:list:list, create:create, view:detail/update/delete
warehouse:stock:list:list, view:detail          // no create/update/delete codes by design
warehouse:movement:list:list, create:create, view:detail  // no update/delete codes (append-only)
base:menu:warehouse:* (Warehouse → Warehouses, Stocks, Movements)
```

## organization_id + billing

- `organization_id` resolved once per request from actor; warehouse code/sku/variant lookups always add org condition; cross-org `warehouse_id`/`product_id` → 403. Payload `organization_id` rejected 400.
- Billing V1: plain logs only. Later: `checkTransaction(actor,"warehouse:movement:create:create")` + per-created-row `settleTransaction(entity:"movement")` if packages bill it (mark action `is_transactions=true`).

## Files to implement next

1. Migrations (warehouses, stocks + unique idx, movements) 
2. `useCases/warehouse/` CRUD → routes → `WarehouseTable/Form` → `views/warehouses/`
3. `useCases/movement/` (`Create/List/Get` + `insertMovementRow` helper + import pair) → routes (`+import`, `+import/preview`) → `MovementTable/Form/ImportClient` → `views/movements/` + `import/`
4. `useCases/stock/` (`List/Get` only) → routes → `StockTable` → `views/stocks/`

## Acceptance criteria

- [ ] `in 10` from 0 → on_hand 10, movement `balance_after 10`; `out 4` → 6; `out 7` → 422, no write.
- [ ] `adjust qty 3 notes "A3/Budi"` from 6 → on_hand 3, `balance_after 3`; `adjust qty -1` → 400; `adjust` without notes → 400.
- [ ] Import 500 rows with 2 unknown warehouses + 1 unknown sku + 1 negative → preview flags 4, import creates 496, `skipped` reasons correct, single batch `ref_id`.
- [ ] Cross-org `warehouse_id` → 403; payload `organization_id` → 400; `PUT/DELETE /movements/:uuid` → 405 (no route; Next.js answers 405, not 404).
- [ ] `tsc --noEmit` clean; temp `ignoreBuildErrors` build → revert → `pm2 restart my-next-app`; probes `admin@vortexgin.com/admin123`, cleanup afterwards.

## Out of scope

`reserve/release` (sales-order phase), lot/expiry, reorder points, barcode printing, warehouse-to-warehouse single-leg API (server pairs transfers), CSV on server (client parses → JSON).
