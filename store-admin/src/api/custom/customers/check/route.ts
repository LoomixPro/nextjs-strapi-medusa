import crypto from "node:crypto"
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

function safeCompareSecret(provided?: string | null, expected?: string | null): boolean {
    if (!provided || !expected) {
        return false
    }

    const actual = new Uint8Array(
        crypto.createHash("sha256").update(provided).digest()
    )
    const expectedHash = new Uint8Array(
        crypto.createHash("sha256").update(expected).digest()
    )

    if (actual.length !== expectedHash.length) {
        return false
    }

    return crypto.timingSafeEqual(actual, expectedHash)
}

export async function POST(
    req: MedusaRequest,
    res: MedusaResponse
) {
    const isDev = process.env.NODE_ENV !== "production"
    const expectedSecret = process.env.INTERNAL_API_SECRET
    const providedSecret =
        (req.headers["x-internal-secret"] as string) ||
        (req.headers.authorization?.startsWith("Bearer ")
            ? req.headers.authorization.slice(7)
            : undefined)

    if (!isDev && (!expectedSecret || !safeCompareSecret(providedSecret, expectedSecret))) {
        return res.status(401).json({ error: "Unauthorized" })
    }

    if (isDev && expectedSecret && !safeCompareSecret(providedSecret, expectedSecret)) {
        return res.status(401).json({ error: "Unauthorized" })
    }

    const rawEmail = (req.body as { email?: string })?.email
    const email = typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : ""

    if (!email) {
        return res.status(400).json({ error: "Email is required" })
    }

    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

    const { data: customers } = await query.graph({
        entity: "customer",
        fields: ["id"],
        filters: { email },
    })

    if (!customers || customers.length === 0) {
        return res.status(200).json({ exists: false })
    }

    return res.status(200).json({ exists: true })
}
