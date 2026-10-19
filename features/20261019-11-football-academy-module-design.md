# Football Academy Module — Students, Coaches, Events, and Finance

> Status: draft feature specification · Module: `app/academy` (new) · Integrates: `app/base` for identity/RBAC/audit/private files and `app/sass` for organization scope
> Stack: Next.js 16 App Router · React 19 · Sequelize 6 + Postgres · Joi · encrypted JSON APIs · private COS documents
> Primary scope: student and parent records, coaches, holding accounts, participated events, event participants, financial planning, and append-only financial realization

Vertical-slice rule: models (`toApi()` + lazy factory, `underscored:true`, `timestamps:false`) → use cases (Joi in `preExec`, organization/authorization checks before reads and writes, activity logging in `postExec`) → API (`export const runtime="nodejs"`, `withAuthorization`, `ok()`/`fail()`) → components/views/paths. Non-use-case helpers such as phone normalization, private-file signing, financial row insertion, account transfer, and event summary builders live in `app/academy/libraries/` or shared `libraries/`, never inside use cases.

Global invariants: `organization_id` is resolved from the authenticated actor, never accepted from payloads, and never updatable. Lists always enforce strict organization scope (linked actor → own organization; unlinked actor → `NULL` scope only). Cross-organization Get/Update/Delete operations return 404. Joi rejects unknown keys. Configurable entities use soft delete. Financial realization rows are append-only and corrected by reversal, never edited or deleted. Student identity documents contain sensitive data about minors and must not be stored at public permanent URLs.

## 1. Objectives

The Academy module enables an organization to:

1. Maintain complete student and parent/guardian records.
2. Maintain coaches and assign them as event PICs.
3. Maintain holding bank accounts whose balances change only through financial realization entries.
4. Plan and manage events attended by students and coaches.
5. Track participant confirmation, participation fees, and transfer/payment evidence.
6. Compare event financial plan against actual money in/out.
7. Trace every event realization entry to a holding account and show account history/balance.
8. Protect student identity documents and restrict access by explicit permissions.

## 2. Feature map

| # | Feature | Primary API | Billing |
|---|---|---|---|
| F-01 | Students and private documents | `/academy/api/v1/students` | plain activity log |
| F-02 | Student parents | `/academy/api/v1/students/:uuid/parents` | plain activity log |
| F-03 | Coaches | `/academy/api/v1/coaches` | plain activity log |
| F-04 | Holding bank accounts | `/academy/api/v1/holding-accounts` | plain activity log |
| F-05 | Events and coach PICs | `/academy/api/v1/events` | plain activity log |
| F-06 | Event participants and fees | `/academy/api/v1/events/:uuid/participants` | plain activity log |
| F-07 | Event financial plan | `/academy/api/v1/events/:uuid/financial-plans` | plain activity log |
| F-08 | Financial realization ledger | `/academy/api/v1/financial-entries` | plain activity log |
| F-09 | Holding-account transfer and reconciliation | `/academy/api/v1/holding-accounts/transfers` | plain activity log |
| F-10 | Event/account financial reports | `/academy/api/v1/reports/*` | read-only |

No Academy operation is transaction/billing-gated in MVP. This can be revisited when Academy actions are included in subscription packages.

## 3. Entities and tables

| Entity | Table | Purpose |
|---|---|---|
| student | `academy_students` | Student identity, contact, school, and photo |
| student document | `academy_student_documents` | Private KIA, KK, birth-certificate, and BPJS files |
| student parent | `academy_student_parents` | Father/mother records belonging to a student |
| coach | `academy_coaches` | Coach profile, contact, image, and payout bank details |
| holding account | `academy_holding_accounts` | Bank account and ledger-controlled current balance |
| event | `academy_events` | Participated event header and lifecycle |
| event coach | `academy_event_coaches` | Event-to-coach PIC relation |
| event participant | `academy_event_participants` | Event-to-student relation, confirmation, and fee status |
| financial plan item | `academy_event_financial_plans` | Planned income/expense rows by category |
| financial entry | `academy_financial_entries` | Append-only realized money-in/money-out ledger |
| account transfer | `academy_account_transfers` | Header joining paired transfer ledger rows |

Money values are integer IDR snapshots. The API never returns JavaScript-formatted currency as stored data; UI display uses existing `formatMoney()` and right-aligned `tabular-nums` cells.

## 4. F-01 Students

### Data model

```text
academy_students
  uuid
  organization_id nullable
  name varchar(160)
  nickname varchar(80)
  gender male|female
  birth_place varchar(120) nullable
  birth_date date
  school varchar(160)
  phone_number varchar(30) nullable
  phone_normalized varchar(20) nullable
  nik varchar(16)
  nisn varchar(10)
  photo_file_key varchar(500)
  status active|inactive|graduated|deleted
  created_at / updated_at / deleted_at
```

Rules:

- `name`, `nickname`, `gender`, `birth_date`, `school`, `nik`, `nisn`, and student photo are required.
- `birth_place` and student phone are optional.
- `birth_date` cannot be in the future.
- NIK is exactly 16 numeric digits.
- NISN is 1 to 10 numeric digits. It is stored as a string so leading zeroes are preserved and must never be parsed as a number.
- Active NIK and NISN are separately unique per organization using partial unique indexes with `NULLS NOT DISTINCT`; database races map to 409.
- Names are trimmed but retain user capitalization.
- Birth year is derived from `birth_date`; it is not stored separately.
- Student photo and identity documents store private object keys, never trusted arbitrary public URLs.
- A student cannot be hard-deleted. Soft delete is blocked when active/future event participation exists unless those participant rows are removed first; historical completed-event references remain readable.

