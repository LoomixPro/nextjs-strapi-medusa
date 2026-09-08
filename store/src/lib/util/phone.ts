export function formatPhoneOrEmail(
  email?: string | null,
  phone?: string | null
): string {
  // If the email is an internal placeholder for phone authentication, don't show it.
  if (email && email.endsWith("@phone.local")) {
    return phone || email.replace("@phone.local", "")
  }

  if (email) {
    return email
  }
  if (phone) {
    return phone
  }
  return ""
}
