# Google Docs PDF Generation — PR, SO, DO, and Stock Report

> Status: approved design · Modules: `app/base` (organization template configuration), `app/sales` (PR/SO/DO generation), `app/warehouse` (filtered stock report), shared `libraries/google/`
> Stack: Next.js 16 App Router · Sequelize 6 + Postgres · Joi · Google Drive API + Google Docs API · encrypted JSON transport
> Locked decisions: one filtered stock report; templates configured per organization; encrypted base64 PDF response; request extensions only under `custom.*`; generated files are temporary; repeating data uses the defined Google Docs table-row convention

Vertical-slice rule: models (`toApi()` + lazy factory, `underscored:true`, `timestamps:false`) → use cases (Joi in `preExec`, organization checks before reads) → API (`export const runtime="nodejs"`, `withAuthorization`, `ok()`/`fail()`) → components/views. Google API clients and renderers are non-use-case helpers under `libraries/google/`; domain parameter builders are non-use-case helpers under each module's `libraries/pdf/`.

Global invariants: `organization_id` is resolved from the authenticated actor, never accepted from payloads, and never updatable. Joi rejects unknown keys. Cross-organization document/configuration reads return 404. Generation endpoints never accept a Google template ID. The existing encrypted transport is JSON-only, so PDF bytes are returned as base64 inside the encrypted response rather than as a raw binary response.

## 1. Objective

Provide authenticated API and UI actions to generate, download, and print PDF documents for:

- Purchase Request (PR)
- Sales Order (SO)
- Delivery Order (DO)
- One filtered stock report

Google Docs is the template editor. A generation request copies the organization's configured master template, replaces Mustache-style parameters in the copy, expands repeating table rows, exports the completed copy to a temporary PDF on the application server, deletes the copied Google document, returns the PDF as encrypted base64 JSON, and deletes the local temporary PDF. Master templates are never modified or deleted.

## 2. Scope

### MVP

- One organization-scoped configuration for each document type: `purchase_request`, `sales_order`, `delivery_order`, and `stock_report`.
- Synchronous generation.
- Existing PR/SO/DO detail permissions and stock list permission are reused.
- Canonical business values always come from the database.
- Callers may supply validated presentation values only under `custom.*`.
- Stock report exports all rows matching the validated filters, independent of UI pagination, with a default hard cap of 1,000 rows.
- Default maximum generated PDF size is 10 MB.
- PDFs and copied Google documents are temporary and are not archived.
- Generation is not billing-gated.

### Out of scope

- Permanent PDF history/archive or database attachment
- Email delivery, digital signatures, approval signatures, QR verification
- Background jobs and notification queues
- User-supplied template IDs on generation requests
- Global/cross-organization template fallback
- Historical stock-as-of reporting
- Nested Mustache sections, conditions, expressions, or arbitrary scripts

## 3. End-to-end flow

```text
Browser
  │ encrypted JSON request
  ▼
Next.js generation route
  │ session + permission + actor
  ▼
Generate*PdfUseCase
  ├─ validate UUID/filter/output/locale/timezone/custom parameters
  ├─ resolve actor organization
  ├─ load the in-scope business record(s)
  ├─ resolve the active template configuration
  └─ build canonical parameters
  ▼
GoogleDocsPdfGenerator
  ├─ copy master template into the temporary Drive folder
  ├─ read and validate copied document structure
  ├─ expand repeating table rows
  ├─ replace scalar placeholders
  ├─ export the copy as application/pdf
  ├─ write a unique temporary server PDF
  └─ delete copied Google document in finally
  ▼
Encrypted ok() response
  │ filename + MIME type + size + base64
  ▼
Browser PDF Blob
  ├─ download
  └─ open/print
```

Detailed sequence:

