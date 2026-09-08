import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json(
    { status: "ok", message: "Storefront is healthy" },
    { status: 200 }
  )
}