### Private documents

```text
academy_student_documents
  uuid
  organization_id
  student_id
  document_type kia|family_card|birth_certificate|bpjs_employment
  file_key
  original_filename
  content_type
  size
  status active|deleted
  uploaded_by
  created_at / updated_at / deleted_at
```

Required active documents:

- `kia` (Kartu Identitas Anak)
- `family_card` (KK)

Optional documents:

- `birth_certificate`
- `bpjs_employment`

There is one active file per `(student_id, document_type)`. Replacing a document soft-deletes the prior row after the new upload succeeds. Accepted types are JPEG, PNG, and PDF; enforce MIME signature, extension, non-empty bytes, and configurable size limit. Do not rely on browser MIME alone.

The existing public upload URL pattern is not sufficient for NIK/KIA/KK/birth-certificate data. Add a protected base64-inside-encrypted-JSON private upload flow that stores a private COS key. Viewing/downloading requires `academy:student-document:view:detail`, rechecks student organization scope, and returns a short-lived signed URL or streams through an authorized route. Lists and activity logs never expose signed URLs, document bytes, NIK, or NISN unnecessarily.

### API

```http
GET    /academy/api/v1/students
POST   /academy/api/v1/students
GET    /academy/api/v1/students/{uuid}
PUT    /academy/api/v1/students/{uuid}
DELETE /academy/api/v1/students/{uuid}

POST   /academy/api/v1/students/{uuid}/documents
GET    /academy/api/v1/students/{uuid}/documents/{documentUuid}/access
DELETE /academy/api/v1/students/{uuid}/documents/{documentUuid}
```

Suggested create payload:

```json
{
  "name": "Ahmad Fauzan",
  "nickname": "Fauzan",
  "gender": "male",
  "birth_place": "Bandung",
  "birth_date": "2013-04-18",
  "school": "SD Negeri 1",
  "phone_number": "+628123456789",
  "nik": "3273000000000001",
  "nisn": "0012345678",
  "photo_file_key": "academy/private/...",
  "parents": [
    {
      "kind": "father",
      "name": "Budi",
      "nickname": "Pak Budi",
      "phone_number": "081234567890"
    }
  ]
}
```

Student create accepts nested parents to avoid a temporary parentless record. At least one parent row is required in MVP. Required KIA/KK files may be uploaded before create using temporary private upload tokens, then atomically attached during create; unclaimed temporary uploads expire and are cleaned up.

### List and UI

List filters:

```text
filter[q]             // case-insensitive name OR nickname
filter[birth_year]    // four-digit year applied to birth_date range
filter[gender]
filter[status]
sortProperty=name|nickname|birth_date|school|created_at|updated_at
sortDirection=asc|desc
offset / limit
```

Student list shows photo thumbnail, name, nickname, gender, age/birth year, school, status, and actions. It must not show NIK/NISN/full document links by default.

Detail view shows profile, parent cards, event history, and protected document actions. Phone fields render a WhatsApp link only after normalization succeeds:

```text
stored/display: +62 812-3456-789
link: https://wa.me/628123456789
```

Normalization rules:

- Remove spaces, parentheses, and hyphens.
- Indonesian local prefix `0...` becomes `62...`.
- `+62...` becomes `62...` for the `wa.me` path.
- Reject non-numeric remnants and implausible lengths instead of building an unsafe/broken link.
- Links use `target="_blank"` and `rel="noreferrer"`.

## 5. F-02 Student parents

```text
academy_student_parents
  uuid
  organization_id
  student_id
  kind father|mother
  name varchar(160)
  nickname varchar(80)
  phone_number varchar(30)
  phone_normalized varchar(20)
  status active|inactive|deleted
  created_at / updated_at / deleted_at
```

Rules:

- Parent name, nickname, and valid phone number are required.
- Up to one active father and one active mother per student in MVP, enforced by a partial unique index `(student_id, kind) WHERE deleted_at IS NULL`.
- Parent organization is copied from the student and never accepted from payload.
- Direct parent routes always scope through the parent student and return 404 on organization mismatch.
- Student create/update nested `parents[]` uses full replacement: submitted rows with UUID update, new rows create, omitted active rows soft-delete. Forms must submit the full unfiltered parent state.
- At least one active parent must remain.
- Parent phone links use the same normalized WhatsApp behavior as student phone.

Although MVP uses father/mother as requested, a future `guardian` kind is recommended for students whose legal/emergency guardian is neither parent. Do not overload father/mother with guardian data.

## 6. F-03 Coaches

```text
academy_coaches
  uuid
  organization_id nullable
  name varchar(160)
  phone_number varchar(30)
  phone_normalized varchar(20)
  bank varchar(120)
  account_number varchar(80)
  image_file_key varchar(500)
  status active|inactive|deleted
  created_at / updated_at / deleted_at
```

API:

```http
GET/POST /academy/api/v1/coaches
GET/PUT/DELETE /academy/api/v1/coaches/{uuid}
```

Coach name, phone number, bank, account number, and image are required. Phone normalization and the WhatsApp link follow the same rules as student/parent phones. Image uses private/protected storage by default, although lower sensitivity than student identity documents. Bank and account number are payout instructions only; they do not create or link an Academy holding account and cannot affect holding-account balances. Account numbers are masked on coach lists (`•••• 1234`) and shown fully only on permission-gated coach detail/edit views. Coach delete is blocked when assigned to an active/future event; completed-event history retains the coach snapshot/label even if later inactive/deleted.