1. The client submits an encrypted JSON request.
2. The route authenticates the session and checks the existing entity permission.
3. The use case validates all request keys and resolves the actor's organization.
4. The use case loads authoritative data in the same organization. A missing or cross-organization record produces 404.
5. The use case loads the active `base_document_templates` row for the actor organization and requested document type. There is no global fallback.
6. A domain parameter builder produces the canonical parameter object and merges only validated values beneath `custom`.
7. Drive API copies the configured master Google Doc into the configured temporary Drive folder. The copied document ID is retained immediately for cleanup.
8. Docs API expands repeating rows and replaces scalar placeholders on the copied document.
9. Drive API exports the copied document as PDF.
10. The application writes the PDF bytes to a unique file in `PDF_TEMP_DIRECTORY`.
11. The copied Google document is deleted in a `finally` block after export, including on render/export failure.
12. The application reads the local PDF, verifies its size, and returns it as base64 through the normal encrypted `ok()` envelope.
13. The local file is deleted in a `finally` block after response preparation.
14. The client converts base64 to a PDF `Blob`, then downloads it or opens it for printing.

Every request uses a UUID-based Google copy name and local filename. Concurrent requests must never share mutable copies or overwrite one another.

## 4. Organization template configuration

### Model and migration

Add `base_document_templates`:

```text
uuid              uuid primary key
organization_id   uuid nullable
document_type     enum/string: purchase_request|sales_order|delivery_order|stock_report
name              varchar(160)
google_doc_id      varchar(255)
status             enum: active|inactive|deleted (default active)
created_at         timestamp
updated_at         timestamp
deleted_at         timestamp nullable
```

Rules:

- `organization_id` is resolved from `UserModel.resolveOrganization(actorUuid)` and rejected in create/update payloads.
- Linked actors manage only their organization. Unlinked actors manage only `organization_id IS NULL` configurations.
- One non-deleted row is allowed per `(organization_id, document_type)` using a partial unique index with `NULLS NOT DISTINCT` semantics. Create conflicts and races map to `DuplicateEntityException` 409.
- Configuration updates may change `name`, `google_doc_id`, or `status`, but not `organization_id` or `document_type`.
- Deletes are soft deletes.
- A generation request uses only a row where `status = active` and `deleted_at IS NULL`.
- Missing active configuration produces 422: `No active <document type> PDF template is configured for this organization.`
- Template configuration is master data: create/update/delete record plain activity logs and consume no billing credit.

### Configuration API

```http
GET    /base/api/v1/document-templates
POST   /base/api/v1/document-templates
GET    /base/api/v1/document-templates/{uuid}
PUT    /base/api/v1/document-templates/{uuid}
DELETE /base/api/v1/document-templates/{uuid}
POST   /base/api/v1/document-templates/{uuid}/validate
```

Every route exports `runtime = "nodejs"`. List supports:

```text
filter[q]
filter[document_type]
filter[status]
sortProperty=name|document_type|status|created_at|updated_at
sortDirection=asc|desc
offset
limit (1-100, default 20)
```

Create request:

```json
{
  "document_type": "purchase_request",
  "name": "Default Purchase Request",
  "google_doc_id": "1AbCdEfGhIjKlMnOpQrStUvWxYz",
  "status": "active"
}
```

The UI may accept a full Google Docs URL or a raw document ID. The client can extract the ID for convenience, but the server must also normalize and validate the value and store only the document ID. Arbitrary URLs, path fragments, query strings, and IDs outside the allowed format are rejected.

### Permissions and view

```text
base:document-template:list:list
base:document-template:create:create
base:document-template:view:detail
base:document-template:view:update
base:document-template:view:delete
base:document-template:view:validate
base:menu:base:document-templates
```

Add organization-scoped list/create/detail/edit views under `app/base/views/document-templates/`, using the shared form kit and normal `requireSession()` + `AuthComponent` + `AccessDenied` pattern. Re-login is required after action grants change because permissions are snapshotted at login.

### Template validation endpoint

Validation is read-only and does not copy, modify, or delete the master. It checks:

- The configured ID exists and is a Google Docs document.
- The service account can read and copy it.
- The master is not inside the configured temporary-output folder.
- Required scalar placeholders exist for the configured document type.
- Required repeating collections and prototype rows exist.
- Section markers are balanced and structurally valid.
- Placeholder tokens can be read as continuous token text.
- Unknown placeholders are returned as warnings; malformed placeholders and missing required placeholders are errors.

