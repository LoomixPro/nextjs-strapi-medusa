import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve("query");

  try {
    const { data: campaigns } = await query.graph({
      entity: "campaign",
      fields: [
        "id",
        "name",
        "campaign_identifier",
        "starts_at",
        "ends_at",
        "promotions.code",
      ],
    });

    const now = new Date();
    // Filter active campaigns (starts_at <= now and (no ends_at or ends_at > now))
    const activeCampaigns = (campaigns || []).filter((c: any) => {
      if (c.ends_at && new Date(c.ends_at) < now) return false;
      if (c.starts_at && new Date(c.starts_at) > now) return false;
      return true;
    });

    return res.json({ campaigns: activeCampaigns });
  } catch (error: any) {
    console.error("Error fetching active campaigns:", error);
    return res.status(500).json({ message: error.message });
  }
};
