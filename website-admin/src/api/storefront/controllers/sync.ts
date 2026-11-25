import { execFile } from "child_process"
import { promisify } from "util"
import path from "path"
import fs from "fs"
import crypto from "crypto"
import { isDeployAuthorized } from "../../../utils/deploy-auth"
import { resolveProjectRoot } from "../../../utils/project-root"
import { triggerStorefrontDeploy } from "../../../utils/storefront-deploy"
import { getHistory, addHistoryItem, removeHistoryItem } from "../../../utils/sync-history"

const execFileAsync = promisify(execFile)

export default {
  async sync(ctx) {
    try {
      if (!(await isDeployAuthorized(ctx))) {
        return ctx.unauthorized("Unauthorized sync request.")
      }

      const { componentName, style, action = "add", autoDeploy = true, syncAllStyles = false } =
        ctx.request.body as {
          componentName?: string
          style?: string
          action?: "add" | "remove"
          autoDeploy?: boolean
          syncAllStyles?: boolean
        }

      if (!componentName) {
        return ctx.badRequest("componentName parameter is required.")
      }

      let componentPath = componentName
      if (syncAllStyles) {
        componentPath = `${componentName}/styles`
      } else if (style) {
        componentPath = `${componentName}/${style.startsWith("styles/") ? style : `styles/${style}`}`
      }

      const normalizedAction = action === "remove" ? "remove" : "add"

      if (process.env.NODE_ENV !== "production") {
        const projectRoot = resolveProjectRoot()
        const scriptPath = path.join(projectRoot, "scripts", "sync-loom-component.js")
        
        const { stdout } = await execFileAsync(
          process.execPath,
          [scriptPath, normalizedAction, componentPath],
          {
            cwd: projectRoot,
            env: process.env,
          }
        )

        if (normalizedAction === "remove" && stdout.includes("was not present.")) {
          return ctx.send({
            success: true,
            mode: "local-dev",
            message: `Component '${componentPath}' was not present locally, so nothing was removed.`,
            componentPath,
            action: normalizedAction,
          })
        }

        // In development, changes apply immediately (hot-reload), so we skip adding them to the pending queue.
        return ctx.send({
          success: true,
          mode: "local-dev",
          message: `Component '${componentPath}' ${normalizedAction === "remove" ? "removed" : "synced"} locally.`,
          componentPath,
          action: normalizedAction,
        })
      }

      // Production mode: queue the component sync
      const history = await getHistory()
      const existingItem = history.find(i => i.componentPath === componentPath)
      
      if (existingItem) {
        if (existingItem.action !== normalizedAction) {
          await removeHistoryItem(existingItem.id)
          return ctx.send({
            success: true,
            mode: "production-queue",
            message: `Action cancelled out previous pending '${existingItem.action}'.`,
            componentPath,
            action: normalizedAction,
          })
        }
        return ctx.send({
          success: true,
          mode: "production-queue",
          message: `Component '${componentPath}' is already queued for '${normalizedAction}'.`,
          componentPath,
          action: normalizedAction,
        })
      }

      await addHistoryItem({
        action: normalizedAction,
        componentPath,
      })

      return ctx.send({
        success: true,
        mode: "production-queue",
        message: `Component '${componentPath}' added to pending queue for ${normalizedAction === "remove" ? "removal" : "sync"}.`,
        componentPath,
        action: normalizedAction,
      })
    } catch (err: any) {
      console.error("[Strapi Sync Exception]:", err)
      return ctx.internalServerError(
        err.message || "Internal server error during component sync."
      )
    }
  },

  async syncTranslations(ctx) {
    try {
      if (!(await isDeployAuthorized(ctx))) {
        return ctx.unauthorized("Unauthorized sync request.")
      }

      const projectRoot = resolveProjectRoot()
      const scriptPath = path.join(projectRoot, "scripts", "sync-translations.js")

      const { stdout, stderr } = await execFileAsync(
        process.execPath,
        [scriptPath],
        {
          cwd: projectRoot,
          env: {
            ...process.env,
            STRAPI_URL: process.env.STRAPI_URL || "http://localhost:1337",
          },
        }
      )

      return ctx.send({
        success: true,
        message: "Translations successfully synchronized and registry generated.",
        output: stdout,
      })
    } catch (err: any) {
      console.error("[Strapi Sync Translations Exception]:", err)
      return ctx.internalServerError(
        err.message || "Internal server error during translation sync."
      )
    }
  },

  async syncSettings(ctx) {
    try {
      if (!(await isDeployAuthorized(ctx))) {
        return ctx.unauthorized("Unauthorized sync request.")
      }

      // ── 1. Fetch settings from Strapi DB ───────────────────────────────
      let data: any = null
      try {
        data = await strapi.documents('api::storefront-setting.storefront-setting').findFirst({
          populate: {
            modules: { populate: '*' },
            translations: { populate: '*' }
          }
        })
      } catch (docErr) {
        if ((strapi as any).entityService) {
          data = await (strapi as any).entityService.findMany('api::storefront-setting.storefront-setting', {
            populate: {
              modules: { populate: '*' },
              translations: { populate: '*' }
            }
          })
        }
      }

      if (!data) {
        return ctx.notFound("Storefront settings document not found in database.")
      }

      const modulesObj: any = {}
      if (Array.isArray(data.modules)) {
        for (const mod of data.modules) {
          switch (mod.__component) {
            case "settings.product-card-selection":   modulesObj.productCard = mod; break
            case "settings.header-settings":           modulesObj.header = mod; break
            case "settings.product-page-settings":    modulesObj.productPage = mod; break
            case "settings.checkout-page-settings":   modulesObj.checkoutPage = mod; break
            case "settings.store-page-settings":      modulesObj.storePage = mod; break
            case "settings.order-page-settings":      modulesObj.orderPage = mod; break
            case "settings.cart-page-settings":       modulesObj.cartPage = mod; break
            case "settings.login-page-settings":      modulesObj.loginPage = mod; break
            case "settings.footer-settings":          modulesObj.footer = mod; break
            case "settings.profile-page-settings":    modulesObj.profilePage = mod; break
            case "settings.bottom-nav-bar-settings":  modulesObj.bottomNavBar = mod; break
            case "settings.background-settings":      modulesObj.background = mod; break
            case "settings.button-settings":          modulesObj.button = mod; break
            case "settings.theme-settings":           modulesObj.theme = mod; break
          }
        }
      }

      const settingsPreset = {
        productCard: {
          storeCardType: modulesObj.productCard?.storeCardType || "card-1",
          collectionCardType: modulesObj.productCard?.collectionCardType || "card-1",
          categoryCardType: modulesObj.productCard?.categoryCardType || "card-1",
        },
        header: modulesObj.header
          ? {
              headerStyle: modulesObj.header.headerStyle || "style-1",
              logoLight: modulesObj.header.logoLight,
              logoDark: modulesObj.header.logoDark,
            }
          : { headerStyle: "style-1" },
        productPage:  { template: modulesObj.productPage?.template || "style-1" },
        checkoutPage: { template: modulesObj.checkoutPage?.template || "style-1" },
        storePage: {
          template: modulesObj.storePage?.template || "style-1",
          title: modulesObj.storePage?.title || "All Products",
          description: modulesObj.storePage?.description || "Explore our complete collection of premium fashion essentials.",
        },
        orderPage:   { template: modulesObj.orderPage?.template || "style-1" },
        cartPage:    { template: modulesObj.cartPage?.template || "style-1", topBannerText: modulesObj.cartPage?.topBannerText },
        loginPage:   { template: modulesObj.loginPage?.template || "style-1", loginMethods: modulesObj.loginPage?.loginMethods || "email" },
        profilePage: { template: modulesObj.profilePage?.template || "style-1" },
        bottomNavBar: { style: modulesObj.bottomNavBar?.style || "style-3" },
        footer: modulesObj.footer
          ? {
              footerStyle: modulesObj.footer.footerStyle || "style-1",
              logoLight: modulesObj.footer.logoLight,
              logoDark: modulesObj.footer.logoDark,
              translations: modulesObj.footer.translations || [],
              socialLinks: modulesObj.footer.socialLinks || [],
            }
          : { footerStyle: "style-1" },
        background: modulesObj.background
          ? { style: modulesObj.background.style || "none", opacityLight: modulesObj.background.opacityLight ?? 40, opacityDark: modulesObj.background.opacityDark ?? 30 }
          : { style: "none", opacityLight: 40, opacityDark: 30 },
        button: { style: modulesObj.button?.style || "style-1" },
        theme: modulesObj.theme
          ? { lightPalette: modulesObj.theme.lightPalette || "default", darkPalette: modulesObj.theme.darkPalette || "default" }
          : { lightPalette: "default", darkPalette: "default" },
        isRtl: data.isRtl ?? false,
        convertToToman: data.convertToToman ?? false,
        returnDeadlineDays: data.returnDeadlineDays ?? 7,
        allowIndexing: data.allowIndexing ?? true,
        timeZone: data.timeZone || "UTC",
        translations: data.translations || [],
      }

      const jsonContent = JSON.stringify(settingsPreset, null, 2) + "\n"

      // ── 2. Try writing to local filesystem (dev mode) ──────────────────
      if (process.env.NODE_ENV !== "production") {
        const projectRoot = resolveProjectRoot()
        const configDir = path.join(projectRoot, "store", "src", "lib", "config")
        const targetJsonPath = path.join(configDir, "storefront-settings.json")
        if (!fs.existsSync(configDir)) fs.mkdirSync(configDir, { recursive: true })
        fs.writeFileSync(targetJsonPath, jsonContent, "utf8")
        return ctx.send({
          success: true,
          message: "Storefront settings preset saved locally (dev mode). Commit & push to apply to production build.",
          path: targetJsonPath,
          mode: "local-dev",
        })
      }

      // ── 3. Production: commit file directly to GitHub via API ──────────
      const token = process.env.GITHUB_DEPLOY_TOKEN?.trim()
      const repo = process.env.GITHUB_DEPLOY_REPO?.trim()

      if (!token || !repo) {
        return ctx.badRequest(
          "GITHUB_DEPLOY_TOKEN and GITHUB_DEPLOY_REPO must be configured to sync settings in production."
        )
      }

      const filePath = "store/src/lib/config/storefront-settings.json"
      const apiUrl = `https://api.github.com/repos/${repo}/contents/${filePath}`
      const headers = {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
      }

      // Get current file SHA (required for updates)
      let currentSha: string | undefined
      try {
        const getRes = await fetch(apiUrl, { headers })
        if (getRes.ok) {
          const fileData = await getRes.json() as { sha?: string }
          currentSha = fileData.sha
        }
      } catch (_) {
        // File may not exist yet — that's fine
      }

      const contentBase64 = Buffer.from(jsonContent, "utf8").toString("base64")
      const putBody: any = {
        message: "chore(settings): sync storefront settings preset from Strapi",
        content: contentBase64,
        committer: { name: "Strapi CMS Bot", email: "bot@yourdomain.com" },
      }
      if (currentSha) putBody.sha = currentSha

      const putRes = await fetch(apiUrl, {
        method: "PUT",
        headers,
        body: JSON.stringify(putBody),
      })

      if (!putRes.ok) {
        const errText = await putRes.text()
        throw new Error(`GitHub API error (${putRes.status}): ${errText}`)
      }

      return ctx.send({
        success: true,
        message: "Storefront settings committed to GitHub. A new build will be triggered automatically.",
        mode: "github-commit",
        repo,
        filePath,
      })
    } catch (err: any) {
      console.error("[Strapi Sync Settings Exception]:", err)
      return ctx.internalServerError(
        err.message || "Internal server error during storefront settings sync."
      )
    }
  },

  async getHistory(ctx) {
    try {
      if (!(await isDeployAuthorized(ctx))) {
        return ctx.unauthorized("Unauthorized request.")
      }
      return ctx.send({ success: true, history: await getHistory() })
    } catch (err: any) {
      console.error("[Strapi History Exception]:", err)
      return ctx.internalServerError(err.message || "Error fetching history")
    }
  },

  async undoHistory(ctx) {
    try {
      if (!(await isDeployAuthorized(ctx))) {
        return ctx.unauthorized("Unauthorized request.")
      }

      const { id } = ctx.request.body as { id?: string }
      if (!id) return ctx.badRequest("id is required")

      const history = await getHistory()
      const item = history.find(i => i.id === id)
      
      if (!item) {
        return ctx.notFound("History item not found")
      }

      const reverseAction = item.action === "add" ? "remove" : "add"

      if (process.env.NODE_ENV !== "production") {
        return ctx.badRequest("Undo is not supported in local development mode, as changes are applied immediately.")
      } else {
        await removeHistoryItem(id)
        return ctx.send({
          success: true,
          message: `Removed '${item.action} ${item.componentPath}' from pending queue.`,
        })
      }
    } catch (err: any) {
      console.error("[Strapi Undo Exception]:", err)
      return ctx.internalServerError(err.message || "Error undoing action")
    }
  },

  async getComponentStyles(ctx) {
    try {
      if (!(await isDeployAuthorized(ctx))) {
        return ctx.unauthorized("Unauthorized request.")
      }

      const componentPath = ((ctx.query.componentPath as string) || "").trim()
      const forceRefresh = ctx.query.refresh === "true" || ctx.query.refresh === "1"

      if (!componentPath) {
        return ctx.badRequest("componentPath query parameter is required.")
      }

      // 1. Fetch installed styles (via Docker internal network or local disk)
      const { installed: installedStyles, source: storefrontSource } =
        await fetchInstalledStyles(componentPath)

      // 2. Fetch registry styles (from GitHub Git Trees with caching)
      const treeResult = await fetchRegistryTree({ forceRefresh })
      const registryStyles = treeResult.data.styles[componentPath] || []

      // 3. Calculate available styles to download
      const availableToDownload = registryStyles.filter((s) => !installedStyles.includes(s))

      // 4. Map preview URLs dynamically
      const stylePreviews: Record<string, string> = {}
      for (const s of registryStyles) {
        const treePreview = treeResult.data.previews[componentPath]?.[s]
        // Provide proxy route URL or GitHub raw URL
        stylePreviews[s] =
          treePreview ||
          `/api/storefront/style-preview?component=${encodeURIComponent(componentPath)}&style=${encodeURIComponent(s)}`
      }

      return ctx.send({
        success: true,
        componentPath,
        installedStyles,
        registryStyles,
        availableToDownload,
        stylePreviews,
        source: treeResult.source,
        cached: treeResult.cached,
        error: treeResult.error,
        storefrontSource,
      })
    } catch (err: any) {
      console.error("[Strapi Component Styles Exception]:", err)
      return ctx.internalServerError(
        err.message || "Internal server error fetching component styles."
      )
    }
  },

  async getStylePreview(ctx) {
    try {
      const componentPath = ((ctx.query.component as string) || "").trim()
      const styleName = ((ctx.query.style as string) || "").trim()

      if (!componentPath || !styleName) {
        return ctx.badRequest("component and style query parameters are required.")
      }

      if (
        !/^[a-zA-Z0-9_/-]+$/.test(componentPath) ||
        !/^[a-zA-Z0-9_-]+$/.test(styleName) ||
        componentPath.includes("..") ||
        styleName.includes("..")
      ) {
        return ctx.badRequest("Invalid component or style parameter.")
      }

      // 1. Check local filesystem first (local dev / mounted registry)
      const projectRoot = resolveProjectRoot()
      let localRegistryModules = path.join(
        projectRoot,
        "Loomix-registry",
        "src",
        "modules"
      )
      if (!fs.existsSync(localRegistryModules)) {
        const fallback = path.join(
          projectRoot,
          "loom-blocks-registry",
          "src",
          "modules"
        )
        if (fs.existsSync(fallback)) localRegistryModules = fallback
      }
      const normalizedRegistryBase = path.resolve(localRegistryModules)
      const localStyleDir = path.resolve(
        normalizedRegistryBase,
        componentPath,
        "styles",
        styleName
      )

      if (!localStyleDir.startsWith(normalizedRegistryBase + path.sep)) {
        return ctx.badRequest("Invalid component or style path.")
      }

      if (fs.existsSync(localStyleDir)) {
        const files = fs.readdirSync(localStyleDir)
        const imgFile = files.find((f) => /\.(png|jpe?g|webp|gif|svg)$/i.test(f))
        if (imgFile) {
          const imgPath = path.resolve(localStyleDir, imgFile)
          if (!imgPath.startsWith(localStyleDir + path.sep)) {
            return ctx.badRequest("Invalid preview file path.")
          }
          const ext = path.extname(imgFile).toLowerCase().slice(1)
          const mimeTypes: Record<string, string> = {
            png: "image/png",
            jpg: "image/jpeg",
            jpeg: "image/jpeg",
            webp: "image/webp",
            svg: "image/svg+xml",
            gif: "image/gif",
          }
          ctx.type = mimeTypes[ext] || "image/png"
          ctx.body = fs.createReadStream(imgPath)
          return
        }
      }

      // 2. Redirect to validated raw GitHub preview URL (prevent open redirects)
      const defaultRegistryUrl =
        "https://raw.githubusercontent.com/Loomix-pro/Loomix-registry/main/src/modules"
      const rawRegistryUrl = (process.env.REGISTRY_URL || defaultRegistryUrl)
        .trim()
        .replace(/\/$/, "")

      let parsedRegistry: URL
      try {
        parsedRegistry = new URL(rawRegistryUrl)
        if (parsedRegistry.protocol !== "https:") {
          parsedRegistry = new URL(defaultRegistryUrl)
        }
      } catch {
        parsedRegistry = new URL(defaultRegistryUrl)
      }

      const targetUrl = `${parsedRegistry.href}/${componentPath}/styles/${styleName}/preview.webp`
      return ctx.redirect(targetUrl)
    } catch (err: any) {
      console.error("[Strapi Style Preview Exception]:", err)
      return ctx.internalServerError("Error retrieving preview image.")
    }
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// Registry Git Trees Cache & Helper Functions
// ─────────────────────────────────────────────────────────────────────────────

interface RegistryTreeData {
  styles: Record<string, string[]>
  previews: Record<string, Record<string, string>>
}

interface RegistryTreeCache {
  data: RegistryTreeData | null
  timestamp: number
}

let registryTreeCache: RegistryTreeCache = {
  data: null,
  timestamp: 0,
}

async function fetchRegistryTree(options: { forceRefresh?: boolean } = {}): Promise<{
  data: RegistryTreeData
  cached: boolean
  source: string
  error?: string
}> {
  const CACHE_TTL = 15 * 60 * 1000 // 15 minutes
  const now = Date.now()

  if (
    !options.forceRefresh &&
    registryTreeCache.data &&
    now - registryTreeCache.timestamp < CACHE_TTL
  ) {
    return {
      data: registryTreeCache.data,
      cached: true,
      source: "memory-cache",
    }
  }

  const token = (process.env.GITHUB_PAT || process.env.GITHUB_DEPLOY_TOKEN || "").trim()
  const registryUrl = (
    process.env.REGISTRY_URL ||
        "https://raw.githubusercontent.com/Loomix-pro/Loomix-registry/main/src/modules"
  ).trim()

  let owner = "Loomix-pro"
  let repo = "Loomix-registry"
  let branch = "main"

  if (registryUrl.includes("raw.githubusercontent.com")) {
    const parts = registryUrl
      .replace("https://raw.githubusercontent.com/", "")
      .split("/")
    if (parts[0]) owner = parts[0]
    if (parts[1]) repo = parts[1]
    if (parts[2]) branch = parts[2]
  }

  const headers: Record<string, string> = {
    "User-Agent": "Loomix-Sync",
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  }
  if (token) {
    headers.Authorization =
      token.startsWith("ghp_") || token.startsWith("github_pat_")
        ? `token ${token}`
        : `Bearer ${token}`
  }

  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 6000)

    const response = await fetch(apiUrl, {
      headers,
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`GitHub API error: HTTP ${response.status} ${response.statusText}`)
    }

    const json = (await response.json()) as {
      tree?: Array<{ path: string; type: string }>
    }
    if (!Array.isArray(json.tree)) {
      throw new Error("Invalid response format from GitHub Git Trees API.")
    }

    const mapping: Record<string, Set<string>> = {}
    const previews: Record<string, Record<string, string>> = {}

    for (const item of json.tree) {
      if (!item.path.startsWith("src/modules/")) continue
      const relPath = item.path.slice("src/modules/".length)

      const stylesIdx = relPath.indexOf("/styles/")
      if (stylesIdx === -1) continue

      const componentPath = relPath.slice(0, stylesIdx)
      const afterStyles = relPath.slice(stylesIdx + "/styles/".length)

      const match = afterStyles.match(/^(style-[a-zA-Z0-9_-]+)/)
      if (match) {
        const styleName = match[1].replace(/\.tsx?$/, "")
        if (!mapping[componentPath]) mapping[componentPath] = new Set()
        mapping[componentPath].add(styleName)
      } else if (componentPath.includes("background")) {
        const bgMatch = afterStyles.match(/^([a-zA-Z0-9_-]+)\.tsx?$/)
        if (bgMatch) {
          const bgStyle = bgMatch[1].replace(/Background$/, "").toLowerCase()
          if (!mapping[componentPath]) mapping[componentPath] = new Set()
          mapping[componentPath].add(bgStyle)
        }
      }

      // Check for preview image inside a style folder: e.g. "style-1/preview.png"
      const imgMatch = afterStyles.match(
        /^([a-zA-Z0-9_-]+)\/(?:preview|[a-zA-Z0-9_-]+)\.(png|jpe?g|webp|gif|svg)$/i
      )
      if (imgMatch) {
        const styleName = imgMatch[1]
        if (!previews[componentPath]) previews[componentPath] = {}
        previews[componentPath][styleName] = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${item.path}`
      }
    }

    const stylesResult: Record<string, string[]> = {}
    for (const [comp, set] of Object.entries(mapping)) {
      stylesResult[comp] = Array.from(set).sort()
    }

    const result: RegistryTreeData = {
      styles: stylesResult,
      previews,
    }

    registryTreeCache = {
      data: result,
      timestamp: now,
    }

    return {
      data: result,
      cached: false,
      source: "github-tree",
    }
  } catch (err: any) {
    console.warn("[Loomix Registry Tree Warning]:", err.message || err)

    if (registryTreeCache.data) {
      return {
        data: registryTreeCache.data,
        cached: true,
        source: "stale-cache-fallback",
        error: err.message,
      }
    }

    try {
      const projectRoot = resolveProjectRoot()
      let localRegistryBase = path.join(
        projectRoot,
        "Loomix-registry",
        "src",
        "modules"
      )
      if (!fs.existsSync(localRegistryBase)) {
        const fallback = path.join(
          projectRoot,
          "loom-blocks-registry",
          "src",
          "modules"
        )
        if (fs.existsSync(fallback)) localRegistryBase = fallback
      }
      if (fs.existsSync(localRegistryBase)) {
        const localMapping: Record<string, string[]> = {}
        const localPreviews: Record<string, Record<string, string>> = {}

        function scanLocal(dir: string, base: string) {
          const entries = fs.readdirSync(dir, { withFileTypes: true })
          for (const ent of entries) {
            const full = path.join(dir, ent.name)
            if (ent.isDirectory()) {
              if (ent.name === "styles") {
                const comp = path.relative(base, dir).replace(/\\/g, "/")
                const sEntries = fs.readdirSync(full, { withFileTypes: true })
                const styles: string[] = []
                for (const sEnt of sEntries) {
                  const sName = sEnt.name.replace(/\.tsx?$/, "")
                  if (sName.startsWith("style-") || comp.includes("background")) {
                    styles.push(sName)
                    if (sEnt.isDirectory()) {
                      const sDir = path.join(full, sEnt.name)
                      const files = fs.readdirSync(sDir)
                      const imgFile = files.find((f) =>
                        /\.(png|jpe?g|webp|gif|svg)$/i.test(f)
                      )
                      if (imgFile) {
                        if (!localPreviews[comp]) localPreviews[comp] = {}
                        localPreviews[comp][sName] = `/api/storefront/style-preview?component=${encodeURIComponent(
                          comp
                        )}&style=${encodeURIComponent(sName)}`
                      }
                    }
                  }
                }
                localMapping[comp] = Array.from(new Set(styles)).sort()
              } else {
                scanLocal(full, base)
              }
            }
          }
        }
        scanLocal(localRegistryBase, localRegistryBase)
        const localResult: RegistryTreeData = {
          styles: localMapping,
          previews: localPreviews,
        }
        registryTreeCache = { data: localResult, timestamp: now }
        return {
          data: localResult,
          cached: false,
          source: "local-registry-fallback",
          error: `GitHub unreachable (${err.message}). Loaded from local registry.`,
        }
      }
    } catch (_) {}

    return {
      data: { styles: {}, previews: {} },
      cached: false,
      source: "empty-error",
      error: err.message || "Failed to fetch registry from GitHub.",
    }
  }
}

async function fetchInstalledStyles(componentPath: string): Promise<{
  installed: string[]
  source: "docker-internal" | "local-disk" | "unknown"
}> {
  const projectRoot = resolveProjectRoot()
  const storefrontUrl = (
    process.env.STOREFRONT_INTERNAL_URL ||
    process.env.STOREFRONT_URL ||
    (process.env.NODE_ENV === "production"
      ? "http://storefront:8000"
      : "http://localhost:8000")
  ).replace(/\/$/, "")

  const internalSecret = process.env.INTERNAL_API_SECRET || ""

  // 1. Try Docker internal HTTP request to Storefront container
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 2500)

    const headers: Record<string, string> = {
      Accept: "application/json",
    }
    if (internalSecret) {
      headers["x-internal-secret"] = internalSecret
    }

    const res = await fetch(
      `${storefrontUrl}/api/internal/styles?component=${encodeURIComponent(componentPath)}`,
      {
        headers,
        signal: controller.signal,
      }
    )
    clearTimeout(timeoutId)

    if (res.ok) {
      const json = (await res.json()) as { installed?: string[] }
      if (Array.isArray(json.installed)) {
        return {
          installed: json.installed.sort(),
          source: "docker-internal",
        }
      }
    }
  } catch (_) {
    // Falls through to local disk
  }

  // 2. Fallback: Local filesystem check (works in local development and shared volume)
  try {
    const manifestPath = path.join(
      projectRoot,
      "store",
      "src",
      "lib",
      "config",
      "installed-styles.json"
    )
    if (fs.existsSync(manifestPath)) {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"))
      if (Array.isArray(manifest[componentPath])) {
        return {
          installed: manifest[componentPath].sort(),
          source: "local-disk",
        }
      }
    }

    const stylesDir = path.join(
      projectRoot,
      "store",
      "src",
      "modules",
      componentPath,
      "styles"
    )
    if (fs.existsSync(stylesDir) && fs.statSync(stylesDir).isDirectory()) {
      const items = fs
        .readdirSync(stylesDir)
        .filter((f) => f.startsWith("style-"))
        .map((f) => f.replace(/\.tsx?$/, ""))
      return {
        installed: Array.from(new Set(items)).sort(),
        source: "local-disk",
      }
    }
  } catch (_) {}

  return {
    installed: [],
    source: "unknown",
  }
}