Example response:

```json
{
  "valid": false,
  "errors": [
    "Missing required placeholder: {{document.number}}",
    "Missing repeating row section: items"
  ],
  "warnings": [
    "Unknown placeholder: {{customer.address}}"
  ],
  "placeholders": [
    "document.number",
    "customer.name",
    "items.product_name"
  ]
}
```

Configuration may be saved before validation so an administrator can correct sharing or template content later. Generation always performs structural safeguards and fails rather than returning a PDF containing unresolved or malformed tokens.

## 5. Template contract

### Scalar placeholders

Templates use dotted Mustache-style names:

```text
{{document.number}}
{{document.status}}
{{document.created_date}}
{{customer.name}}
{{warehouse.code}}
{{warehouse.name}}
{{totals.subtotal}}
{{totals.discount_pct}}
{{totals.grand_total}}
{{notes}}
{{generated.at}}
{{generated.by}}
{{custom.prepared_by}}
{{custom.footer_note}}
```

Rules:

- A placeholder must be continuous text. Template authors must not apply different styling to only part of a token because Google Docs may split it into separate text runs.
- Names are case-sensitive.
- Scalar values are converted to text by the server before replacement.
- Missing optional values render as `—` or an empty string according to the parameter definition; required values fail generation when absent.
- Unknown/unresolved placeholders must not appear in a successful PDF.
- Money uses the existing `libraries/Currency.ts` `formatMoney` behavior; stored snapshots and inputs remain unformatted.
- Dates are formatted from server values using an allowlisted locale and timezone. Client-supplied formatted business values are not trusted.

### Repeating table rows

Google Docs does not execute native Mustache loops. The renderer therefore supports a constrained table-row convention for `items`, `metadata`, and `stocks`.

Each repeating collection has exactly one prototype data row. The row contains an opening marker, row placeholders, and a closing marker, for example:

```text
{{#items}} | {{items.no}} | {{items.product_sku}} | {{items.product_name}} | {{items.variant_name}} | {{items.qty}} | {{items.unit_price}} | {{items.discount_pct}} | {{items.line_total}} | {{/items}}
```

Markers may occupy dedicated first/last cells or share cells with row content, but every marker and placeholder must remain continuous text. The renderer:

1. Reads the document structure and locates the table row containing `{{#<collection>}}` and `{{/<collection>}}`.
2. Rejects missing, duplicated, nested, or unbalanced prototype rows.
3. Inserts one formatted row for each collection element and replaces its row placeholders.
4. Numbers rows from one using `<collection>.no`.
5. Removes the prototype markers and prototype row.
6. Produces the table header with no data rows when the collection is empty; document-specific required collections may instead reject empty data.

Supported collections:

- `items` for PR, SO, and DO
- `metadata` for PR, SO, and DO custom metadata
- `stocks` for the stock report

Nested sections, conditional sections, array expressions, functions, and HTML are unsupported in MVP.

## 6. Parameter ownership and request validation

Canonical business namespaces are server-owned:

```text
document
organization
customer
warehouse
purchase_request
sales_order
totals
items
metadata
stocks
filters
report
generated
```

The request cannot provide or override these namespaces. Only `custom` is caller-controlled:

```json
{
  "output": "download",
  "locale": "id-ID",
  "timezone": "Asia/Jakarta",
  "custom": {
    "prepared_by": "Budi",
    "footer_note": "Internal use only"
  }
}
```

Common Joi rules:

```text
output: download|print (default download)
locale: allowlist, initially id-ID|en-US (default id-ID)
timezone: server allowlist of IANA names (default Asia/Jakarta)
custom: object, maximum 20 keys
custom key: ^[a-z][a-z0-9_]{0,49}$
custom value: string, maximum 500 characters
unknown top-level and custom value types: rejected
```

`output` controls the suggested browser behavior and response filename metadata; it does not alter the PDF bytes. Custom values are escaped as plain text, are never interpreted as HTML or Docs API commands, and must not be logged in full.

