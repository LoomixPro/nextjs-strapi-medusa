import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const campaignId = req.params.id;
  const query = req.scope.resolve("query");

  try {
    const { data: [campaign] } = await query.graph({
      entity: "campaign",
      fields: [
        "id",
        "starts_at",
        "ends_at",
        "promotions.code",
        "promotions.rules.*",
        "promotions.rules.values.*",
        "promotions.application_method.target_rules.*",
        "promotions.application_method.target_rules.values.*",
        "promotions.application_method.buy_rules.*",
        "promotions.application_method.buy_rules.values.*"
      ],
      filters: {
        id: campaignId,
      },
    });

    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    const productIds = new Set<string>();
    const categoryIds = new Set<string>();
    const collectionIds = new Set<string>();
    const typeIds = new Set<string>();
    const tagIds = new Set<string>();
    const promoCodes = new Set<string>();

    const extractValues = (rule: any): string[] => {
      if (!rule) return [];
      const vals: string[] = [];
      const rawValues = Array.isArray(rule.values)
        ? rule.values
        : rule.values
        ? [rule.values]
        : Array.isArray(rule.value)
        ? rule.value
        : rule.value
        ? [rule.value]
        : [];

      for (const v of rawValues) {
        if (typeof v === "string" && v.trim().length > 0) {
          vals.push(v.trim());
        } else if (typeof v === "number") {
          vals.push(String(v));
        } else if (typeof v === "object" && v !== null) {
          if (typeof v.value === "string" && v.value.trim().length > 0) {
            vals.push(v.value.trim());
          }
          if (typeof v.id === "string" && v.id.trim().length > 0 && !v.id.startsWith("prval_")) {
            vals.push(v.id.trim());
          }
        }
      }
      return vals;
    };

    const processRule = (rule: any) => {
      if (!rule || !rule.attribute) return;
      const attr = String(rule.attribute).toLowerCase();
      const extracted = extractValues(rule);
      if (!extracted.length) return;

      if (attr.includes("collection")) {
        extracted.forEach((val) => collectionIds.add(val));
      } else if (attr.includes("category")) {
        extracted.forEach((val) => categoryIds.add(val));
      } else if (attr.includes("type")) {
        extracted.forEach((val) => typeIds.add(val));
      } else if (attr.includes("tag")) {
        extracted.forEach((val) => tagIds.add(val));
      } else {
        extracted.forEach((val) => productIds.add(val));
      }
    };

    const extractFromRules = (rules: any[]) => {
      if (!rules || !Array.isArray(rules)) return;
      for (const rule of rules) {
        processRule(rule);
      }
    };

    if (campaign.promotions) {
      for (const promo of campaign.promotions) {
        if (!promo) continue;

        if (promo.code) {
          promoCodes.add(promo.code);
        }

        extractFromRules(promo.rules);
        if (promo.application_method?.target_rules) {
          extractFromRules(promo.application_method.target_rules);
        }
        if (promo.application_method?.buy_rules) {
          extractFromRules(promo.application_method.buy_rules);
        }
      }
    }

    // Resolve products from collection rules
    if (collectionIds.size > 0) {
      try {
        const colArr = Array.from(collectionIds);
        const { data: colProducts } = await query.graph({
          entity: "product",
          fields: ["id"],
          filters: { collection_id: colArr } as any,
        });
        colProducts?.forEach((p: any) => productIds.add(p.id));

        if (!colProducts || colProducts.length === 0) {
          const { data: colProductsIn } = await query.graph({
            entity: "product",
            fields: ["id"],
            filters: { collection_id: { $in: colArr } } as any,
          });
          colProductsIn?.forEach((p: any) => productIds.add(p.id));
        }
      } catch (e) {
        console.error("Error querying products by collection_id:", e);
      }
    }

    // Resolve products from category rules
    if (categoryIds.size > 0) {
      try {
        const catArr = Array.from(categoryIds);
        const { data: catProducts } = await query.graph({
          entity: "product",
          fields: ["id"],
          filters: { categories: { id: catArr } } as any,
        });
        catProducts?.forEach((p: any) => productIds.add(p.id));

        if (!catProducts || catProducts.length === 0) {
          const { data: catProductsIn } = await query.graph({
            entity: "product",
            fields: ["id"],
            filters: { categories: { id: { $in: catArr } } } as any,
          });
          catProductsIn?.forEach((p: any) => productIds.add(p.id));
        }
      } catch (e) {
        console.error("Error querying products by category_id:", e);
      }
    }

    // Resolve products from type rules
    if (typeIds.size > 0) {
      try {
        const typeArr = Array.from(typeIds);
        const { data: typeProducts } = await query.graph({
          entity: "product",
          fields: ["id"],
          filters: { type_id: typeArr } as any,
        });
        typeProducts?.forEach((p: any) => productIds.add(p.id));
      } catch (e) {
        console.error("Error querying products by type_id:", e);
      }
    }

    // Resolve products from tag rules
    if (tagIds.size > 0) {
      try {
        const tagArr = Array.from(tagIds);
        const { data: tagProducts } = await query.graph({
          entity: "product",
          fields: ["id"],
          filters: { tags: { id: tagArr } } as any,
        });
        tagProducts?.forEach((p: any) => productIds.add(p.id));
      } catch (e) {
        console.error("Error querying products by tag_id:", e);
      }
    }

    return res.json({
      productIds: Array.from(productIds),
      categoryIds: Array.from(categoryIds),
      collectionIds: Array.from(collectionIds),
      typeIds: Array.from(typeIds),
      tagIds: Array.from(tagIds),
      promoCodes: Array.from(promoCodes),
    });
  } catch (error: any) {
    console.error("Error in campaign products API:", error);
    res.status(500).json({ message: error.message });
  }
};
