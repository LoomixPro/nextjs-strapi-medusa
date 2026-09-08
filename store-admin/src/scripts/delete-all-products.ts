import { ExecArgs } from "@medusajs/framework/types";
import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { deleteProductsWorkflow } from "@medusajs/medusa/core-flows";

export default async function deleteAllProducts({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const productModuleService = container.resolve(Modules.PRODUCT);
  
  const products = await productModuleService.listProducts({}, { take: 1000 });
  const productIds = products.map(p => p.id);
  
  if (productIds.length > 0) {
    logger.info(`Found ${productIds.length} products. Deleting...`);
    await deleteProductsWorkflow(container).run({
      input: { ids: productIds }
    });
    logger.info(`Successfully deleted ${productIds.length} products.`);
  } else {
    logger.info("No products found to delete.");
  }

  const { deleteProductCategoriesWorkflow } = await import("@medusajs/medusa/core-flows");
  const categories = await productModuleService.listProductCategories({}, { take: 1000 });
  const categoryIds = categories.map(c => c.id);
  
  if (categoryIds.length > 0) {
    logger.info(`Found ${categoryIds.length} categories. Deleting...`);
    await deleteProductCategoriesWorkflow(container).run({
      input: categoryIds
    });
    logger.info(`Successfully deleted ${categoryIds.length} categories.`);
  } else {
    logger.info("No categories found to delete.");
  }
}