## 7. Generation APIs

### Purchase Request

```http
POST /sales/api/v1/purchase-requests/{uuid}/pdf
Permission: sales:purchase-request:view:detail
```

### Sales Order

```http
POST /sales/api/v1/sales-orders/{uuid}/pdf
Permission: sales:sales-order:view:detail
```

### Delivery Order

```http
POST /sales/api/v1/delivery-orders/{uuid}/pdf
Permission: sales:delivery-order:view:detail
```

### Filtered stock report

```http
POST /warehouse/api/v1/stocks/pdf
Permission: warehouse:stock:list:list
```

Stock request:

```json
{
  "output": "download",
  "locale": "id-ID",
  "timezone": "Asia/Jakarta",
  "filter": {
    "q": "",
    "warehouse_id": "00000000-0000-4000-8000-000000000000",
    "product_id": "00000000-0000-4000-8000-000000000000",
    "variant_id": "00000000-0000-4000-8000-000000000000",
    "low_only": false
  },
  "sortProperty": "created_at",
  "sortDirection": "desc",
  "custom": {
    "prepared_by": "Warehouse Team"
  }
}
```

The stock generator reuses the stock list filter semantics and organization condition, but it must not call the existing paginated list repeatedly or inherit its 100-row request limit. A dedicated export query loads all matching rows in one deterministic order up to `PDF_STOCK_MAX_ROWS`. If more rows match, return 413 rather than silently truncating. `qty_available` is always computed as `qty_on_hand - qty_reserved`.

### Success response

All generation routes use the normal encrypted JSON response:

```json
{
  "success": true,
  "code": 200,
  "ts": 1791455400,
  "message": "",
  "data": {
    "filename": "PR-2026-X-00001.pdf",
    "content_type": "application/pdf",
    "size": 184220,
    "data_base64": "JVBERi0xLjQK...",
    "output": "download",
    "generated_at": "2026-10-08T10:30:00.000Z"
  }
}
```

Base64 increases response size by approximately 33%, but preserves the existing encrypted JSON contract. Enforce `PDF_MAX_BYTES` against raw PDF bytes before base64 conversion. Filenames use sanitized document numbers (`/` becomes `-`) and must not contain user-controlled path characters.

## 8. Canonical parameter catalogs

### Common generated and organization values

```text
generated.at
generated.by
generated.locale
generated.timezone
organization.id
organization.name
custom.<validated_key>
```

When organization/user labels are unavailable, IDs may be used as documented fallbacks; missing authoritative values must not be taken from `custom`.

### Purchase Request

```text
document.uuid
document.number
document.type = PR
document.status
document.created_at
document.created_date

customer.id
customer.name

warehouse.id
warehouse.code
warehouse.name

totals.subtotal
totals.discount_pct
totals.grand_total
notes

items[].no
items[].product_id
items[].product_sku
items[].product_name
items[].variant_id
items[].variant_sku
items[].variant_name
items[].qty
items[].unit_price
items[].discount_pct
items[].line_total
items[].notes

metadata[].no
metadata[].name
metadata[].value
```

### Sales Order

The Sales Order catalog contains the same customer, warehouse, total, item, metadata, note, document, organization, and generated values, plus:

```text
document.type = SO
purchase_request.id
purchase_request.number
purchase_request.status
```

The parameter builder must resolve the referenced PR document number explicitly; the current SO API relation shape exposes only PR ID/status and is not sufficient by itself.

### Delivery Order

```text
document.uuid
document.number
document.type = DO
document.status
document.fulfillment
document.stock_deducted
document.created_at
document.created_date

sales_order.id
sales_order.number
sales_order.status
customer.id
customer.name
warehouse.id
warehouse.code
warehouse.name
notes

items[].no
items[].product_id
items[].product_sku
items[].product_name
items[].variant_id
items[].variant_sku
items[].variant_name
items[].qty

metadata[].no
metadata[].name
metadata[].value
```

