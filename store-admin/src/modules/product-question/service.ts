import { MedusaService } from "@medusajs/framework/utils"
import Question from "./models/question"

class ProductQuestionModuleService extends MedusaService({
    Question,
}) { }

export default ProductQuestionModuleService
