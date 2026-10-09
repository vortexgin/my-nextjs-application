# Marketing Module — Email Campaigns, Landing Pages, and Attribution

> Status: approved design · Module: `app/marketing` (new) · Integrates: `app/base`, `app/sales`, `app/sass`, existing Mailgun transport
> Stack: Next.js 16 App Router · Sequelize 6 + Postgres · Joi · encrypted JSON for protected APIs · signed/rate-limited public routes · Mailgun email + verified webhooks
> Locked decisions: email-only MVP; Mailgun provider; audiences include leads and customers; imported consent allowed; scheduling uses organization timezone; billing charges once per campaign run and once per Mailgun-accepted recipient; first- and last-touch attribution; landing pages and lead-capture forms are MVP

Vertical-slice rule: `models/` (`toApi()` + lazy factory, `underscored:true`, `timestamps:false`) → `useCases/<entity>/` (Joi in `preExec`, activity/billing in `postExec` where applicable) → `api/[version]/` (`export const runtime="nodejs"`, `withAuthorization`, `ok()`/`fail()`) → components/views/paths. Queue claim/send helpers, segment compilers, Mailgun clients, renderers, attribution resolvers, and public-token helpers are non-use-case helpers under `app/marketing/libraries/` or shared `libraries/`, never inside use cases.

Global invariants: `organization_id` is resolved from the actor for protected operations and from a server-owned landing page/form/campaign record for public operations; it is never accepted from payloads. Joi rejects unknown keys. Cross-organization protected reads return 404. Lists always apply strict organization scope (linked actor → own org; unlinked actor → `NULL`). Public routes never accept an organization ID, SQL-like segment expressions, template scripts, billing values, or sales lifecycle fields from callers. Session permissions snapshot at login, so users must re-login after grants change.

## 1. Purpose and ownership boundary

Marketing owns acquisition and nurture before and around the Sales pipeline:

- Organization marketing settings and sender identity
- Email consent, unsubscribe, bounce, complaint, and suppression
- Reusable lead/customer audience segments
- Email templates and safe placeholder rendering
- Campaign scheduling, immutable runs, recipient snapshots, and queued delivery
- Mailgun delivery/engagement events
- Public landing pages and lead-capture forms
- Tracked links and first-/last-touch attribution
- Campaign performance and attributed sales reporting

Sales remains authoritative for leads, customers, PR/SO/POS documents, lifecycle status, assignment, deal values, prices, taxes, and revenue snapshots. Marketing may create a lead through an approved public form, but it does not silently change sales-owned status, assignment, value, PR/SO/POS totals, product prices, or stock.

## 2. Feature map

| # | Feature | Primary route | Billing |
|---|---|---|---|
| F-01 | Marketing settings + organization timezone | `/marketing/api/v1/settings` | none |
| F-02 | Contact consent, suppression, and import | `/marketing/api/v1/contact-preferences` | none |
| F-03 | Lead/customer audience segments | `/marketing/api/v1/segments` | none |
| F-04 | Campaign CRUD and lifecycle | `/marketing/api/v1/campaigns` | CRUD none |
| F-05 | Email templates + preview/test | `/marketing/api/v1/templates` | test send not recipient-billed |
| F-06 | Audience preview + immutable run snapshot | `/campaigns/:uuid/preview`, `/runs` | run start fee |
| F-07 | Queue worker + Mailgun delivery | internal worker/command | accepted recipient fee |
| F-08 | Mailgun webhook + unsubscribe | public routes | none |
| F-09 | Landing pages | protected CRUD + `/marketing/l/...` | none |
| F-10 | Lead-capture forms + submissions | protected CRUD + public submit | none |
| F-11 | Tracked redirects + first/last touch | `/marketing/r/:token` | none |
| F-12 | Marketing dashboard and attribution reports | `/marketing/api/v1/reports/*` | none |

## 3. Entities and tables

