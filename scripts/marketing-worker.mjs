#!/usr/bin/env node
// Marketing queue worker (F-07): claims queued messages with SKIP LOCKED,
// rechecks run status + consent, renders from immutable snapshots, sends
// through Mailgun, and settles recipient billing exactly-once per message.
//
// Exactly-once billing: recipient_billed_at flips only when unset, and the
// credit increment follows inside the same pass; retries/transient failures,
// webhook replays, and delivery/open/click events never re-bill. Crash
// recovery requeues stale `processing` claims after MARKETING_WORKER_STALE_SECONDS.
//
// Usage:
//   DATABASE_URL=... MARKETING_PUBLIC_TOKEN_SECRET=... APP_URL=... \
//     node scripts/marketing-worker.mjs [--batch-size N] [--once]
//
// Exit 0 with a JSON summary on stdout. Designed for cron/PM2 scheduling,
// outside the Next.js request/response lifecycle.
import { createHash, createHmac, randomBytes } from "node:crypto";
import pg from "pg";

const { Client } = pg;

const BATCH_SIZE = Number(process.argv.includes("--batch-size")
  ? process.argv[process.argv.indexOf("--batch-size") + 1]
  : process.env.MARKETING_WORKER_BATCH_SIZE ?? 50);
const STALE_SECONDS = Number(process.env.MARKETING_WORKER_STALE_SECONDS ?? 300);
const SENDS_PER_MINUTE = Number(process.env.MARKETING_SENDS_PER_MINUTE ?? 300);
const APP_URL = (process.env.APP_URL ?? "http://localhost:3000").replace(/\/+$/, "");
const RECIPIENT_ACTION = "marketing:recipient:create:send";
const MAX_BACKOFF_MS = 30 * 60 * 1000;

const summary = { claimed: 0, accepted: 0, transient: 0, permanent: 0, billing_blocked: 0, consent_cancelled: 0, skipped: 0, runs_completed: [] };

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const TOKEN_RE = /\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g;

// Minimal mirror of app/marketing/libraries/templateRenderer.ts for the
// worker runtime (plain Node, no TS imports): same allowlist, same
// unresolved-token failure. The TS renderer remains the reference.
function renderWorkerTemplate(parts, context) {
  return {
    subject: renderOne(parts.subject, context),
    html: renderOne(parts.html_body, context),
    text: renderOne(parts.text_body, context),
  };
}

function renderOne(text, context) {
  return text.replace(TOKEN_RE, (whole, token) => {
    const value = resolveWorkerToken(token, context);
    if (value === null || value === undefined) {
      throw new Error(`Unresolved placeholder: ${whole}`);
    }
    return escapeHtml(String(value));
  });
}

function resolveWorkerToken(token, context) {
  switch (token) {
    case "contact.name": return context.contact.name;
    case "contact.email": return context.contact.email;
    case "contact.company": return context.contact.company;
    case "campaign.name": return context.campaign.name;
    case "organization.name": return context.organization.name;
    case "unsubscribe_url": return context.unsubscribe_url;
    case "landing_page.url": return context.landing_page_url;
    default: break;
  }
  if (token.startsWith("custom.")) {
    const key = token.slice(7);
    if (/^[a-z0-9_]{1,40}$/.test(key) && key in context.custom) {
      return context.custom[key];
    }
  }
  return null;
}

