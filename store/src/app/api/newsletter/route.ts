import { NextResponse } from "next/server"
import { rateLimit } from "@lib/util/rate-limiter"

import { getClientIp } from "@lib/util/auth-security"

export async function POST(req: Request) {
  try {
    const ip = await getClientIp()

    const limitCheck = await rateLimit(`newsletter:${ip}`, {
      maxAttempts: 2,
      windowMs: 60 * 60 * 1000, // 1 hour window
    })

    if (!limitCheck.allowed) {
      return NextResponse.json(
        { error: "newsletter_rate_limit" },
        { status: 429 }
      )
    }

    const { email } = await req.json()

    if (!email) {
      return NextResponse.json(
        { error: "newsletter_email_required" },
        { status: 400 }
      )
    }

    const API_ID = process.env.SENDPULSE_API_ID
    const API_SECRET = process.env.SENDPULSE_API_SECRET
    const BOOK_ID = process.env.SENDPULSE_BOOK_ID

    if (!API_ID || !API_SECRET || !BOOK_ID) {
      console.error(
        "SendPulse credentials are not set in environment variables."
      )
      return NextResponse.json(
        { error: "newsletter_config_error" },
        { status: 500 }
      )
    }

    // 1. Get Access Token
    const tokenRes = await fetch(
      "https://api.sendpulse.com/oauth/access_token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          grant_type: "client_credentials",
          client_id: API_ID,
          client_secret: API_SECRET,
        }),
      }
    )

    if (!tokenRes.ok) {
      const errorData = await tokenRes.json()
      console.error("SendPulse token error:", errorData)
      return NextResponse.json(
        { error: "newsletter_service_error" },
        { status: 500 }
      )
    }

    const { access_token } = await tokenRes.json()

    // 2. Add email to the address book
    const addEmailRes = await fetch(
      `https://api.sendpulse.com/addressbooks/${BOOK_ID}/emails`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${access_token}`,
        },
        body: JSON.stringify({
          emails: [
            {
              email: email,
            },
          ],
        }),
      }
    )

    if (!addEmailRes.ok) {
      const errorData = await addEmailRes.json()
      console.error("SendPulse add email error:", errorData)
      return NextResponse.json(
        { error: "newsletter_registration_failed" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, message: "subscribe_success" })
  } catch (error) {
    console.error("Newsletter API error:", error)
    return NextResponse.json(
      { error: "newsletter_internal_error" },
      { status: 500 }
    )
  }
}