The DO builder explicitly resolves the parent SO and customer; it must not assume those labels are present in the current DO `toApi()` result.

### Stock report

```text
report.title
report.generated_at
report.generated_by
report.total_rows

filters.query
filters.warehouse
filters.product
filters.variant
filters.low_only

stocks[].no
stocks[].warehouse_id
stocks[].warehouse_code
stocks[].warehouse_name
stocks[].product_id
stocks[].product_sku
stocks[].product_name
stocks[].variant_id
stocks[].variant_sku
stocks[].variant_name
stocks[].qty_on_hand
stocks[].qty_reserved
stocks[].qty_available
stocks[].status
stocks[].updated_at
```

## 9. Organization and authorization rules

- Every generation use case receives the authenticated actor and resolves the organization before loading data or configuration.
- PR/SO/DO generation returns 404 for missing, deleted, or cross-organization rows; never return 403 in a way that leaks cross-organization existence.
- Stock generation always pushes `organization_id = actor organization`; an unlinked actor is restricted to `organization_id IS NULL`.
- Template CRUD follows the same strict organization rules.
- Generation routes never trust a template ID, organization ID, totals, labels, quantities, item array, or metadata array from the request.
- Existing PR/SO/DO Get use cases currently do not all receive an actor. Generation must not blindly reuse an unscoped Get result: either refactor the Get use case to accept and enforce the actor scope without breaking its callers, or implement the scoped lookup in the generation use case.
- Related labels use guarded eager/batch reads with UUID fallback, consistent with existing PR/SO/DO/stock rules. Missing optional labels do not authorize cross-organization reads.

## 10. Google integration and configuration

Add the Google API client dependency (recommended official Node client: `googleapis`) and shared helpers:

```text
libraries/google/GoogleAuth.ts
libraries/google/GoogleDriveClient.ts
libraries/google/GoogleDocsClient.ts
libraries/google/GoogleDocsTemplateRenderer.ts
libraries/google/GoogleDocsPdfGenerator.ts
```

Environment variables:

```dotenv
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY=
GOOGLE_DRIVE_TEMP_FOLDER_ID=
PDF_TEMP_DIRECTORY=/tmp/vortexgin-pdf
PDF_MAX_BYTES=10485760
PDF_STOCK_MAX_ROWS=1000
PDF_GENERATION_TIMEOUT_MS=30000
```

Configuration requirements:

1. Enable Google Drive API and Google Docs API in the Google Cloud project.
2. Create a service account and securely configure its email/private key.
3. Share every organization master template and the dedicated temporary folder with the service-account email.
4. Grant enough access to copy templates, edit/export copies, and delete temporary copies.
5. Keep master templates outside the temporary folder so cleanup can never identify them as disposable copies.
6. Normalize escaped private-key newlines at runtime; never commit credentials or print them in logs.

The service account should use only the minimum Drive/Docs scopes required. Domain-wide delegation is not required when templates/folders are explicitly shared with the service account.

## 11. Cleanup, retries, and operational safety

Google cleanup pattern:

```text
copy template
remember copied document ID
try:
  render copy
  export PDF
finally:
  delete copied Google document
```

Local cleanup pattern:

```text
write unique temporary PDF
try:
  read bytes
  enforce size
  build base64 response data
finally:
  delete temporary PDF
```

Safeguards:

- Temporary names contain a random UUID and sanitized document/report name.
- File paths are created by the server and never derived directly from request values.
- Google 429 and transient 5xx operations may retry a small bounded number of times with exponential backoff; validation/auth/permission errors are not retried.
- Once a copy ID exists, retry logic must not create additional copies unless the previous copy is first accounted for and cleanup remains guaranteed.
- Cleanup failure is logged with request correlation data and copied document ID, but never with credentials or PDF/base64 contents.
- Failure to delete the Google copy after a successful export does not replace the successful PDF result, but it must be observable.
- Add an operational cleanup command/job that removes copied documents in the temporary Drive folder and local files in `PDF_TEMP_DIRECTORY` older than one hour. It must only target the dedicated temporary folder/path and must never scan/delete arbitrary Drive or filesystem content.
- Generation obeys `PDF_GENERATION_TIMEOUT_MS`; timeouts still execute cleanup.

