import { NextRequest, NextResponse } from "next/server"
import { loadMessagesForLocale } from "@lib/i18n/load-messages"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const locale = searchParams.get("locale") || "default"

  try {
    const messages = await loadMessagesForLocale(locale)
    return NextResponse.json({
      success: true,
      locale,
      messages,
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to load messages",
      },
      { status: 500 }
    )
  }
}
