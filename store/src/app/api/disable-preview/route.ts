// app/api/disable-preview/route.ts
// Disables Next.js Draft Mode — the user can click a "Exit Preview" button
// that calls this endpoint to go back to normal (published) view.
//
// Usage: Call GET /api/disable-preview from any "Exit Preview" UI element.

import { draftMode } from "next/headers"
import { redirect } from "next/navigation"
import { NextRequest } from "next/server"
import { safeRedirectUrl } from "@lib/util/safe-redirect"

export async function GET(request: NextRequest) {
  const draft = await draftMode()
  draft.disable()

  // Redirect back to the page the user was viewing
  const { searchParams } = request.nextUrl
  const redirectTo = safeRedirectUrl(searchParams.get("redirect"), "/")

  redirect(redirectTo)
}
