/**
 * Escapes characters that are unsafe inside HTML content and attributes.
 * Prevents HTML injection / XSS in emails.
 */
export const escapeHtml = (str: string | number | null | undefined = ""): string =>
  String(str ?? "").replace(
    /[&<>"']/g,
    (m) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      }[m] || m)
  )