| Entity | Table | Key fields |
|---|---|---|
| settings | `marketing_settings` | `organization_id unique`, sender defaults, UTM defaults, consent text |
| contact preference | `marketing_contact_preferences` | normalized email, consent/suppression state and evidence |
| consent import batch | `marketing_consent_import_batches` | actor, counts, source, result |
| segment | `marketing_segments` | contact scope + validated JSONB rules |
| template | `marketing_templates` | subject, preview text, HTML/text body, status |
| campaign | `marketing_campaigns` | template/segment/owner, schedule, budget, UTM, lifecycle |
| campaign run | `marketing_campaign_runs` | immutable execution snapshot, counts, status, billing markers |
| campaign member | `marketing_campaign_members` | deduplicated contact snapshot and consent snapshot |
| message | `marketing_messages` | queue/provider state, attempts, accepted/delivered/billing markers |
| message attempt | `marketing_message_attempts` | append-only attempt outcome |
| event | `marketing_events` | append-only idempotent Mailgun and app engagement events |
| tracked link | `marketing_tracked_links` | opaque token, destination, campaign/run/message references |
| landing page | `marketing_landing_pages` | org slug/page slug, structured content, publish state |
| form | `marketing_forms` | configured fields, consent text, success action |
| form submission | `marketing_form_submissions` | sanitized submission, campaign/touch snapshots, resulting lead |
| attribution | `marketing_attributions` | visitor/contact/entity touch, first/last type and UTM snapshot |

Configurable entities use soft delete. Message attempts, provider events, submissions, and attribution touches are append-only audit records; corrections create new records rather than mutating history.

## 4. F-01 Marketing settings and timezone

### Organization timezone

Add `timezone varchar(100) NOT NULL DEFAULT 'Asia/Jakarta'` to `sass_organization`. Organization create/update validates an allowlisted IANA timezone. Timestamps remain stored in UTC; scheduling inputs and displays use the organization's timezone. Changing timezone affects future schedule interpretation/display and never rewrites stored run timestamps.

### Marketing settings

```text
marketing_settings
  uuid
  organization_id
  sender_name
  sender_email
  reply_to_email nullable
  default_utm_source default "email"
  default_utm_medium default "marketing"
  default_consent_text
  status active|inactive|deleted
  created_at / updated_at / deleted_at
```

There is one non-deleted row per organization (`NULLS NOT DISTINCT` for unlinked/global scope). Sender email/domain must be compatible with configured Mailgun credentials. API keys and webhook signing keys remain environment secrets and are never stored or returned by organization APIs.

Protected API:

```http
GET /marketing/api/v1/settings
PUT /marketing/api/v1/settings
```

Settings writes are plain activity logs and not billing transactions.

## 5. F-02 Contact consent, suppression, and import

Consent is keyed by normalized lowercase email per organization, not only by lead/customer UUID. This ensures a lead and converted customer sharing an email receive at most one campaign email and share unsubscribe/suppression state.

```text
marketing_contact_preferences
  uuid
  organization_id
  normalized_email
  status opted_in|opted_out|suppressed
  consent_source form|import|manual|system
  consent_at nullable
  consent_evidence nullable
  unsubscribed_at nullable
  suppression_reason nullable
  last_import_batch_id nullable
  created_by nullable
  updated_by nullable
  created_at / updated_at / deleted_at
```

Unique active key: `(organization_id, normalized_email)` with `NULLS NOT DISTINCT` and `deleted_at IS NULL`.

Rules:

- `opted_in` is eligible unless another delivery rule excludes the address.
- `opted_out` and `suppressed` are never queued.
- Unsubscribe, complaint, and hard bounce override imported/manual opt-in.
- Re-importing an opted-out/suppressed address does not silently re-enable it; it is reported as skipped.
- Re-opt-in requires an explicit protected update or a new explicit public form consent, with timestamp/evidence and audit trail.
- Marketing consent never changes transactional email delivery such as password reset or an explicitly requested POS receipt.
- Consent evidence is operator-provided reference text/identifier, not arbitrary executable content.

### Imported consent

CSV is parsed client-side to JSON, consistent with existing imports. Maximum 500 rows per request.

```text
email,status,consent_at,source,evidence
jane@example.com,opted_in,2026-10-09T10:00:00Z,legacy-crm,Form archive 2024
```

```http
POST /marketing/api/v1/contact-preferences/import/preview
POST /marketing/api/v1/contact-preferences/import
```

Preview performs no writes and returns `valid`, `duplicates_in_file`, `already_opted_out`, `suppressed`, and `invalid`. Import creates one batch, applies valid non-conflicting rows independently, and returns `created`, `updated`, and `skipped[{index,email,reason}]`. Batch records importing actor, server import timestamp, declared source, row counts, and status. No billing applies.

## 6. F-03 Audience segments

```text
marketing_segments
  uuid
  organization_id
  name
  description nullable
  contact_scope leads|customers|both
  rules jsonb
  status active|inactive|deleted
  created_at / updated_at / deleted_at
```

