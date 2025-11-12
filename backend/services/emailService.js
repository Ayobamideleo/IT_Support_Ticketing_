// Simple email service abstraction.
// In production, replace console output with real provider integration (SendGrid/Postmark/SES/Mailgun).
// For now, it just logs and returns a promise for uniform interface.

export async function sendVerificationEmail(to, code, expires) {
  // Simulated send
  console.log(`[emailService] Would send verification code ${code} to ${to} (expires ${expires.toISOString()})`);
  return { success: true };
}

export async function sendGeneric(to, subject, body) {
  console.log(`[emailService] Would send email to ${to}: ${subject} -> ${body}`);
  return { success: true };
}

// Send a single message to multiple recipients by fanning out calls to sendGeneric
export async function sendBulkGeneric(recipients, subject, body) {
  if (!Array.isArray(recipients) || recipients.length === 0) {
    return { success: true, skipped: true, reason: 'no recipients' };
  }
  const unique = [...new Set(recipients.filter(Boolean))];
  await Promise.all(unique.map((to) => sendGeneric(to, subject, body)));
  return { success: true, count: unique.length };
}
