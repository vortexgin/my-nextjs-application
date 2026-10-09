type MailgunConfig = {
  apiKey: string;
  domain: string;
  from: string;
};

function getMailgunConfig(): MailgunConfig | null {
  const apiKey = process.env.MAILGUN_API_KEY?.trim();
  const domain = process.env.MAILGUN_DOMAIN?.trim();
  if (!apiKey || !domain) {
    return null;
  }

  return {
    apiKey,
    domain,
    from: process.env.MAILGUN_FROM?.trim() || `VortexGin <no-reply@${domain}>`,
  };
}

/**
 * Sends a transactional email through Mailgun HTTP API.
 * Returns true when accepted. Returns false when credentials missing
 * (link stays server-side in logs for local development).
 */
export async function sendMailgunEmail(to: string, subject: string, text: string): Promise<boolean> {
  const config = getMailgunConfig();
  if (!config) {
    console.warn("[mail] MAILGUN_API_KEY / MAILGUN_DOMAIN missing, skipping send.");
    return false;
  }

  const body = new URLSearchParams({
    from: config.from,
    to,
    subject,
    text,
  });

  const response = await fetch(`https://api.mailgun.net/v3/${config.domain}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`api:${config.apiKey}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  if (!response.ok) {
    console.error("[mail] Mailgun send failed:", response.status, await response.text());
    return false;
  }

  return true;
}

export async function sendPasswordResetEmail(to: string, resetLink: string): Promise<boolean> {

  const subject = "Reset your VortexGin password";
  const text = [
    "You requested a password reset for your VortexGin account.",
    "",
    `Reset link (expires in 60 minutes): ${resetLink}`,
    "",
    "If you did not request this, ignore this email.",
  ].join("\n");

  const sent = await sendMailgunEmail(to, subject, text);
  if (!sent) {
    console.warn(`[mail] Reset link for ${to}: ${resetLink}`);
  }

  return sent;
}

export type PosReceiptLine = {
  product_id: string;
  product_name: string;
  product_sku: string | null;
  variant_id: string | null;
  variant_name: string | null;
  qty: number;
  unit_price: number;
  discount_pct: number;
  line_total: number;
};

export type PosReceipt = {
  receipt_no: string;
  channel: "print" | "email";
  sent_at: string | null;
  status: string;
  paper_stock_note: boolean;
  session_id: string;
  cashier: string | null;
  warehouse_id: string;
  customer_id: string | null;
  payment_method: string;
  card_last_four: string | null;
  tendered: number | null;
  change: number | null;
  subtotal: number;
  discount_pct: number;
  tax_pct: number;
  tax_amount: number;
  grand_total: number;
  lines: PosReceiptLine[];
  created_at: string;
};

/**
 * Emails a POS receipt (text only V1). Returns true when accepted.
 * Missing credentials or send errors return false — the caller keeps the
 * sale completed with `receipt_sent_at=null` (email pending).
 */
export async function sendPosReceiptEmail(to: string, receipt: PosReceipt): Promise<boolean> {
  const subject = `Receipt ${receipt.receipt_no}`;
  const lines = receipt.lines.map(
    (line, index) =>
      `${index + 1}. ${line.product_name}${line.variant_name ? ` — ${line.variant_name}` : ""} x${line.qty} @ ${line.unit_price} = ${line.line_total}`,
  );
  const text = [
    `Receipt ${receipt.receipt_no}`,
    `Date: ${receipt.created_at}`,
    `Payment: ${receipt.payment_method}`,
    ...(receipt.card_last_four ? [`Card ending: ${receipt.card_last_four}`] : []),
    ...(typeof receipt.tendered === "number" ? [`Tendered: ${receipt.tendered}`, `Change: ${receipt.change ?? 0}`] : []),
    "",
    ...lines,
    "",
    `Subtotal: ${receipt.subtotal}`,
    `Discount: ${receipt.discount_pct}%`,
    `Tax (${receipt.tax_pct}%): ${receipt.tax_amount}`,
    `Total: ${receipt.grand_total}`,
    ...(receipt.paper_stock_note ? ["", "Note: paper sale — stock not deducted."] : []),
  ].join("\n");

  const sent = await sendMailgunEmail(to, subject, text);
  if (!sent) {
    console.warn(`[mail] POS receipt ${receipt.receipt_no} for ${to} not sent (pending).`);
  }

  return sent;
}