Supported initial rule fields:

- Contact type (`lead`, `customer`)
- Lead status, source, assigned user, value min/max, created/updated range
- Customer status and created/updated range
- Company name
- Lead/customer metadata field/value
- Consent status
- Prior campaign delivered/opened/clicked/not-clicked membership

Rules are a validated declarative JSON tree with bounded depth and rule count, for example:

```json
{
  "operator": "and",
  "rules": [
    {"field":"lead.source","operator":"eq","value":"website"},
    {"field":"consent.status","operator":"eq","value":"opted_in"}
  ]
}
```

The server compiles only allowlisted fields/operators into Sequelize conditions or guarded batch lookups. Raw SQL, model names, column names, regular expressions, and arbitrary JSON paths are rejected.

Preview returns live counts and representative rows but does not create members. Dynamic segment changes affect future previews/runs only; each run snapshots its final audience.

### Identity and deduplication

Audience resolution normalizes email and emits one recipient per normalized address per run:

1. Customer wins when the same email exists as both customer and lead.
2. The member retains both customer and lead references when known.
3. Customer name/company is preferred, with lead values as fallback.
4. One email equals one eligible/billable recipient for that run.
5. Missing email, invalid email, opted-out, suppressed, and duplicate rows are excluded with reason counts.

## 7. F-04 Campaigns

```text
marketing_campaigns
  uuid
  organization_id
  name
  description nullable
  objective nullable
  template_id
  segment_id
  owner_id nullable
  status draft|scheduled|running|paused|completed|cancelled
  scheduled_at nullable (UTC)
  budget nullable
  utm_source
  utm_medium
  utm_campaign
  created_at / updated_at / deleted_at
```

Lifecycle:

```text
draft → scheduled → running → paused → running → completed
  └───────────────→ cancelled ←───────────────┘
```

- Create starts at `draft`.
- Schedule validates a future organization-local datetime and stores UTC.
- Start/schedule requires active settings, sender, template, segment, Mailgun configuration, valid template rendering, and at least one eligible recipient.
- Recipient-affecting fields (`segment_id`, template, sender/UTM snapshot) lock for an active run. Editing the campaign draft after completion does not alter historical runs.
- Pause stops workers from claiming new queued messages; it cannot recall provider-accepted messages.
- Cancel marks unclaimed queued messages cancelled and preserves accepted/delivered history.
- Completion occurs after every member message reaches a terminal state.
- Rerunning creates a new immutable run; it never resets an old run.

Campaign CRUD logs plain activity rows. Run start and provider-accepted recipients follow F-07 billing.

## 8. F-05 Email templates

```text
marketing_templates
  uuid
  organization_id
  name
  subject
  preview_text nullable
  html_body
  text_body
  status active|inactive|deleted
  created_at / updated_at / deleted_at
```

Supported placeholders:

```text
{{contact.name}}
{{contact.email}}
{{contact.company}}
{{campaign.name}}
{{organization.name}}
{{unsubscribe_url}}
{{landing_page.url}}
{{custom.<validated_key>}}
```

Rules:

- Business/contact/campaign/organization values are server-owned.
- Caller parameters are restricted to `custom.*` with the same bounded lowercase key convention as PDF generation.
- HTML is sanitized; scripts, event handlers, unsafe URLs, forms, arbitrary iframes, and active content are removed/rejected.
- A valid unsubscribe placeholder/link is mandatory before campaign start.
- Subject, HTML, and text output must contain no unresolved placeholders.
- Plain-text content is required; an editor may derive a draft from sanitized HTML, but the stored/sent text body is explicit and previewable.
- Template preview uses synthetic or selected same-org contact data without sending.
- Test send targets an authorized user-provided email, is marked as a test, does not create campaign members/events, and is not recipient-billed. It may be separately rate-limited.

Email-template Mustache rendering is independent from Google Docs PDF rendering and never uses Drive/Docs APIs.

## 9. F-06 Audience preview and immutable run snapshot

```http
POST /marketing/api/v1/campaigns/{uuid}/preview
POST /marketing/api/v1/campaigns/{uuid}/runs
```

Preview returns:

```text
segment_matches
eligible
missing_email
invalid_email
duplicate_email
no_consent
opted_out
suppressed
estimated_campaign_credit
estimated_recipient_credit
estimated_total_credit
```

Starting a run resolves and snapshots audience rows in a DB transaction:

