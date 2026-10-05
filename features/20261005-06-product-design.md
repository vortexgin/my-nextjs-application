# Product Module — Design Spec (skeleton v1)

> Status: implemented (useCases/API/UI/migrations/seeds live) · Submodule: `app/product` (`vortexgin/my-product-library`)
> Locked: `sku` required, `base_price` on product (required), `product-variant` table, `product-metadata` + `product-metadata-field` like leads
> Next: Warehouse (`warehouse, stock, movement` FK `product_id`/`variant_id`) · Marketing (`campaign, campaign-product` FK same, promo overrides only)

Vertical-slice rule: `models/` (`toApi()` + lazy factory, `underscored:true`, `timestamps:false`) → `useCases/<entity>/` (`List/Get/Create/Update/Delete` extending `BaseUseCase`: Joi in `preExec`, `recordActivityLog` in `postExec`) → `api/[version]/` (`export const runtime="nodejs"`, `withAuthorization(handler,[...codes])`, `ok()`/`fail()`, JSON-only `{iv,data}` via `EncryptedFetch`) → `components/` + `views/` + `paths.ts`.

Global invariants: `organization_id` from actor via `UserModel.resolveOrganization`, never from payload; soft delete; Joi `unknown(false)`; session perms snapshot (re-login after grant changes); client dropdowns degrade via `Promise.allSettled`; submit `disabled={isPending||loading}` + guard; search filters display-only; file bytes base64-inside-JSON.

## Skeleton landed

```
app/product/
  layout.tsx (DashboardShell + requireSession, sales/sass parity)
  README.md (entity→table→route map)
  models/ ProductModel, ProductVariantModel, ProductCategoryModel, ProductUnitModel, ProductMetadataModel, ProductMetadataFieldModel
  useCases/ product/, productVariant/, productCategory/, productUnit/, productMetadata/, productMetadataField/ (.gitkeep — implement next)
  api/[version]/ products/, product-variants/, product-categories/, product-units/, product-metadata/, product-metadata-fields/ (dirs — routes next)
  components/ product/, productVariant/, productCategory/, productUnit/ (dirs — tables/forms next)
  views/ products/paths.ts (+ product-variants/, product-categories/, product-units/ dirs — pages next)
```

Tables: `prd_products`, `prd_product_variants`, `prd_categories`, `prd_units`, `prd_product_metadata`, `prd_product_metadata_fields`. Migrations + partial unique indexes (`organization_id, sku` / `organization_id, name` with `NULLS NOT DISTINCT`) live in `migrations/20261005-*` (applied).

---

## F-01 Product

As sales/ops user, I manage sellables (sku, name, category, unit, base_price) so Warehouse can stock them and Marketing can promo them.

Joi (mirrors `createLeadSchema` strictness):

```ts
const metadataNestedSchema = Joi.object({
  uuid: Joi.string().uuid({version:"uuidv4"}).optional(),
  product_metadata_field_id: Joi.string().uuid({version:"uuidv4"}).optional(),
  field_name: Joi.string().trim().min(2).max(160).optional(),
  variant_id: Joi.string().uuid({version:"uuidv4"}).allow(null).optional(),
  value: Joi.string().trim().min(1).required(),
});
const createProductSchema = Joi.object({
  sku: Joi.string().trim().min(2).max(60).required(), // normalized toUpperCase in execute
  name: Joi.string().trim().min(2).max(160).required(),
  description: Joi.string().trim().allow("", null).optional(),
  category_id: Joi.string().uuid({version:"uuidv4"}).allow(null).optional(),
  unit_id: Joi.string().uuid({version:"uuidv4"}).allow(null).optional(),
  base_price: Joi.number().integer().min(0).required(),
  status: Joi.string().valid("active","inactive","deleted").optional(),
  metadata: Joi.array().items(metadataNestedSchema).optional(),
}).unknown(false);
const updateProductSchema = createProductSchema.fork(["sku","name","base_price"], (s) => s.optional()).min(1);
```

List: `filter{q,sku,name,category_id,unit_id,status,price_min,price_max}` (`q` over sku/name `Op.iLike+escapeLike`), `sortProperty valid(sku,name,base_price,created_at,updated_at)`, `limit 1-100 default 20`, `applyOrganizationScope`.

Routes: `GET/POST /product/api/v1/products` (`product:product:list:list` / `create:create`), `GET/PUT/DELETE /:uuid` (`view:detail/update/delete`). Forward all `filter[*]` so unknown keys 400 (leads-route pattern).