No generated PDF path, Google copy ID, or base64 body is stored in business tables. Standard application logs may record document type, entity UUID, actor UUID, duration, result, and byte size. PDF generation does not create a billing transaction.

## 12. Errors

| Condition | HTTP status |
|---|---:|
| Invalid UUID, filters, locale, timezone, output, or custom value | 400 |
| Malformed/unsupported template structure during generation | 400 when validating; 500 when an active template changed unexpectedly |
| Missing or cross-organization business/config record | 404 |
| Duplicate organization + document type configuration | 409 |
| No active organization template | 422 |
| Stock result exceeds configured row limit | 413 |
| Raw generated PDF exceeds configured byte limit | 413 |
| Google credentials or temporary folder not configured | 503 |
| Google authentication, sharing, or API permission failure | 502 |
| Google rate limit remains after bounded retries | 503 |
| Generation timeout | 504 |
| Unexpected render/export/filesystem failure | 500 |

Errors use the existing `fail()` envelope and `getErrorStatus()` mapping. Responses must not expose credentials, internal file paths, Google stack traces, or base64 fragments.

## 13. UI behavior

Add shared PDF actions to:

- PR detail page
- SO detail page
- DO detail page
- Stock list toolbar (using the active UI filters/sort, not pagination)

Download flow:

1. Call the generation endpoint with `postEncrypted`.
2. Validate `content_type`, size, and `data_base64` presence.
3. Decode base64 and create `Blob([bytes], {type:"application/pdf"})`.
4. Create an object URL and trigger an `<a download>` with the server filename.
5. Revoke the object URL.

Print flow:

1. Generate the same PDF with `output:"print"`.
2. Create a PDF Blob URL.
3. Open it in a new browser tab or a controlled print frame.
4. Invoke printing only after the PDF is loaded; if browser policy blocks automatic printing, leave the PDF viewer open so the user can print manually.
5. Revoke the object URL when safe.

Buttons are permission-gated, disabled while pending, and protected by a matching submit/click guard. Generation progress uses `role="status"`; failures use `role="alert"`. The primary detail/list view remains usable when generation fails.

## 14. Implementation map

```text
migrations/<date>-create-base-document-templates.js

app/base/models/DocumentTemplateModel.ts
app/base/useCases/documentTemplate/
  DocumentTemplateListUseCase.ts
  DocumentTemplateGetUseCase.ts
  DocumentTemplateCreateUseCase.ts
  DocumentTemplateUpdateUseCase.ts
  DocumentTemplateDeleteUseCase.ts
  DocumentTemplateValidateUseCase.ts
app/base/api/[version]/document-templates/route.ts
app/base/api/[version]/document-templates/[uuid]/route.ts
app/base/api/[version]/document-templates/[uuid]/validate/route.ts
app/base/components/documentTemplate/
app/base/views/document-templates/

libraries/google/GoogleAuth.ts
libraries/google/GoogleDriveClient.ts
libraries/google/GoogleDocsClient.ts
libraries/google/GoogleDocsTemplateRenderer.ts
libraries/google/GoogleDocsPdfGenerator.ts

app/sales/libraries/pdf/purchaseRequestPdfParameters.ts
app/sales/libraries/pdf/salesOrderPdfParameters.ts
app/sales/libraries/pdf/deliveryOrderPdfParameters.ts
app/sales/useCases/purchaseRequest/GeneratePurchaseRequestPdfUseCase.ts
app/sales/useCases/salesOrder/GenerateSalesOrderPdfUseCase.ts
app/sales/useCases/deliveryOrder/GenerateDeliveryOrderPdfUseCase.ts
app/sales/api/[version]/purchase-requests/[uuid]/pdf/route.ts
app/sales/api/[version]/sales-orders/[uuid]/pdf/route.ts
app/sales/api/[version]/delivery-orders/[uuid]/pdf/route.ts

app/warehouse/libraries/pdf/stockPdfParameters.ts
app/warehouse/useCases/stock/GenerateStockPdfUseCase.ts
app/warehouse/api/[version]/stocks/pdf/route.ts

components/PdfActions.tsx
```