Active coach payout details should be unique per `(organization_id, bank, account_number)` when organizations require one coach per beneficiary account; MVP reports duplicates as a warning during create/update rather than enforcing uniqueness because family/shared accounts may be legitimate. Bank/account values must be excluded from broad activity snapshots and coach picker responses.

Recommended follow-up fields, not required for MVP: email, account-holder name when different from coach name, license/certification, specialty, certification expiry, and emergency contact.

## 7. F-04 Holding bank accounts

```text
academy_holding_accounts
  uuid
  organization_id nullable
  bank varchar(120)
  account_name varchar(160)
  account_number varchar(80)
  current_balance bigint default 0
  status active|inactive|deleted
  created_at / updated_at / deleted_at
```

`account_name` is added as a recommended minimum control even though it was not in the initial list; bank reconciliation is unsafe without the registered account holder/name.

Rules:

- `current_balance` is server-controlled and forbidden in create/update payloads.
- A new account starts at zero. Existing cash is entered through an explicit `opening_balance` financial entry, preserving audit history.
- Account number is unique per `(organization_id, bank, account_number)` among non-deleted rows.
- Account number is masked on list (`•••• 1234`) and shown fully only with detail permission.
- Account cannot be deleted when it has ledger history. It can be set inactive; historical entries remain visible.
- Inactive accounts cannot receive new entries except an authorized reversal/correction required to settle history.
- Current balance changes only through the single financial-entry writer while the account row is transaction-locked.

API:

```http
GET    /academy/api/v1/holding-accounts
POST   /academy/api/v1/holding-accounts
GET    /academy/api/v1/holding-accounts/{uuid}
PUT    /academy/api/v1/holding-accounts/{uuid}
DELETE /academy/api/v1/holding-accounts/{uuid}
```

Detail view includes current balance and paginated money-in/money-out ledger history with date, event, category, amount, balance after, description, creator, and reversal link.

## 8. F-05 Participated events and coach PICs

```text
academy_events
  uuid
  organization_id nullable
  name varchar(200)
  start_at timestamp with time zone
  end_at timestamp with time zone
  location text
  status draft|open|ongoing|completed|cancelled
  finance_status open|closed
  notes text nullable
  created_at / updated_at / deleted_at

academy_event_coaches
  uuid
  organization_id
  event_id
  coach_id
  role pic|assistant
  coach_name_snapshot
  created_at / deleted_at
```

Rules:

- Name, start, end, location, and at least one PIC coach are required before an event moves from draft to open.
- `end_at` must be after `start_at`.
- Date/time inputs display using organization timezone and store UTC.
- Coaches must be active and in the same organization when assigned.
- Unique active `(event_id, coach_id)` prevents duplicate PIC rows.
- `pic_coaches[]` is full replacement while event status is draft/open.
- Completed/cancelled events preserve coach snapshots and cannot change participant/plan structure without an explicit reopen permission.
- Event operational status and finance status are separate: an event may be completed while finance remains open for late realization entries.
- Closing finance requires no unresolved draft entries and locks normal new realization rows. Reversal remains available to finance administrators.

API:

```http
GET/POST /academy/api/v1/events
GET/PUT/DELETE /academy/api/v1/events/{uuid}
POST /academy/api/v1/events/{uuid}/complete
POST /academy/api/v1/events/{uuid}/cancel
POST /academy/api/v1/events/{uuid}/finance-close
POST /academy/api/v1/events/{uuid}/finance-reopen
```

List filters: keyword, status, finance status, coach ID, `date_from`, and `date_to`. Detail view contains overview, PICs, participants, plan vs realization, journal, and account impact.

## 9. F-06 Event participants and participation fees

```text
academy_event_participants
  uuid
  organization_id
  event_id
  student_id
  student_name_snapshot
  confirmed boolean default false
  confirmed_at nullable
  participation_fee bigint default 0
  transferred boolean default false
  transferred_at nullable
  transferred_amount bigint nullable
  transfer_account_id nullable
  transfer_financial_entry_id nullable
  transfer_proof_file_key nullable
  notes text nullable
  created_at / updated_at / deleted_at
```

`transferred` is defined as the student's participation fee having been received/transferred into an Academy holding account. The UI label should be **Fee transferred** to avoid ambiguity.

Rules:

- Student must be active and same-organization.
- Unique active `(event_id, student_id)`.
- `participation_fee` is non-negative and can be defaulted from a participation-fee financial plan row.
- Confirming sets `confirmed_at`; unconfirming before event start clears it. After event starts, changes require a separate override permission and audit reason.
- Marking fee transferred requires amount, holding account, occurred date, and optional proof. It atomically creates an `income` realization entry in category `student_participation`, links it to the participant, then sets transfer fields.
- `transferred` cannot be toggled off directly. Mistakes require reversal of the linked realization entry, which then clears/marks the participant payment as reversed through the controlled reversal flow.
- Transferred amount may be partial. MVP retains the requested boolean but computes payment state for display: `unpaid`, `partial`, or `paid` based on active linked realization totals. The boolean is true only when paid amount is at least the participation fee.
- A zero-fee participant is considered paid without creating money movement, but confirmation remains independent.
- Removing a participant is blocked after linked realization exists; use cancellation/reversal while preserving history.