`ProductCreateUseCase.preExec`: validate → resolve `organizationId` → duplicate `sku` check (normalized upper, scoped `where {sku, organization_id}` incl. null-org handling) → 409; `category_id`/`unit_id` existence (same-org when linked) → 404. `execute`: create + nested metadata (field resolve-by-id or create-by-`field_name`, reuse-by-name per org). `Update`: scalar patch + full-replacement metadata sync per product scope (omitted product-level rows soft-deleted; variant rows untouched). Delete product → soft-delete its variants + metadata in same UseCase (sequential updates, never hard delete).

## F-02 Product variant

As ops user, I add SKUs per option (e.g. Red/XL) with optional price override so stock/promos track granularity without duplicating products.

```ts
Joi.object({
  product_id: Joi.string().uuid({version:"uuidv4"}).required(),
  sku: Joi.string().trim().min(2).max(60).required(),
  name: Joi.string().trim().min(2).max(160).required(),
  price_override: Joi.number().integer().min(0).allow(null).optional(),
  status: Joi.string().valid("active","inactive","deleted").optional(),
}).unknown(false);
```

`organization_id` denormalized from parent product (immutable). Duplicate `sku` per org → 409. `product_id` must exist + same org → 404/403. Effective price = `price_override ?? product.base_price` (computed client + server helper, never stored back to product). Metadata with `variant_id` set nests under variant payloads.

## F-03 Category / F-04 Unit (master data)

Admin defines `category {name, description}` and `unit {name, symbol}` per org (unique per org, 409 + race-map). Same CRUD slice, plain logs. Product form dropdowns resolve by id; `ProductForm` pins current selection when outside org list (LeadForm assignee pattern). Unit lazily seeds `pcs` per org on first product create (find-or-create by name, org-scoped, logs plain row).

## F-05 Metadata field + F-06 Metadata (leads parity)

Field CRUD same as `lead-metadata-field` (name unique per org). Value rows `{product_id, variant_id null, product_metadata_field_id, value}`; direct CRUD exists but UI uses nested product/variant payloads. Variant-level rows (`variant_id` set) sync only within variant scope. File values store COS `url` strings via `POST /base/api/v1/tools/upload-file` base64-JSON (File button per row, `CLIENT_MAX_FILE_BYTES` guard).

## Permission codes

```
product:product:list:list, create:create, view:detail/update/delete
product:variant:list:list, create:create, view:detail/update/delete
product:category:list:list, create:create, view:detail/update/delete
product:unit:list:list, create:create, view:detail/update/delete
product:metadata:list:list, create:create, view:detail/update/delete
product:metadata-field:list:list, create:create, view:detail/update/delete
base:menu:product:* (Product → Products, Variants, Categories, Units)
```

No new codes for detail timeline (reuses `authorized` read on `base/activity-logs`).

## organization_id + Transaction handling

- All creates: `organizationId = resolveOrganization(actorUuid)`; lists push `{organization_id}` (products/variants/categories/units) or join via parent (metadata `where {product_id: In(orgProductIds)}` — prefer denormalized `organization_id` on variant to keep it a direct condition; metadata resolves parent product org and rejects cross-org `product_id` with 403).
- Billing V1: plain `recordActivityLog` only (master data, like statuses). If a package later gates `product:product:create:create` (`is_transactions=true` action), follow `LeadCreateUseCase`: `checkTransaction` in `preExec`, `settleTransaction(operation:"create", entity:"product")` in `postExec`.

## Files to implement next (vertical slice order)

1. Migrations (3–6 files) + seed `pcs` unit handling
2. `useCases/productCategory|unit/` (simple) → routes → `components` tables/forms → `views/product-categories|units/`
3. `useCases/product/` (+ nested metadata) → routes → `ProductTable/Form` → `views/products/` (list/create/`[uuid]`/`[uuid]/edit` + `ActivityTimeline` over all 6 entities)
4. `useCases/productVariant/` → routes → variant section inside product detail + `views/product-variants/`
5. `useCases/productMetadataField|Metadata/` → nested-first, direct CRUD second

## Acceptance criteria

- [ ] Create product `{sku:"prd-001", base_price:0}` → stored `PRD-001`, duplicate (any case) per org → 409, cross-org same SKU allowed.
- [ ] `base_price` missing/negative → 400; `price_override null` resolves to `base_price`.
- [ ] Update with omitted metadata row → row soft-deleted; variant rows untouched.
- [ ] Unlinked actor sees unlinked rows only where scoped; payload `organization_id` rejected 400.
- [ ] `tsc --noEmit` clean; build via temp `ignoreBuildErrors` → revert → `pm2 restart my-next-app`; probes `admin@vortexgin.com/admin123` cleaned up afterwards.

## Out of scope

Stock quantities, movements, warehouses (Warehouse module), promo/campaign pricing (Marketing module), CSV import (V2), product images (add `prd_product_images {product_id, variant_id null, url}` later via same upload pattern).