```text
marketing_campaign_runs
  uuid
  organization_id
  campaign_id
  status preparing|queued|running|paused|completed|cancelled|billing_exhausted|failed
  organization_timezone
  sender_snapshot jsonb
  template_snapshot jsonb
  utm_snapshot jsonb
  segment_rules_snapshot jsonb
  audience_count
  eligible_count
  excluded_counts jsonb
  campaign_billed_at nullable
  started_at nullable
  completed_at nullable
  created_at / updated_at

marketing_campaign_members
  uuid
  organization_id
  campaign_run_id
  normalized_email
  contact_type lead|customer
  lead_id nullable
  customer_id nullable
  name_snapshot
  email_snapshot
  company_snapshot nullable
  consent_snapshot jsonb
  status eligible|excluded|queued|accepted|delivered|failed|cancelled
  exclusion_reason nullable
  created_at / updated_at
```

Unique active/run key: `(campaign_run_id, normalized_email)`. Snapshots ensure later contact, consent, segment, template, or campaign edits never rewrite what was selected/sent. A last-moment consent/suppression check still runs before provider submission; a newly unsubscribed address is cancelled even if the snapshot was eligible.

## 10. F-07 Billing and Mailgun queue

### Billing actions

```text
marketing:campaign:view:send       // one campaign-run fee
marketing:recipient:create:send    // one fee per Mailgun-accepted unique recipient
```

Both actions are marked transaction-enabled in Base action seed/package configuration.

### Charging semantics

- A run with zero eligible recipients is rejected and consumes no credit.
- The campaign fee settles exactly once when preparation succeeds and the run transitions to `queued`; `campaign_billed_at` and a unique billing/idempotency key prevent repeat settlement.
- Recipient fee settles exactly once only after Mailgun accepts the message and returns a provider message ID.
- Excluded, invalid, opted-out, suppressed, cancelled-before-send, and permanently failed-before-acceptance recipients consume no recipient credit.
- Open, click, delivery, bounce, retry, pause/resume, and webhook replay never add recipient credit.
- Test sends are not campaign recipients and consume neither fee.
- Billing/package denial before run creation returns the existing controlled 403 and creates no run/members.
- If recipient quota becomes unavailable during an active run, no further messages are submitted; the run enters `billing_exhausted` and can resume after billing capacity is restored. Previously accepted messages remain charged and are not resent.

Background workers do not trust a browser session snapshot. The run stores the initiating actor snapshot/UUID for activity attribution, while billing resolves the live organization invoice/package and transaction-enabled actions. Recipient acceptance status, provider ID, and recipient settlement must be coordinated idempotently so a worker crash/retry cannot double-send or double-charge. Extend the transaction helper with explicit idempotency/unit semantics if the current check-then-settle flow cannot guarantee this atomically.

### Message queue

```text
marketing_messages
  uuid
  organization_id
  campaign_run_id
  campaign_member_id
  provider = mailgun
  provider_message_id nullable
  idempotency_key unique
  status queued|processing|accepted|delivered|soft_bounced|hard_bounced|complained|failed|cancelled
  attempts
  next_attempt_at nullable
  accepted_at nullable
  delivered_at nullable
  recipient_billed_at nullable
  last_error_code nullable
  last_error_summary nullable
  processing_started_at nullable
  created_at / updated_at

marketing_message_attempts
  uuid
  message_id
  attempt_no
  outcome accepted|transient_failure|permanent_failure|billing_blocked
  provider_message_id nullable
  error_code nullable
  error_summary nullable
  attempted_at
```

Worker requirements:

- Run outside request/response lifecycle through a dedicated command/process or scheduler.
- Atomically claim bounded batches using row locking/`SKIP LOCKED` or equivalent.
- Recover stale `processing` claims after a configured timeout.
- Enforce Mailgun and organization send rates.
- Recheck run status and current contact preference immediately before sending.
- Render from immutable run/member snapshots and generate a unique signed unsubscribe URL.
- Retry only transient network/429/5xx outcomes with bounded exponential backoff.
- Treat invalid address/provider permanent 4xx as terminal without recipient billing.
- Store summarized errors, never API keys or full message bodies.

Environment additions build on existing Mailgun configuration:

```dotenv
MAILGUN_API_KEY=
MAILGUN_DOMAIN=
MAILGUN_FROM=
MAILGUN_WEBHOOK_SIGNING_KEY=
MARKETING_WORKER_BATCH_SIZE=50
MARKETING_WORKER_STALE_SECONDS=300
MARKETING_SENDS_PER_MINUTE=300
MARKETING_PUBLIC_TOKEN_SECRET=
```