API:

```http
GET/POST /academy/api/v1/events/{eventUuid}/participants
GET/PUT/DELETE /academy/api/v1/events/{eventUuid}/participants/{uuid}
POST /academy/api/v1/events/{eventUuid}/participants/{uuid}/confirm
POST /academy/api/v1/events/{eventUuid}/participants/{uuid}/record-transfer
```

Participant UI supports student search, bulk add, confirmed/unconfirmed filter, fee payment state filter, and totals for invited, confirmed, expected fee, and realized fee.

## 10. F-07 Event financial plan

```text
academy_event_financial_plans
  uuid
  organization_id
  event_id
  direction income|expense
  category student_participation|parent_donation|coach_fee|event_rsvp|consumption|equipment|other
  description varchar(255)
  quantity integer default 1
  unit_amount bigint
  planned_amount bigint
  notes text nullable
  created_at / updated_at / deleted_at
```

Category direction defaults:

| Category | Default direction |
|---|---|
| Student participation fee | income |
| Parent donation | income |
| Coach fee | expense |
| Event RSVP/registration fee | expense |
| Consumption fee | expense |
| Equipment fee | expense |
| Other | caller selects income or expense |

`planned_amount = quantity × unit_amount` is computed by the server. `planned_amount` is never accepted from payload. For student participation, quantity may be synchronized from selected/confirmed participants only by an explicit **Recalculate from participants** action; ordinary reads never mutate the plan.

Plan rows can be edited while event finance is open. Plan changes never rewrite realization entries. Plan summaries:

```text
planned_income
planned_expense
planned_balance = planned_income - planned_expense
```

API:

```http
GET/POST /academy/api/v1/events/{eventUuid}/financial-plans
GET/PUT/DELETE /academy/api/v1/events/{eventUuid}/financial-plans/{uuid}
POST /academy/api/v1/events/{eventUuid}/financial-plans/recalculate-participants
```

## 11. F-08 Financial realization ledger

```text
academy_financial_entries
  uuid
  organization_id
  holding_account_id
  event_id nullable
  financial_plan_id nullable
  participant_id nullable
  parent_id nullable
  direction income|expense
  category opening_balance|student_participation|parent_donation|coach_fee|event_rsvp|consumption|equipment|account_transfer|other|reversal
  amount bigint
  occurred_at timestamp with time zone
  description varchar(255)
  proof_file_key nullable
  reference_type nullable
  reference_id nullable
  reversal_of_id nullable
  transfer_id nullable
  balance_after bigint
  created_by
  created_at
```

Ledger rules:

- Rows are append-only: no PUT or DELETE routes.
- Amount is a positive integer. Direction determines signed account impact.
- `balance_after` is computed and never accepted from payload.
- Entry organization comes from actor/account/event scope.
- Account, event, plan, participant, parent, and transfer references must all resolve to the same organization and consistent event.
- Event-linked entry categories should match a compatible plan category, but realization may exist without a plan row when explicitly categorized `other` with a required description.
- Negative holding balance is rejected with 422 by default. A future organization setting may allow overdraft, but MVP does not.
- Creation opens a DB transaction, locks the holding account, computes next balance, updates `current_balance`, inserts the ledger row with `balance_after`, and commits atomically.
- Proof uses protected private upload; no public receipt/bank-transfer evidence URLs.
- Ledger display resolves historical event/student/parent/account labels without applying current `deleted_at` conditions, so audit history remains understandable.

### Reversal

```http
POST /academy/api/v1/financial-entries/{uuid}/reverse
```

Payload requires reversal date and reason. Reversal:

1. Locks the account.
2. Rejects an entry already reversed.
3. Inserts an opposite-direction row with `category=reversal` and `reversal_of_id`.
4. Updates account balance atomically.
5. Updates linked participant fee state when applicable.
6. Never changes/deletes the original entry.

### API

```http
GET  /academy/api/v1/financial-entries
POST /academy/api/v1/financial-entries
GET  /academy/api/v1/financial-entries/{uuid}
POST /academy/api/v1/financial-entries/{uuid}/reverse
```

Filters: holding account, event, direction, category, participant, `date_from`, `date_to`, reference, offset/limit. Default sort is `occurred_at DESC, created_at DESC`.

Event realization summary:

```text
realized_income
realized_expense
realized_balance = realized_income - realized_expense
income_variance = realized_income - planned_income
expense_variance = realized_expense - planned_expense
event_cash_balance = realized_income - realized_expense
```

## 12. F-09 Holding-account transfers and reconciliation

Account-to-account transfers are recommended because Academy funds may move between bank accounts and must not be represented as unrelated expense/income rows.

```text
academy_account_transfers
  uuid
  organization_id
  from_account_id
  to_account_id
  amount
  occurred_at
  description
  proof_file_key nullable
  out_entry_id
  in_entry_id
  created_by
  created_at
```

```http
POST /academy/api/v1/holding-accounts/transfers
GET  /academy/api/v1/holding-accounts/transfers/{uuid}
```

The server locks accounts in deterministic UUID order, validates sufficient source balance, writes paired `account_transfer` expense/income rows sharing `transfer_id`, updates both balances, and commits atomically. Transfers do not count as event income/expense unless explicitly linked for display; they are excluded from Academy-wide operational profit to avoid double counting.

Reconciliation MVP provides a read-only **Expected balance** from the ledger and current materialized balance consistency check. Recommended V2 adds bank-statement balance, reconciliation date, and discrepancy workflow.

