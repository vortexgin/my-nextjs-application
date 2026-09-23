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
