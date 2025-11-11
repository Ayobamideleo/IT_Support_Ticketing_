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