## 13. F-10 Reports and views

### Event finance report

```http
GET /academy/api/v1/reports/events/{uuid}/finance
```

Shows:

- Planned income/expense/balance
- Realized income/expense/balance
- Variance by category and plan row
- Participant fee expected/received/outstanding
- Donations by parent/student reference
- Coach/event/consumption/equipment/other expenses
- Holding-account distribution
- Chronological journal and reversal pairs

### Holding-account report

```http
GET /academy/api/v1/reports/holding-accounts/{uuid}
```

Shows opening entries, event income/expense, transfers, reversals, running balance, current balance, and date/category/event filters.

### Academy dashboard (approved MVP)

The Academy dashboard is a required MVP view and API, not an optional recommendation:

```http
GET /academy/api/v1/dashboard
```

Required summary cards:

- Active students and birth-year/age-group distribution
- Active coaches
- Upcoming events
- Confirmed participants for upcoming events
- Outstanding participation fees
- Total holding balance across active accounts
- Open event planned vs realized variance

Dashboard date-sensitive metrics use the organization timezone. Cards link to their already-filtered list/report views. Each panel degrades independently if a secondary aggregation fails; failure of an event-finance card must not blank student or coach totals. Reports and dashboard use server aggregation, organization scope, date/result caps, and `formatMoney()` in UI only.

## 14. Permissions

```text
academy:student:list:list
academy:student:create:create
academy:student:view:detail
academy:student:view:update
academy:student:view:delete
academy:student-document:view:detail
academy:student-document:create:upload
academy:student-document:view:delete

academy:student-parent:create:create
academy:student-parent:view:update
academy:student-parent:view:delete

academy:coach:list:list
academy:coach:create:create
academy:coach:view:detail
academy:coach:view:update
academy:coach:view:delete

academy:holding-account:list:list
academy:holding-account:create:create
academy:holding-account:view:detail
academy:holding-account:view:update
academy:holding-account:view:delete
academy:holding-account:create:transfer

academy:event:list:list
academy:event:create:create
academy:event:view:detail
academy:event:view:update
academy:event:view:delete
academy:event:view:complete
academy:event:view:cancel
academy:event:view:finance-close
academy:event:view:finance-reopen

academy:event-participant:create:create
academy:event-participant:view:update
academy:event-participant:view:delete
academy:event-participant:view:confirm
academy:event-participant:view:record-transfer

academy:financial-plan:create:create
academy:financial-plan:view:update
academy:financial-plan:view:delete

academy:financial-entry:list:list
academy:financial-entry:create:create
academy:financial-entry:view:detail
academy:financial-entry:view:reverse

academy:dashboard:view:detail
academy:report:list:list
base:menu:academy:*
```

Recommended roles:

- Football Admin (`football-admin`): full Academy module access for the user's linked organization.
- Registrar: students, parents, documents, event participants; no account numbers or ledger writes.
- Coach: assigned event/student summary only; no identity documents/NIK/NISN or finance.
- Treasurer: holding accounts, plans, entries, transfers, and reports; student identity is limited to display labels needed for fee traceability.

Session permission snapshots require re-login after seed/grant updates.

### Seeded Football Admin role

Seed an active Base role:

```text
name: Football Admin
slug: football-admin
status: active
```

The seed grants `football-admin` every `academy:*` action listed above plus `base:menu:academy:*`. The role is an Academy operational administrator, not a platform administrator:

- It does not receive unrelated `base:*`, `sales:*`, `sass:*`, `product:*`, `warehouse:*`, or `marketing:*` actions.
- It cannot assign itself to another organization or change organization links.
- Every Academy query still resolves and enforces the user's linked organization; the role slug never bypasses organization scope.
- An unlinked Football Admin sees only `organization_id IS NULL` Academy rows under the existing strict-scope rule.
- It may access full student identity fields/private documents and full holding-account detail because those permissions are required to manage all Academy data; every document access and financial reversal remains audited.
- Role/action/menu/grant seeds are idempotent (`ON CONFLICT DO NOTHING` plus duplicate-safe permission insertion). Users must re-login after the role or its grants are assigned.

Recommended sidebar tree for this role:

```text
Football Academy
  Dashboard
  Students
  Coaches
  Events
  Holding Accounts
  Financial Entries
  Reports
```

## 15. UI map

```text
app/academy/
  views/students/
    page.tsx
    create/page.tsx
    [uuid]/page.tsx
    [uuid]/edit/page.tsx
  views/coaches/
  views/holding-accounts/
    [uuid]/page.tsx            // balance + ledger
  views/events/
    [uuid]/page.tsx            // overview tabs/panels
    [uuid]/participants/
    [uuid]/finance/
  views/financial-entries/
  views/reports/
```

Forms use the shared `components/FormField.tsx` and private upload button equivalent. Async dependencies degrade independently with `Promise.allSettled`. Submit buttons use `disabled={isPending || loading}` with matching handler guards. Search filters are display-only; nested parents/coaches/participants payloads come from full selection state, never a filtered subset.

Event detail recommended tabs:

1. Overview
2. Coaches/PIC
3. Participants
4. Financial plan
5. Financial realization
6. Summary/report

## 16. Security and privacy

Student records contain government identifiers and documents concerning minors. Minimum controls:

- Private object storage; no permanent public KIA/KK/certificate/BPJS URLs.
- Short-lived signed access after session, permission, and organization checks.
- Do not include NIK, NISN, document keys, phone numbers, account numbers, or proof keys in broad activity snapshots/log messages.
- Mask NIK and bank accounts on lists. Because NISN may contain only 1 digit, never expose NISN on list/picker views; show its full value only in permission-gated student detail/edit views.
- Encrypt transport through existing `{iv,data}` envelopes; uploads remain base64 JSON, never multipart.
- Validate actual file signatures and size; sanitize filenames; prevent SVG/HTML active content.
- Explicit audit log for document access should record actor, student/document UUID, and timestamp without logging the signed URL.
- Signed URLs expire quickly and are not persisted in database/client state.
- Add retention policy later for graduated/deleted students according to organizational/legal requirements; MVP never automatically destroys identity records.

## 17. Suggested API contract conventions

All protected routes use normal envelopes:

```json
{
  "success": true,
  "code": 200,
  "ts": 1792387200,
  "message": "",
  "data": {}
}
```

Error mapping:

| Condition | HTTP |
|---|---:|
| Invalid identifiers, dates, phones, files, or unknown keys | 400 |
| Missing/cross-organization row | 404 |
| Duplicate NIK/NISN/account/student-event relation | 409 |
| Invalid lifecycle or already reversed/closed state | 409 |
| Insufficient holding-account balance | 422 |
| Missing permission | 403 |
| Private storage unavailable | 503 |

Before implementation, capture these routes and examples in an OpenAPI contract and/or filesystem-first Postman collection, including encrypted request examples, lifecycle conflicts, insufficient-balance responses, private-file access, and reversal scenarios. Implementation and smoke tests should validate against that contract.

## 18. Implementation order

1. Scaffold `app/academy`, layout/menu/actions, seed the `football-admin` role with all Academy grants, and add private file storage/access primitives plus phone normalization.
2. Student + parent + document migrations/models/use cases/APIs/UI.
3. Coach CRUD and event-safe deletion rules.
4. Holding account CRUD with zero/server-controlled balance.
5. Event header + coach PIC relation and lifecycle.
6. Event participants, confirmation, fees, and transfer proof.
7. Financial plan CRUD and summaries.
8. Single financial-entry writer, row locking, account balances, reversal.
9. Paired account transfer flow and consistency checks.
10. Event/account reports and Academy dashboard.
11. OpenAPI/Postman contract tests, encrypted smoke tests, and private-document authorization tests.

## 19. Acceptance criteria

- [ ] Student create requires valid name/nickname/gender/birth date/school/NIK/NISN/photo, KIA, KK, and at least one parent; optional fields remain optional.
- [ ] NISN accepts numeric strings from 1 through 10 digits, preserves leading zeroes, and rejects empty, non-numeric, and 11+-digit values.
- [ ] NIK/NISN duplicates in the same organization return 409, including race conditions; another organization remains isolated.
- [ ] Student list keyword matches name or nickname and birth-year filter uses `birth_date` without a redundant stored year.
- [ ] Student/parent phones normalize correctly and valid numbers open `https://wa.me/62...`; invalid numbers never render a WhatsApp link.
- [ ] KIA/KK/certificate/BPJS documents are private, permission-scoped, short-lived on access, absent from list/activity payloads, and inaccessible across organizations.
- [ ] Parent nested replacement preserves submitted rows, soft-deletes omissions, enforces father/mother uniqueness, and never leaves a student without a parent.
- [ ] Coach cannot be deleted while assigned to an active/future event; completed event labels remain readable after coach deactivation.
- [ ] Coach create/update requires valid phone, bank, account number, and protected image; list masks account number and omits bank details from picker/activity payloads; detail renders a normalized WhatsApp link.
- [ ] Holding-account balance is rejected in create/update payloads and changes only through the locked ledger writer.
- [ ] Event requires valid period/location and at least one same-org PIC before opening; end before start returns 400.
- [ ] Student can appear once per event; participant confirmation and fee states are independently filterable and audited.
- [ ] Recording participant transfer atomically writes an income entry, updates account balance, and links participant/proof; retry does not double-post.
- [ ] Plan totals are server-calculated and plan edits never rewrite realization.
- [ ] Realization income/expense updates `current_balance` and `balance_after` atomically; concurrent writes produce a correct serial running balance.
- [ ] Insufficient expense/transfer returns 422 with no ledger or balance change.
- [ ] Financial entries have no update/delete routes; reversal creates one opposite row, restores balance, and cannot run twice.
- [ ] Account transfer writes paired out/in rows and both account balances atomically, while operational reports exclude transfer double counting.
- [ ] Finance close blocks ordinary new entries/plan changes; authorized reopen/reversal is audited.
- [ ] Event report accurately shows planned, realized, variance, participant outstanding fees, and account distribution.
- [ ] Academy dashboard returns organization-scoped student/age-group, coach, upcoming-event, confirmed-participant, outstanding-fee, holding-balance, and open-event variance cards; one failed secondary panel does not blank the rest.
- [ ] Every protected list/detail/write follows strict organization scope and payload `organization_id` returns 400.
- [ ] Seed creates the active `football-admin` role, Academy menu tree, all Academy actions, and duplicate-safe grants; rerunning the seed creates no duplicates.
- [ ] A linked Football Admin can manage all Academy students, documents, coaches, events, participants, accounts, plans, entries, transfers, and reports in its own organization, but cannot access another organization's rows or unrelated administration APIs.
- [ ] `tsc --noEmit`, lint, migrations, API contract tests, encrypted requests, private-file tests, concurrency tests, and production build/restart workflow pass.