Template configuration is a Base-module entity. Sales and Warehouse generators may statically import the Base template model/use case because Base is a required foundation module. Domain parameter builders remain in their owning modules. No generated-file model or archive migration is added.

## 15. Acceptance criteria

- [ ] An organization admin can create, list, view, update, soft-delete, and validate one template configuration for each supported document type.
- [ ] A second active/non-deleted configuration for the same organization and document type returns 409, including database races.
- [ ] Payload `organization_id` and generation payload template IDs are rejected with 400.
- [ ] Template validation reports missing required placeholders, malformed section markers, inaccessible documents, and unknown-placeholder warnings without changing the master.
- [ ] PR, SO, and DO generation uses the authenticated actor's active organization template and authoritative in-scope business data.
- [ ] Cross-organization document/configuration generation returns 404; an unlinked actor sees only null-organization rows/configuration.
- [ ] A missing/inactive template returns 422 with a document-specific message.
- [ ] Scalar tokens are replaced without changing surrounding template formatting, and no unresolved token remains in a successful PDF.
- [ ] PR/SO/DO item rows and metadata rows repeat correctly; a stock report repeats all matching stock rows in deterministic order.
- [ ] Stock filters match the stock list semantics, ignore UI pagination, and never silently truncate; over-limit results return 413.
- [ ] Stock `qty_available` equals `qty_on_hand - qty_reserved` for every row.
- [ ] Money uses existing `formatMoney`; inputs and stored snapshots remain unchanged.
- [ ] Request values can populate only `custom.<validated_key>` and cannot override document, relation, quantity, stock, or monetary values.
- [ ] Each concurrent request receives a unique Google copy and local temporary filename.
- [ ] The copied Google document is deleted after export and on render/export failure.
- [ ] The local PDF is deleted after response preparation and on size/encoding failure.
- [ ] Success returns an encrypted `ok()` envelope containing a valid base64 `application/pdf`; the browser can download it and open it for printing.
- [ ] A raw PDF over `PDF_MAX_BYTES` returns 413 before base64 conversion.
- [ ] Google/configuration failures return controlled envelopes without credentials, internal paths, or PDF contents.
- [ ] Generation consumes no billing credit and does not alter PR/SO/DO/stock records.
- [ ] All new API routes use `runtime="nodejs"`; TypeScript checks and the project build pass under the repository's documented workflow.

## 16. Test plan

### Unit

- Template ID/URL normalization and rejection cases.
- Scalar flattening, escaping, missing optional values, unresolved token detection.
- Repeating-row parsing: one row, multiple rows, empty collection, missing/duplicate/unbalanced/nested markers.
- Money/date/timezone formatting.
- Filename sanitization and raw byte-size enforcement.
- Stock available quantity and row-limit detection.
- Reserved namespace rejection and `custom` key/value limits.

### Integration with mocked Google clients

- Copy → render → export → Google delete success order.
- Google delete runs after render/export failure.
- Local delete runs after success and response-preparation failure.
- Bounded retries for 429/5xx do not leak extra copies.
- Template validation is read-only.
- Encrypted base64 response decrypts to the expected PDF bytes.

### Authorization/data

- Same-org PR/SO/DO/config success; cross-org and deleted rows return 404.
- Unlinked actor is null-org only.
- Existing detail/list permission grants generation; missing permission returns the standard 403.
- Stock filters and sort match regular stock behavior while exporting beyond the UI page size.

### Manual

- Validate representative PR, SO, DO, and stock Google Docs templates.
- Generate documents containing long notes, optional null values, custom metadata, zero discounts, variants/no variants, and enough rows to span pages.
- Verify download filename, PDF rendering, browser print flow, formatting preservation, and cleanup in Drive/local temp storage.
- Re-login after applying new permission grants before probing APIs.
