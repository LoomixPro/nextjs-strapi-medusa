import { execFile } from "child_process"
import { promisify } from "util"
import path from "path"
import { isDeployAuthorized } from "../../../utils/deploy-auth"
import { resolveProjectRoot } from "../../../utils/project-root"
import { triggerStorefrontDeploy, getStorefrontDeployStatus } from "../../../utils/storefront-deploy"
import { clearHistory, getHistory } from "../../../utils/sync-history"

const execFileAsync = promisify(execFile)

export default {
  async trigger(ctx) {
    try {
      if (!(await isDeployAuthorized(ctx))) {
        return ctx.unauthorized("Unauthorized deploy request.")
      }

      const { component_path: componentPath, action = "add" } =
        (ctx.request.body as {
          component_path?: string
          action?: "add" | "remove"
        }) || {}

      if (process.env.NODE_ENV !== "production") {
        if (componentPath) {
          const projectRoot = resolveProjectRoot()
          const scriptPath = path.join(projectRoot, "scripts", "sync-loom-component.js")

          await execFileAsync(
            process.execPath,
            [scriptPath, action, componentPath],
            {
              cwd: projectRoot,
              env: process.env,
            }
          )
        }

        await clearHistory()

        return ctx.send({
          success: true,
          mode: "local-dev",
          message: componentPath
            ? "Component synced locally and style registries regenerated."
            : "Development mode: no remote deploy required. Restart dev server if needed.",
        })
      }

      const history = await getHistory()
      const batch = history.map(h => ({
        action: h.action,
        componentPath: h.componentPath,
      }))

      const deployResult = await triggerStorefrontDeploy({
        component_path: componentPath,
        action,
        source: "strapi-build-button",
        batch: batch.length > 0 ? batch : undefined,
      })

      await clearHistory()

      return ctx.send({
        success: true,
        ...deployResult,
      })
    } catch (err: any) {
      console.error("[Strapi Build Exception]:", err)
      return ctx.internalServerError(
        err.message || "Internal server error during storefront deploy trigger."
      )
    }
  },

  async status(ctx) {
    try {
      if (!(await isDeployAuthorized(ctx))) {
        return ctx.unauthorized("Unauthorized deploy status request.")
      }

      const statusResult = await getStorefrontDeployStatus()
      return ctx.send(statusResult)
    } catch (err: any) {
      console.error("[Strapi Build Status Exception]:", err)
      return ctx.internalServerError(
        err.message || "Internal server error during storefront status check."
      )
    }
  },
}
