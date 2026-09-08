import fs from "fs"
import path from "path"

/**
 * Resolve monorepo root (directory containing store/ and website-admin/).
 */
export function resolveProjectRoot(startDir: string = process.cwd()): string {
  if (process.env.PROJECT_ROOT) {
    return path.resolve(process.env.PROJECT_ROOT)
  }

  let current = path.resolve(startDir)

  for (let depth = 0; depth < 6; depth += 1) {
    const hasStore = fs.existsSync(path.join(current, "store"))
    const hasWebsiteAdmin = fs.existsSync(path.join(current, "website-admin"))

    if (hasStore && hasWebsiteAdmin) {
      return current
    }

    const parent = path.dirname(current)
    if (parent === current) break
    current = parent
  }

  return path.resolve(startDir)
}
