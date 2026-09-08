import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export async function POST(
    req: MedusaRequest,
    res: MedusaResponse
) {
    const { email } = req.body as { email: string }

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
