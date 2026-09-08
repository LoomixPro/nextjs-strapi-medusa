import { Modules } from "@medusajs/framework/utils"

export default async function cleanup({ container }) {
  const authModule = container.resolve(Modules.AUTH)
  
  const identities = await authModule.listAuthIdentities({
    provider_identities: { provider: "emailpass" }
  }, { relations: ["provider_identities"] })
  
  for (const ident of identities) {
    if (ident.provider_identities.some(p => p.entity_id === "weqwefqe@atomicmail.io")) {
      await authModule.deleteAuthIdentities([ident.id])
      console.log("Deleted disconnected identity:", ident.id)
    }
  }
}