## 11. F-08 Mailgun webhooks and unsubscribe

### Mailgun webhook

```http
POST /marketing/api/v1/webhooks/mailgun
```

The route is public by transport necessity and must not use session authorization/encrypted request envelopes. It verifies Mailgun timestamp/token/signature with `MAILGUN_WEBHOOK_SIGNING_KEY`, enforces a short timestamp window, and stores provider event IDs uniquely for replay protection.

Handled events:

```text
accepted
delivered
opened
clicked
temporary_fail
permanent_fail
complained
unsubscribed
```

`marketing_events` stores the minimum required normalized data and a bounded payload summary. It does not retain full MIME content or provider secrets. Events are idempotent and can arrive out of order; state transitions must not regress terminal message states. Open metrics are labelled approximate because privacy proxies may preload tracking pixels. Unique clicks and conversions are stronger report signals.

Hard bounce/permanent invalid-address failure, complaint, and unsubscribe upsert organization-level suppression/preference state. A webhook cannot select an organization from arbitrary payload fields; it resolves a signed/provider message identifier to the stored message/run organization.

### Unsubscribe

```http
GET  /marketing/unsubscribe/{signedToken}
POST /marketing/unsubscribe/{signedToken}
```

The opaque signed token identifies organization + normalized recipient + expiry/purpose without exposing editable IDs. GET displays confirmation; POST performs idempotent opt-out and records an event. No login is required. Expired/invalid tokens fail safely without revealing whether an address exists.

## 12. F-09 Landing pages

```text
marketing_landing_pages
  uuid
  organization_id
  campaign_id nullable
  form_id nullable
  name
  organization_slug
  slug
  title
  seo_description nullable
  content jsonb
  status draft|published|unpublished|deleted
  published_at nullable
  created_at / updated_at / deleted_at
```

Public route:

```text
/marketing/l/{organizationSlug}/{pageSlug}
```

Content uses a versioned structured-block schema, initially:

- Hero: heading, body, safe image URL, CTA label/URL
- Rich text: sanitized limited markup
- Image: safe HTTPS URL + alt text
- CTA: label + safe URL
- Lead form reference
- Spacer/divider

Arbitrary JavaScript, event handlers, inline scripts, unsafe HTML, `javascript:` URLs, unapproved iframes, and raw server components are rejected. Publish validates every block, unique slug, referenced active form, campaign scope, and safe links. Public rendering reads only published/non-deleted rows and returns 404 across organizations/unpublished state.

Protected UI includes create/edit, mobile/desktop preview, publish/unpublish, and campaign/form selection. Publishing is separately permission-gated from editing.

## 13. F-10 Lead-capture forms

```text
marketing_forms
  uuid
  organization_id
  name
  fields jsonb
  consent_text
  success_message
  redirect_url nullable
  status active|inactive|deleted
  created_at / updated_at / deleted_at

marketing_form_submissions
  uuid
  organization_id
  form_id
  landing_page_id nullable
  campaign_id nullable
  lead_id nullable
  sanitized_data jsonb
  consent_snapshot jsonb
  visitor_id nullable
  utm_snapshot jsonb
  submitted_at
```

Initial allowlisted fields:

```text
name (required configurable)
email (required)
phone_number
company
message
consent checkbox
approved lead metadata field mappings
```

Public endpoint:

```http
POST /marketing/api/v1/public/forms/{opaquePublicId}/submit
```

Public submission protection:

- Resolve organization/campaign/page from stored form and signed page context, never payload organization IDs.
- Strictly validate against the stored active field schema; reject unknown keys.
- Normalize email/phone and cap every field/body size.
- Per-IP/form rate limit, honeypot, minimum-fill timing, and duplicate submission window.
- Optional CAPTCHA is deferred but schema permits later provider integration.
- Return generic errors that do not reveal existing leads/customers.
- Redirect only to a stored, validated safe URL; request payload cannot choose a redirect.

Submission transaction:

1. Validate form/page/campaign scope and anti-abuse controls.
2. Capture server-known UTM/touch context and submitted consent text/version.
3. Find a same-organization lead by normalized email.
4. Create a new lead when absent, using the organization's lowest-weight active lead status (fallback `new`) and a marketing/form source mapping.
5. For an existing lead, update only approved acquisition fields when currently empty; never overwrite status, assignment, value, or notes/message history silently.
6. Store free-form message as a marketing submission/activity reference rather than replacing Sales notes.
7. Upsert explicit consent only when the checkbox required by the form is affirmatively submitted.
8. Store the immutable submission and resulting lead UUID.
9. Attach first/last-touch attribution.