## 20. Test cases

### A. Student validation and CRUD

| ID | Scenario | Expected result |
|---|---|---|
| STU-01 | Create with valid required fields, KIA, KK, photo, and one father/mother | 201; student, parent, and private-file relations created in actor organization |
| STU-02 | Create without birth place, student phone, birth certificate, or BPJS file | 201; optional fields remain null |
| STU-03 | Create with future birth date | 400; no rows/files attached |
| STU-04 | NIK has fewer/more than 16 digits or non-numeric characters | 400 |
| STU-05 | NISN values `1`, `0000000001`, and `1234567890` | Accepted and returned as exact strings |
| STU-06 | NISN empty, non-numeric, or 11 digits | 400 |
| STU-07 | Duplicate active NIK or NISN in same organization, including concurrent requests | One success; duplicate returns 409 |
| STU-08 | Same NIK/NISN in a different organization | Allowed; rows remain isolated |
| STU-09 | `filter[q]` matches name and nickname case-insensitively | Only matching same-org rows returned |
| STU-10 | `filter[birth_year]=2013` | Only birth dates from 2013 returned, including year boundaries |
| STU-11 | Unknown filter or payload `organization_id` | 400 |
| STU-12 | Cross-org Get/Update/Delete UUID | 404 without existence leak |
| STU-13 | Delete student with active/future event participation | Controlled 409; history unchanged |

### B. Parent and WhatsApp behavior

| ID | Scenario | Expected result |
|---|---|---|
| PAR-01 | Nested create with father and mother | Both rows created and scoped through student |
| PAR-02 | Add a second active father or mother | 409 |
| PAR-03 | Update with one parent omitted | Omitted row soft-deleted if at least one parent remains |
| PAR-04 | Update removes every parent | 400/409; at least one remains |
| PAR-05 | Normalize `0812 3456-789`, `+62 812-3456-789`, and `628123456789` | Same normalized value/link `https://wa.me/628123456789` |
| PAR-06 | Invalid phone contains letters or implausible length | 400 on required parent/coach; optional student phone is rejected when supplied |
| PAR-07 | Student/parent detail valid phone | Safe new-tab WhatsApp link with `rel="noreferrer"` |

### C. Private files and identity security

| ID | Scenario | Expected result |
|---|---|---|
| DOC-01 | Upload valid JPEG/PNG/PDF within size limit | Private object key returned/attached; no permanent public URL |
| DOC-02 | Upload SVG/HTML, MIME-spoofed bytes, empty, or oversized file | 400/413; object not attached |
| DOC-03 | Access own-org document with permission | Short-lived signed access returned and access audited |
| DOC-04 | Access own-org document without document permission | 403 |
| DOC-05 | Access cross-org document UUID | 404 |
| DOC-06 | Replace KIA/KK | New file active; old row soft-deleted only after successful upload/attach |
| DOC-07 | Inspect list/activity/API errors | No NIK/NISN, private key, signed URL, bytes, or sensitive account data leaked |
| DOC-08 | Temporary upload never attached | Cleanup removes it after configured expiry |

### D. Coach CRUD and payout data

| ID | Scenario | Expected result |
|---|---|---|
| COA-01 | Create coach with name, valid phone, bank, account number, and image | 201; normalized phone stored, image private |
| COA-02 | Missing phone/bank/account/image | 400 |
| COA-03 | Coach list/picker | Account is masked on list and absent from picker; full account available only on authorized detail |
| COA-04 | Coach phone detail | Correct `wa.me` link |
| COA-05 | Duplicate bank/account used by another coach | Warning returned/displayed but create/update allowed in MVP |
| COA-06 | Delete coach assigned to active/future event | 409 |
| COA-07 | Deactivate coach after completed event | Success; completed event retains coach snapshot label |

### E. Holding accounts and ledger concurrency

| ID | Scenario | Expected result |
|---|---|---|
| ACC-01 | Create account with `current_balance` payload | 400; direct balance forbidden |
| ACC-02 | Create account normally | Balance starts at zero |
| ACC-03 | Record opening balance income | Account balance and entry `balance_after` update atomically |
| ACC-04 | Concurrent income/expense requests on same account | Row lock serializes writes; final balance and every `balance_after` are correct |
| ACC-05 | Expense greater than available balance | 422; no entry/balance mutation |
| ACC-06 | Update account form attempts to edit balance | 400; balance unchanged |
| ACC-07 | Delete account with ledger history | Blocked; inactive status remains available |
| ACC-08 | Account list/detail | List masks number; authorized detail shows number and paginated ledger |
| ACC-09 | Cross-org account in entry payload | 404; no balance change |

### F. Events, coaches, and participants

| ID | Scenario | Expected result |
|---|---|---|
| EVT-01 | Create draft with valid period/location | Created in actor organization |
| EVT-02 | End at/before start | 400 |
| EVT-03 | Open event without PIC | 409 |
| EVT-04 | Assign duplicate coach or cross-org coach | 409 or 404 respectively |
| EVT-05 | Add same student twice | 409 |
| EVT-06 | Confirm participant | `confirmed=true`, timestamp set, activity logged |
| EVT-07 | Unconfirm after event starts without override | 403/409 |
| EVT-08 | Record full participant fee transfer | One linked income entry; account and paid state update atomically |
| EVT-09 | Record partial transfer | Payment state `partial`, boolean false until total reaches fee |
| EVT-10 | Retry identical transfer request/idempotency key | No duplicate entry or charge |
| EVT-11 | Toggle transferred false directly | 400; reversal flow required |
| EVT-12 | Remove participant with financial history | Blocked; history preserved |