function signToken(payload) {
  const secret = process.env.MARKETING_PUBLIC_TOKEN_SECRET;
  if (!secret) {
    throw new Error("MARKETING_PUBLIC_TOKEN_SECRET is not configured.");
  }
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${signature}`;
}

async function resolveBilling(client, organizationId) {
  // Mirrors UserModel.checkActiveInvoiceAndPackage for the recipient action.
  const invoiceRes = await client.query(
    `SELECT * FROM sass_invoice WHERE status = 'running' AND deleted_at IS NULL
     AND (organization ->> 'id' = $1 OR ($1 IS NULL AND organization ->> 'id' IS NULL))
     ORDER BY created_at DESC LIMIT 1`,
    [organizationId],
  );
  const invoice = invoiceRes.rows[0];
  if (!invoice) {
    return { denied: "No running invoice." };
  }
  const packageId = invoice.package?.id;
  const packageRes = await client.query("SELECT * FROM sass_package WHERE uuid = $1 AND deleted_at IS NULL", [packageId]);
  const pkg = packageRes.rows[0];
  if (!pkg) {
    return { denied: "Package not found." };
  }
  const actionRes = await client.query("SELECT uuid FROM base_actions WHERE action = $1 AND deleted_at IS NULL", [RECIPIENT_ACTION]);
  const actionUuid = actionRes.rows[0]?.uuid;
  if (!actionUuid) {
    return { denied: "Recipient billing action is not configured." };
  }
  const entries = Array.isArray(pkg.actions) ? pkg.actions : [];
  const entry = entries.find((item) => item?.action_id === actionUuid);
  if (!entry) {
    return { denied: "Action is not included in the package." };
  }
  if (pkg.type === "subscription" && (!invoice.end_date || new Date(invoice.end_date).getTime() <= Date.now())) {
    return { denied: "Subscription has expired." };
  }
  if (pkg.type === "quota") {
    const usage = typeof invoice.credit_usage === "number" ? invoice.credit_usage : 0;
    if (typeof invoice.credit_limit !== "number" || usage >= invoice.credit_limit) {
      return { denied: "Credit quota exhausted." };
    }
  }
  return { invoice, credit: typeof entry.credit === "number" ? entry.credit : null };
}

async function sendMailgun({ to, subject, text, html, fromName, fromEmail, replyTo }) {
  const apiKey = process.env.MAILGUN_API_KEY?.trim();
  const domain = process.env.MAILGUN_DOMAIN?.trim();
  if (!apiKey || !domain) {
    return { accepted: false, providerMessageId: null, error: "Mailgun is not configured." };
  }
  // Overridable for the EU region endpoint and offline test doubles.
  const apiBase = (process.env.MAILGUN_API_BASE?.trim() || "https://api.mailgun.net").replace(/\/+$/, "");
  try {
    const body = new URLSearchParams({
      from: `${fromName || "VortexGin"} <${fromEmail || `no-reply@${domain}`}>`,
      to,
      subject,
      text,
    });
    if (html) body.set("html", html);
    if (replyTo) body.set("h:Reply-To", replyTo);
    body.append("o:tag", "marketing");
    const response = await fetch(`${apiBase}/v3/${domain}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`api:${apiKey}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });
    if (!response.ok) {
      const textBody = await response.text().catch(() => "");
      const transient = response.status === 429 || response.status >= 500;
      return { accepted: false, providerMessageId: null, error: `Mailgun ${response.status}: ${textBody.slice(0, 200)}`, transient };
    }
    const payload = await response.json().catch(() => null);
    const id = payload && typeof payload.id === "string" ? payload.id : null;
    if (!id) {
      return { accepted: false, providerMessageId: null, error: "Mailgun accepted without a message ID.", transient: true };
    }
    return { accepted: true, providerMessageId: id };
  } catch (error) {
    return { accepted: false, providerMessageId: null, error: `Transport: ${error?.message ?? error}`, transient: true };
  }
}

function backoffMs(attempts) {
  return Math.min(MAX_BACKOFF_MS, 60 * 1000 * 2 ** Math.max(0, attempts - 1));
}

// Rewrites message links to tracked redirects (bounded); the unsubscribe
// URL keeps its own signature and is never rewritten.
async function rewriteTrackedLinks(client, html, refs) {
  const hrefs = [...html.matchAll(/href\s*=\s*"([^"]*)"/gi)].map((match) => match[1]);
  const unique = [...new Set(hrefs)].filter((href) => /^https?:\/\//i.test(href) && !href.includes("/marketing/unsubscribe/")).slice(0, 20);
  let out = html;
  for (const destination of unique) {
    const bearer = randomBytes(24).toString("base64url");
    const tokenHash = createHash("sha256").update(bearer).digest("hex");
    await client.query(
      `INSERT INTO marketing_tracked_links (uuid, organization_id, campaign_id, campaign_run_id, message_id, token_hash, destination_url, created_at, updated_at, deleted_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, NOW(), NOW(), NULL)`,
      [refs.organizationId, refs.campaignId, refs.runId, refs.messageId, tokenHash, destination],
    );
    out = out.split(`"${destination}"`).join(`"${APP_URL}/marketing/r/${bearer}"`);
  }
  return out;
}

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    // 1. Recover stale processing claims.
    await client.query(
      `UPDATE marketing_messages SET status = 'queued', processing_started_at = NULL, updated_at = NOW()
       WHERE status = 'processing' AND processing_started_at < NOW() - ($1 || ' seconds')::interval AND deleted_at IS NULL`,
      [String(STALE_SECONDS)],
    );

    // 2. Claim a bounded batch (SKIP LOCKED: parallel workers never collide).
    const claimed = await client.query(
      `UPDATE marketing_messages SET status = 'processing', processing_started_at = NOW(), attempts = attempts + 1, updated_at = NOW()
       WHERE uuid IN (
         SELECT m.uuid FROM marketing_messages m
         JOIN marketing_campaign_runs r ON r.uuid = m.campaign_run_id
         WHERE m.status = 'queued' AND m.deleted_at IS NULL
           AND (m.next_attempt_at IS NULL OR m.next_attempt_at <= NOW())
           AND r.status IN ('queued', 'running') AND r.deleted_at IS NULL
         ORDER BY m.created_at ASC LIMIT $1
         FOR UPDATE OF m SKIP LOCKED
       )
       RETURNING uuid, organization_id, campaign_run_id, campaign_member_id, attempts`,
      [BATCH_SIZE],
    );
    const paceMs = SENDS_PER_MINUTE > 0 ? Math.floor(60000 / SENDS_PER_MINUTE) : 0;

    for (const message of claimed.rows) {
      summary.claimed += 1;
      if (paceMs > 0 && summary.claimed > 1) {
        await sleep(paceMs);
      }
      try {
        await processMessage(client, message);
      } catch (error) {
        // Never let one message kill the batch; it stays processing and the
        // next pass recovers it after the stale timeout.
        console.error(`message ${message.uuid} worker error:`, error?.message ?? error);
      }
    }

    // 3. Complete runs whose messages all reached terminal states.
    const touchedRuns = [...new Set(claimed.rows.map((row) => row.campaign_run_id))];
    for (const runId of touchedRuns) {
      const open = await client.query(
        `SELECT COUNT(*)::int AS n FROM marketing_messages
         WHERE campaign_run_id = $1 AND status IN ('queued', 'processing') AND deleted_at IS NULL`,
        [runId],
      );
      if (open.rows[0].n === 0) {
        await client.query(
          `UPDATE marketing_campaign_runs SET status = 'completed', completed_at = NOW(), updated_at = NOW()
           WHERE uuid = $1 AND status IN ('queued', 'running', 'paused') AND deleted_at IS NULL`,
          [runId],
        );
        const run = await client.query("SELECT campaign_id FROM marketing_campaign_runs WHERE uuid = $1", [runId]);
        if (run.rows[0]) {
          await client.query(
            `UPDATE marketing_campaigns SET status = 'completed', updated_at = NOW()
             WHERE uuid = $1 AND status IN ('running', 'paused') AND deleted_at IS NULL`,
            [run.rows[0].campaign_id],
          );
        }
        summary.runs_completed.push(runId);
      }
    }
  } finally {
    await client.end();
  }
  console.log(JSON.stringify(summary));
}

async function processMessage(client, message) {
  const memberRes = await client.query("SELECT * FROM marketing_campaign_members WHERE uuid = $1 AND deleted_at IS NULL", [message.campaign_member_id]);
  const member = memberRes.rows[0];
  if (!member || member.status === "cancelled" || member.status === "excluded") {
    await client.query("UPDATE marketing_messages SET status = 'cancelled', updated_at = NOW() WHERE uuid = $1", [message.uuid]);
    summary.skipped += 1;
    return;
  }
  const runRes = await client.query("SELECT * FROM marketing_campaign_runs WHERE uuid = $1 AND deleted_at IS NULL", [message.campaign_run_id]);
  const run = runRes.rows[0];
  if (!run || !["queued", "running"].includes(run.status)) {
    // Paused/cancelled/exhausted: leave queued for later, no attempt logged.
    await client.query("UPDATE marketing_messages SET status = 'queued', processing_started_at = NULL, updated_at = NOW() WHERE uuid = $1", [message.uuid]);
    summary.skipped += 1;
    return;
  }
  const orgId = run.organization_id;

  // Last-moment consent check: only opted_in sends.
  const prefRes = await client.query(
    `SELECT status FROM marketing_contact_preferences
     WHERE organization_id IS NOT DISTINCT FROM $1 AND normalized_email = $2 AND deleted_at IS NULL`,
    [orgId, member.normalized_email],
  );
  if (prefRes.rows[0]?.status !== "opted_in") {
    await client.query("UPDATE marketing_messages SET status = 'cancelled', updated_at = NOW() WHERE uuid = $1", [message.uuid]);
    await client.query("UPDATE marketing_campaign_members SET status = 'cancelled', exclusion_reason = 'consent revoked before send', updated_at = NOW() WHERE uuid = $1", [member.uuid]);
    summary.consent_cancelled += 1;
    return;
  }

  // Billing gate resolves the live invoice/package (never a snapshot).
  const billing = await resolveBilling(client, orgId);
  if (billing.denied) {
    await client.query(
      `INSERT INTO marketing_message_attempts (uuid, message_id, attempt_no, outcome, error_summary, attempted_at)
       VALUES (gen_random_uuid(), $1, $2, 'billing_blocked', $3, NOW())`,
      [message.uuid, message.attempts, billing.denied.slice(0, 500)],
    );
    await client.query("UPDATE marketing_messages SET status = 'queued', processing_started_at = NULL, next_attempt_at = NULL, updated_at = NOW() WHERE uuid = $1", [message.uuid]);
    await client.query("UPDATE marketing_campaign_runs SET status = 'billing_exhausted', updated_at = NOW() WHERE uuid = $1 AND status IN ('queued', 'running')", [run.uuid]);
    summary.billing_blocked += 1;
    return;
  }

  // Render from immutable snapshots only.
  const sender = run.sender_snapshot ?? {};
  const template = run.template_snapshot ?? {};
  const utm = run.utm_snapshot ?? {};
  let orgName = "Organization";
  const orgRes = await client.query("SELECT name FROM sass_organization WHERE uuid = $1 AND deleted_at IS NULL", [orgId]);
  if (orgRes.rows[0]?.name) {
    orgName = orgRes.rows[0].name;
  }
  const unsubToken = signToken({ purpose: "unsub", org: orgId, email: member.normalized_email, exp: Date.now() + 365 * 24 * 3600 * 1000 });
  let rendered;
  try {
    rendered = renderWorkerTemplate(
      { subject: template.subject, html_body: template.html_body, text_body: template.text_body },
      {
        contact: { name: member.name_snapshot, email: member.email_snapshot, company: member.company_snapshot ?? "" },
        campaign: { name: String(utm.campaign ?? "") },
        organization: { name: orgName },
        unsubscribe_url: `${APP_URL}/marketing/unsubscribe/${unsubToken}`,
        landing_page_url: null,
        custom: {},
      },
    );
  } catch (error) {
    await client.query(
      `INSERT INTO marketing_message_attempts (uuid, message_id, attempt_no, outcome, error_summary, attempted_at)
       VALUES (gen_random_uuid(), $1, $2, 'permanent_failure', $3, NOW())`,
      [message.uuid, message.attempts, String(error?.message ?? error).slice(0, 500)],
    );
    await client.query("UPDATE marketing_messages SET status = 'failed', last_error_summary = $2, updated_at = NOW() WHERE uuid = $1", [message.uuid, "Template render failed."]);
    await client.query("UPDATE marketing_campaign_members SET status = 'failed', updated_at = NOW() WHERE uuid = $1", [member.uuid]);
    summary.permanent += 1;
    return;
  }

  const html = await rewriteTrackedLinks(client, rendered.html, {
    organizationId: orgId,
    campaignId: run.campaign_id,
    runId: run.uuid,
    messageId: message.uuid,
  });

  const send = await sendMailgun({
    to: member.email_snapshot,
    subject: rendered.subject,
    text: rendered.text,
    html,
    fromName: sender.name,
    fromEmail: sender.email,
    replyTo: sender.reply_to,
  });

  if (send.accepted && send.providerMessageId) {
    // Acceptance + recipient billing commit together; the marker makes a
    // retry unable to double-charge even if this pass crashes after Mailgun.
    const marked = await client.query(
      `UPDATE marketing_messages
       SET status = 'accepted', provider_message_id = $2, accepted_at = NOW(),
           recipient_billed_at = NOW(), last_error_code = NULL, last_error_summary = NULL, updated_at = NOW()
       WHERE uuid = $1 AND recipient_billed_at IS NULL`,
      [message.uuid, send.providerMessageId],
    );
    await client.query(
      `INSERT INTO marketing_message_attempts (uuid, message_id, attempt_no, outcome, provider_message_id, attempted_at)
       VALUES (gen_random_uuid(), $1, $2, 'accepted', $3, NOW())`,
      [message.uuid, message.attempts, send.providerMessageId],
    );
    if (marked.rowCount !== 0 && billing.invoice && typeof billing.credit === "number") {
      await client.query("UPDATE sass_invoice SET credit_usage = credit_usage + $2, updated_at = NOW() WHERE uuid = $1", [billing.invoice.uuid, billing.credit]);
    }
    await client.query("UPDATE marketing_campaign_members SET status = 'accepted', updated_at = NOW() WHERE uuid = $1", [member.uuid]);
    summary.accepted += 1;
    return;
  }

  if (send.transient) {
    await client.query(
      `INSERT INTO marketing_message_attempts (uuid, message_id, attempt_no, outcome, error_summary, attempted_at)
       VALUES (gen_random_uuid(), $1, $2, 'transient_failure', $3, NOW())`,
      [message.uuid, message.attempts, String(send.error ?? "transient failure").slice(0, 500)],
    );
    const next = new Date(Date.now() + backoffMs(message.attempts));
    await client.query("UPDATE marketing_messages SET status = 'queued', processing_started_at = NULL, next_attempt_at = $2, last_error_summary = $3, updated_at = NOW() WHERE uuid = $1", [message.uuid, next.toISOString(), String(send.error ?? "").slice(0, 500)]);
    summary.transient += 1;
    return;
  }

  await client.query(
    `INSERT INTO marketing_message_attempts (uuid, message_id, attempt_no, outcome, error_summary, attempted_at)
     VALUES (gen_random_uuid(), $1, $2, 'permanent_failure', $3, NOW())`,
    [message.uuid, message.attempts, String(send.error ?? "permanent failure").slice(0, 500)],
  );
  await client.query("UPDATE marketing_messages SET status = 'failed', last_error_summary = $2, updated_at = NOW() WHERE uuid = $1", [message.uuid, String(send.error ?? "").slice(0, 500)]);
  await client.query("UPDATE marketing_campaign_members SET status = 'failed', updated_at = NOW() WHERE uuid = $1", [member.uuid]);
  summary.permanent += 1;
}

await main().catch((error) => {
  console.error(JSON.stringify({ fatal: String(error?.message ?? error) }));
  process.exitCode = 1;
});