Lead create billing must be explicitly decided in implementation against the existing `sales:lead:create:create` transaction rule: public marketing submissions cannot carry a user session. Approved MVP behavior is to treat form acquisition as marketing-owned and not settle the normal manual-lead-create action; campaign/run/recipient billing remains unchanged. The submission and lead creation are still fully audited with source `marketing_form`.

## 14. F-11 Tracked links and attribution

### Tracked redirects

```text
marketing_tracked_links
  uuid
  organization_id
  campaign_id
  campaign_run_id nullable
  message_id nullable
  token_hash unique
  destination_url
  created_at
```

Public route:

```http
GET /marketing/r/{opaqueToken}
```

The route validates the opaque token, records an idempotent/bounded click event, applies server-owned UTM values, sets/updates a signed first-party visitor identifier, and redirects to the prevalidated stored destination. The request cannot supply a destination. Unsafe schemes and open redirects are forbidden.

### First- and last-touch attribution

```text
marketing_attributions
  uuid
  organization_id
  visitor_id nullable
  normalized_email nullable
  campaign_id
  campaign_run_id nullable
  landing_page_id nullable
  lead_id nullable
  customer_id nullable
  touch_type first|last
  source
  medium
  campaign_value
  touch_event_type click|landing_view|form_submit
  touched_at
  created_at
```

Rules:

- First touch for an attributed identity/entity is immutable once established.
- Last touch updates by appending a new touch and resolving the latest timestamp; do not rewrite event history.
- Anonymous visitor touches become associated when a form identifies the visitor.
- Lead-to-customer conversion propagates references without deleting lead attribution.
- Identity association is organization-scoped; visitor IDs and emails never join across organizations.
- Reports display both models independently; they are not summed together as one revenue figure.
- PR/SO/POS conversion/revenue reads authoritative existing rows and stored monetary snapshots. Marketing never recalculates or mutates order/POS amounts.
- SO is the primary attributed revenue baseline for customer sales; POS customer transactions may be a separate channel metric. Walk-in POS transactions without identity are unattributed.

## 15. F-12 Reports and dashboard

Campaign/run metrics:

- Segment matches and eligible members
- Queued, accepted, delivered, transient/permanent failed
- Unique approximate opens
- Unique clicks and click-through rate
- Hard/soft bounce, complaint, unsubscribe
- Landing views and form submissions
- Leads and customers attributed
- First-touch and last-touch PR/SO/POS counts
- First-touch and last-touch attributed revenue
- Campaign fee, accepted-recipient count/fee, configured budget, and ROI

Filters:

```text
campaign_id
run_id
owner_id
status
date_from/date_to
source/medium
attribution_model first|last
```

Reports are server-aggregated, organization-scoped, read-only, and independently degrade cross-module labels to UUIDs. Large exports are a later feature; MVP dashboard queries enforce date ranges and result caps.

## 16. Permission codes

```text
marketing:setting:view:detail
marketing:setting:view:update

marketing:contact-preference:list:list
marketing:contact-preference:create:import
marketing:contact-preference:view:update

marketing:segment:list:list
marketing:segment:create:create
marketing:segment:view:detail
marketing:segment:view:update
marketing:segment:view:delete
marketing:segment:view:preview

marketing:template:list:list
marketing:template:create:create
marketing:template:view:detail
marketing:template:view:update
marketing:template:view:delete
marketing:template:view:preview
marketing:template:view:test

marketing:campaign:list:list
marketing:campaign:create:create
marketing:campaign:view:detail
marketing:campaign:view:update
marketing:campaign:view:delete
marketing:campaign:view:schedule
marketing:campaign:view:send
marketing:campaign:view:pause
marketing:campaign:view:cancel

marketing:recipient:create:send

marketing:landing-page:list:list
marketing:landing-page:create:create
marketing:landing-page:view:detail
marketing:landing-page:view:update
marketing:landing-page:view:delete
marketing:landing-page:view:publish

marketing:form:list:list
marketing:form:create:create
marketing:form:view:detail
marketing:form:view:update
marketing:form:view:delete
marketing:form-submission:list:list

marketing:report:list:list
base:menu:marketing:*
```