### G. Financial plan, realization, reversal, and transfer

| ID | Scenario | Expected result |
|---|---|---|
| FIN-01 | Plan quantity 10 × unit 50,000 | Server stores planned amount 500,000; caller amount rejected |
| FIN-02 | Recalculate participation plan | Quantity updates only through explicit action; ordinary read has no mutation |
| FIN-03 | Realize income/expense against plan | Account and event summaries reflect direction/category accurately |
| FIN-04 | Realize `other` without description | 400 |
| FIN-05 | PUT/DELETE financial entry | Method unavailable; ledger unchanged |
| FIN-06 | Reverse entry | One opposite entry inserted, balance restored, original unchanged |
| FIN-07 | Reverse same entry twice | 409; one reversal only |
| FIN-08 | Transfer between two accounts | Paired out/in rows and both balances commit atomically |
| FIN-09 | Transfer with insufficient source balance | 422; neither account changes |
| FIN-10 | Concurrent opposite-direction transfers | Deterministic lock ordering prevents deadlock/inconsistent balance |
| FIN-11 | Operational profit report includes transfer pair | Transfer excluded from income/expense profit to prevent double count |
| FIN-12 | Finance closed, normal plan/entry write attempted | 409; authorized reopen or reversal remains controlled/audited |

### H. Dashboard and reports

| ID | Scenario | Expected result |
|---|---|---|
| RPT-01 | Academy dashboard with known fixtures | Every required card matches organization-scoped source totals |
| RPT-02 | Upcoming event crosses UTC/local date boundary | Included according to organization timezone |
| RPT-03 | Outstanding participant fee has partial/reversed entries | Outstanding amount equals fee minus active realized payment total |
| RPT-04 | Event plan vs realization | Planned, actual, balance, and category variance match ledger fixtures |
| RPT-05 | One secondary dashboard aggregation fails | Other cards render; failed panel shows scoped error |
| RPT-06 | Cross-org records exist | No cross-org amounts/counts/labels appear in dashboard or reports |

### I. Role and authorization

| ID | Scenario | Expected result |
|---|---|---|
| AUTH-01 | Rerun master seed | One `football-admin` role/menu/action/grant set; no duplicates |
| AUTH-02 | Linked Football Admin exercises Academy endpoints | Full Academy access only within linked organization |
| AUTH-03 | Football Admin calls unrelated Base/Sales admin API | 403 unless separately granted |
| AUTH-04 | Registrar views holding-account full number or writes ledger | 403 |
| AUTH-05 | Coach role requests NIK/NISN/private documents/finance | 403 |
| AUTH-06 | Treasurer records ledger but requests unrelated identity document | Ledger succeeds; document request 403 |
| AUTH-07 | Grants changed without re-login | Old session remains unchanged; new login receives snapshot |

### J. Quality and API contract

- Validate every route against OpenAPI/Postman examples for success, 400, 403, 404, 409, 413, 422, and 503 cases.
- Run encrypted transport tests for every protected JSON endpoint and base64 private upload.
- Run migration up/down tests and partial unique-index race tests.
- Run `tsc --noEmit`, lint, model initialization, route validation, and production build.
- Run responsive/manual UI tests for student nested parents, document access, WhatsApp links, event tabs, participant bulk selection, money alignment, reversal confirmation, and independent dashboard-panel failures.
- Verify accessibility: labels, keyboard operation, focus handling, `aria-describedby`, `role="status"`, and `role="alert"`.
- Verify logs contain correlation/entity IDs but exclude credentials, signed URLs, private object keys, NIK/NISN, full phone numbers, bank accounts, and proof/document content.

## 21. Additional recommended features

Recommended next phases after the requested MVP:

1. **Training schedule and attendance** — recurring sessions, coach assignment, student check-in, absence reasons.
2. **Age groups/teams** — derive age from birth date and assign students to squads without duplicating identity records.
3. **Monthly tuition/invoices** — fee plans, bills, payments, arrears, and receipt PDFs connected to holding accounts.
4. **Guardian/emergency contacts** — add `guardian` kind, relationship, emergency priority, and pickup authorization.
5. **Medical and safeguarding notes** — allergies, injuries, emergency instructions, with stricter permissions and audit.
6. **Coach certification** — license number, specialty, issue/expiry date, protected certificate.
7. **Event attendance/performance** — lineup, minutes, goals/assists/cards, coach evaluation, and results.
8. **Document expiry/completeness dashboard** — missing documents, expiring insurance/certifications, controlled reminders.
9. **Bank reconciliation** — statement balance, reconciliation period, discrepancy and approval workflow.
10. **Approval workflow** — planned budget approval, high-value expense approval, and dual-control account transfers.

The most valuable immediate follow-up is training attendance plus monthly tuition, but these should not be mixed into the first event-finance implementation.

## 22. Out of scope for MVP

- Payroll, tax, full general ledger, depreciation, and formal double-entry accounting
- Direct bank API integration or automatic bank-statement import
- Online payment gateway and automatic fee collection
- Public student portal or parent login
- Training attendance, team roster, match statistics, and tuition billing
- Medical diagnosis storage and biometric data
- Bulk student import (recommended after CRUD/document validation stabilizes)
- Public document URLs or unauthenticated student search
