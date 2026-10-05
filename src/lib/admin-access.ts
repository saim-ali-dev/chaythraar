export function parseAdminEmailAllowlist(value = process.env.CHAYTHRAAR_ADMIN_EMAILS) {
  return new Set(
    (value ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function isAdminEmailAllowed(
  email: string | null | undefined,
  allowedEmails = parseAdminEmailAllowlist(),
) {
  return Boolean(email && allowedEmails.has(email.trim().toLowerCase()));
}