Only `marketing:campaign:view:send` and `marketing:recipient:create:send` are transaction-enabled. Public endpoints use signed/provider-specific verification and never grant protected permissions.

## 17. API outline

Protected APIs:

```text
/marketing/api/v1/settings
/marketing/api/v1/contact-preferences
/marketing/api/v1/contact-preferences/import/preview
/marketing/api/v1/contact-preferences/import
/marketing/api/v1/segments
/marketing/api/v1/segments/{uuid}
/marketing/api/v1/segments/{uuid}/preview
/marketing/api/v1/templates
/marketing/api/v1/templates/{uuid}
/marketing/api/v1/templates/{uuid}/preview
/marketing/api/v1/templates/{uuid}/test
/marketing/api/v1/campaigns
/marketing/api/v1/campaigns/{uuid}
/marketing/api/v1/campaigns/{uuid}/preview
/marketing/api/v1/campaigns/{uuid}/schedule
/marketing/api/v1/campaigns/{uuid}/runs
/marketing/api/v1/campaign-runs/{uuid}
/marketing/api/v1/campaign-runs/{uuid}/pause
/marketing/api/v1/campaign-runs/{uuid}/resume
/marketing/api/v1/campaign-runs/{uuid}/cancel
/marketing/api/v1/landing-pages
/marketing/api/v1/landing-pages/{uuid}
/marketing/api/v1/landing-pages/{uuid}/publish
/marketing/api/v1/landing-pages/{uuid}/unpublish
/marketing/api/v1/forms
/marketing/api/v1/forms/{uuid}
/marketing/api/v1/form-submissions
/marketing/api/v1/reports/campaigns
/marketing/api/v1/reports/attribution
```

Public routes:

```text
GET  /marketing/l/{organizationSlug}/{pageSlug}
POST /marketing/api/v1/public/forms/{opaquePublicId}/submit
GET  /marketing/r/{opaqueToken}
GET  /marketing/unsubscribe/{signedToken}
POST /marketing/unsubscribe/{signedToken}
POST /marketing/api/v1/webhooks/mailgun
```

All protected API routes export `runtime="nodejs"` and use encrypted JSON. Public routes are HTTPS plaintext by necessity and use strict route-specific validation/signatures/rate limits; they never use `x-app-verbose` as an authorization mechanism.

## 18. UI map

```text
app/marketing/
  views/settings/
  views/contact-preferences/ (+ import)
  views/segments/ (+ create/detail/edit/preview)
  views/templates/ (+ create/detail/edit/preview/test)
  views/campaigns/ (+ create/detail/edit/run detail)
  views/landing-pages/ (+ create/detail/edit/preview)
  views/forms/ (+ create/detail/edit/submissions)
  views/reports/
```

Forms use the shared `components/FormField.tsx` kit, errors through `error`, and `role="status"`/`role="alert"`. Submit actions are disabled while pending/loading and guarded in handlers. Segment/template/settings dependencies degrade independently with `Promise.allSettled`; a secondary option failure must not blank a primary campaign detail view. Public form UI is accessible, mobile-first, and does not reveal internal IDs or validation internals.

## 19. Implementation order

1. Module scaffold/layout/menu/actions plus `sass_organization.timezone` and marketing settings.
2. Contact preference/suppression model, CRUD, unsubscribe token flow, and consent import preview/import.
3. Email template model/editor/sanitizer/renderer/preview/test send.
4. Segment rule schema/compiler, lead/customer resolver, preview, and normalized-email deduplication.
5. Campaign CRUD/lifecycle, immutable run/member snapshots, and run-start billing.
6. Message queue/attempt models, worker command, Mailgun sender, accepted-recipient billing, pause/resume/recovery.
7. Verified Mailgun webhook, event state reducer, bounce/complaint suppression.
8. Landing page structured editor/publish/public renderer.
9. Lead-capture forms, anti-abuse, submission persistence, consent, and guarded Sales lead creation.
10. Tracked redirects, visitor association, first/last attribution propagation.
11. Dashboard/report aggregation and attributed SO/POS metrics.

## 20. Acceptance criteria

- [ ] All protected lists/gets/writes are strictly organization-scoped; payload `organization_id` is rejected and cross-org UUIDs return 404.
- [ ] Organization-local schedule input round-trips correctly to UTC across timezone changes/DST-capable zones.
- [ ] Imported consent records source, original timestamp, evidence, importing actor, and batch; imports cannot reactivate opted-out/suppressed addresses silently.
- [ ] A lead and customer sharing an email produce one campaign member/message, prefer customer display data, and incur at most one recipient charge.
- [ ] Segment rules accept only allowlisted fields/operators/depth and cannot inject SQL or arbitrary metadata paths.
- [ ] Preview exclusion counts equal the final snapshot barring consent/contact changes between preview and start; run snapshot remains unchanged after source edits.
- [ ] Campaign with zero eligible recipients creates no run charge. A valid run charges one campaign fee exactly once.
- [ ] Mailgun-accepted recipient charges exactly once; transient retries, worker crashes, webhook replay, delivery/open/click, pause/resume, and test sends never double-charge.
- [ ] Invalid/suppressed/cancelled-before-send/permanent-failed-before-acceptance contacts consume no recipient credit.
- [ ] Quota exhaustion pauses further provider submissions as `billing_exhausted` without resending already accepted messages.
- [ ] Pausing prevents new claims; cancelling marks unclaimed messages cancelled; stale processing claims recover safely.
- [ ] Email output is sanitized, contains an unsubscribe link, and has no unresolved placeholders; unsafe script/URL content is rejected.
- [ ] Mailgun webhook rejects invalid/replayed signatures, handles out-of-order events idempotently, and suppresses hard-bounce/complaint/unsubscribe recipients.
- [ ] Landing pages render only published structured content; unsafe HTML/scripts/open redirects and request-selected destinations are impossible.
- [ ] Public form rejects unknown/oversized fields, is rate-limited/honeypot-protected, resolves organization from stored form, and does not expose whether a lead exists.
- [ ] Public submission creates or safely enriches a same-org lead without overwriting status/assignment/value/notes, records consent snapshot, and creates first/last attribution.
- [ ] First touch remains immutable; last touch resolves to the latest valid touch; lead-to-customer conversion preserves references.
- [ ] Attribution reports read authoritative PR/SO/POS snapshots, separate first/last models, and never mutate sales data.
- [ ] Secrets, full message bodies, raw API errors, and unnecessary personal data do not appear in logs/events.
- [ ] `tsc --noEmit`, lint, migrations, worker recovery tests, encrypted protected APIs, public-route security tests, and the documented production build/restart workflow pass.

## 21. Out of scope

- SMS, WhatsApp, push notifications, and social publishing
- Google/Facebook advertising synchronization
- Visual multi-step automation/journey builder
- AI-generated marketing copy
- Complex algorithmic multi-touch/fractional attribution
- Arbitrary landing-page JavaScript, custom server code, or unrestricted HTML
- CAPTCHA provider integration in MVP (schema/extension point only)
- Large report exports and permanent raw Mailgun payload retention
- Automatic sales lifecycle/status changes based on opens/clicks
- Marketing mutation of product prices, stock, PR/SO/POS amounts, or warehouse movements

## 22. Test plan

### Unit

- Email normalization, deduplication, consent precedence, re-opt-in rules.
- Segment rule schema/compiler allowlists, nesting limits, and injection rejection.
- Mustache allowlist, unresolved tokens, HTML sanitation, safe URL checks.
- Timezone conversion and scheduled-state transitions.
- Billing idempotency keys and run/message state reducers.
- Mailgun signature and replay-window verification.
- Signed unsubscribe/tracked-link tokens, redirect allowlist, visitor identifiers.
- Landing block/form schemas, anti-abuse limits, safe lead field mapping.
- First/last-touch resolution and lead→customer propagation.

### Integration

- Import preview/import partial success with opted-out/suppressed precedence.
- Mixed lead/customer segment preview and one-email snapshot deduplication.
- Run start transaction: snapshots + queue + one campaign settlement; rollback on failure.
- Worker transient retry, stale claim recovery, pause/cancel, provider acceptance + one recipient settlement.
- Webhook duplicate/out-of-order events and suppression updates.
- Public form creates/finds lead same-org and rejects cross-org/tampered context.
- Landing click → form submit → lead → customer → SO/POS attribution report.

### Manual/smoke

- Mailgun sandbox/test-domain send, delivered/open/click/unsubscribe/bounce webhook cycle.
- Campaign preview with missing email, duplicates, imported consent, opt-out, and suppression.
- Organization-timezone scheduled campaign.
- Mobile landing page/form, success message and safe redirect.
- Billing package with campaign and recipient action credits, including exhaustion mid-run.
- Re-login after grants; clean all test contacts/campaigns through scoped APIs.
