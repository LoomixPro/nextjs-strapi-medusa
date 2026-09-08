const fs = require("fs")
const path = require("path")
const { resolveProjectRoot } = require("./resolve-project-root")

function isSafeSubPath(baseDir, relativePath) {
  const normalizedBase = path.resolve(baseDir)
  const resolved = path.resolve(normalizedBase, relativePath)
  return (
    resolved.startsWith(normalizedBase + path.sep) || resolved === normalizedBase
  )
}

function assertSafeComponentPath(componentPath) {
  if (
    !componentPath ||
    componentPath.includes("..") ||
    componentPath.includes("\\") ||
    !/^[a-zA-Z0-9_\-/]+$/.test(componentPath)
  ) {
    throw new Error("Invalid or unsafe component path.")
  }
}

async function syncRemoteDirectory(apiUrl, targetDir, branch, headers) {
  const response = await fetch(`${apiUrl}?ref=${branch}`, { headers })
  if (!response.ok) {
    throw new Error(`GitHub API error fetching directory: ${response.status}`)
  }

  const data = await response.json()
  if (!Array.isArray(data)) {
    throw new Error("Expected a directory but got a file from GitHub API")
  }

  fs.mkdirSync(targetDir, { recursive: true })

  for (const item of data) {
    if (
      !item.name ||
      item.name.includes("..") ||
      item.name.includes("/") ||
      item.name.includes("\\")
    ) {
      continue
    }

    const itemTargetPath = path.join(targetDir, item.name)
    if (item.type === "file") {
      const fileRes = await fetch(item.download_url, { headers })
      if (!fileRes.ok) {
        throw new Error(`Failed to download ${item.path}: ${fileRes.status}`)
      }
      fs.writeFileSync(itemTargetPath, await fileRes.text(), "utf-8")
    } else if (item.type === "dir") {
      await syncRemoteDirectory(item.url, itemTargetPath, branch, headers)
    }
  }
}

function syncLocalDirectory(srcDir, targetDir) {
  fs.mkdirSync(targetDir, { recursive: true })
  const items = fs.readdirSync(srcDir, { withFileTypes: true })

  for (const item of items) {
    if (
      item.name.includes("..") ||
      item.name.includes("/") ||
      item.name.includes("\\")
    ) {
      continue
    }

    const srcPath = path.join(srcDir, item.name)
    const destPath = path.join(targetDir, item.name)

    if (item.isDirectory()) {
      syncLocalDirectory(srcPath, destPath)
    } else {
      fs.copyFileSync(srcPath, destPath)
    }
  }
}

function parseGithubRegistry(registryBase) {
  if (!registryBase.includes("raw.githubusercontent.com")) {
    throw new Error("Only raw.githubusercontent.com REGISTRY_URL values are supported.")
  }

  const parts = registryBase
    .replace("https://raw.githubusercontent.com/", "")
    .split("/")

  const owner = parts[0]
  const repo = parts[1]
  const branch = parts[2]
  const basePath = parts.slice(3).join("/")

  return {
    branch,
    githubApiUrl: `https://api.github.com/repos/${owner}/${repo}/contents/${basePath}`,
    rawBaseUrl: registryBase.replace(/\/$/, ""),
  }
}

function removeComponent(targetBasePath, componentPath) {
  assertSafeComponentPath(componentPath)

  if (!isSafeSubPath(targetBasePath, componentPath)) {
    throw new Error("Target path escapes base directory.")
  }

  const targetFile = path.resolve(targetBasePath, `${componentPath}.tsx`)
  const targetDir = path.resolve(targetBasePath, componentPath)
  let deleted = false

  if (fs.existsSync(targetFile) && isSafeSubPath(targetBasePath, `${componentPath}.tsx`)) {
    fs.unlinkSync(targetFile)
    deleted = true
  }

  if (fs.existsSync(targetDir) && isSafeSubPath(targetBasePath, componentPath)) {
    fs.rmSync(targetDir, { recursive: true, force: true })
    deleted = true
  }

  return deleted
}

function loadEnvFallback(projectRoot) {
  const envFiles = [
    path.join(projectRoot, "website-admin", ".env"),
    path.join(projectRoot, "store", ".env"),
    path.join(projectRoot, ".env"),
  ]

  for (const envFile of envFiles) {
    if (!fs.existsSync(envFile)) continue
    try {
      const content = fs.readFileSync(envFile, "utf-8")
      for (const line of content.split(/\r?\n/)) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith("#")) continue
        const match = trimmed.match(/^([A-Za-z0-9_]+)=(.*)$/)
        if (match) {
          const key = match[1]
          let val = match[2].trim()
          if (
            (val.startsWith('"') && val.endsWith('"')) ||
            (val.startsWith("'") && val.endsWith("'"))
          ) {
            val = val.slice(1, -1)
          }
          if (!process.env[key] && val) {
            process.env[key] = val
          }
        }
      }
    } catch {}
  }
}

async function addComponent({
  componentPath,
  registryBase,
  githubPat,
  registryToken,
  targetBasePath,
  projectRoot,
}) {
  assertSafeComponentPath(componentPath)

  if (!isSafeSubPath(targetBasePath, componentPath)) {
    throw new Error("Target path escapes base directory.")
  }

  const isRemoteRegistry = registryBase.startsWith("http")

  if (isRemoteRegistry) {
    const token = registryToken || githubPat || ""
    const headers = { 
      "User-Agent": "Loomix-Sync",
      ...(token ? { Authorization: token.startsWith("ghp_") || token.startsWith("github_pat_") ? `token ${token}` : `Bearer ${token}` } : {})
    }

    try {
      if (registryBase.includes("/api/registry") || !registryBase.includes("raw.githubusercontent.com")) {
        const cleanBase = registryBase.replace(/\/$/, "")
        const apiUrl = cleanBase.endsWith("/components")
          ? `${cleanBase}/${componentPath}`
          : `${cleanBase}/components/${componentPath}`

        const response = await fetch(apiUrl, { headers })

        if (response.ok) {
          const data = await response.json()

          if (data.type === "directory" && Array.isArray(data.files)) {
            const targetDir = path.resolve(targetBasePath, componentPath)
            fs.mkdirSync(targetDir, { recursive: true })

            for (const file of data.files) {
              const filePath = path.resolve(targetDir, file.relativePath || file.name)
              fs.mkdirSync(path.dirname(filePath), { recursive: true })
              fs.writeFileSync(filePath, file.content, "utf-8")
            }

            return { mode: "directory", target: targetDir }
          }

          if (data.type === "file" && data.content) {
            const targetFilePath = path.resolve(targetBasePath, `${componentPath}.tsx`)
            fs.mkdirSync(path.dirname(targetFilePath), { recursive: true })
            fs.writeFileSync(targetFilePath, data.content, "utf-8")
            return { mode: "file", target: targetFilePath }
          }
        }

        if (response.status === 401 || response.status === 403) {
          const errData = await response.json().catch(() => ({}))
          throw new Error(
            `Registry Authentication Failed (${response.status}): ${errData.message || "Invalid or missing token"}`
          )
        }
      } else {
        const ghHeaders = { "User-Agent": "Loomix-Sync" }
        if (githubPat) {
          ghHeaders.Authorization = `token ${githubPat}`
        }

        const { branch, githubApiUrl, rawBaseUrl } = parseGithubRegistry(registryBase)
        const dirApiUrl = `${githubApiUrl}/${componentPath}`
        const dirResponse = await fetch(`${dirApiUrl}?ref=${branch}`, { headers: ghHeaders })

        if (dirResponse.ok) {
          const data = await dirResponse.json()
          if (Array.isArray(data)) {
            const targetDir = path.resolve(targetBasePath, componentPath)
            await syncRemoteDirectory(dirApiUrl, targetDir, branch, ghHeaders)
            return { mode: "directory", target: targetDir }
          }
        } else if (dirResponse.status === 401 || dirResponse.status === 403) {
          throw new Error(`GitHub authentication failed (HTTP ${dirResponse.status}). Check GITHUB_PAT token in .env.`)
        }

        const fileUrl = `${rawBaseUrl}/${componentPath}.tsx`
        const fileResponse = await fetch(fileUrl, { headers: ghHeaders })
        if (fileResponse.ok) {
          const targetFilePath = path.resolve(targetBasePath, `${componentPath}.tsx`)
          fs.mkdirSync(path.dirname(targetFilePath), { recursive: true })
          fs.writeFileSync(targetFilePath, await fileResponse.text(), "utf-8")
          return { mode: "file", target: targetFilePath }
        }

        if (fileResponse.status === 401 || fileResponse.status === 403) {
          throw new Error(`GitHub authentication failed (HTTP ${fileResponse.status}). Check GITHUB_PAT token in .env.`)
        }
      }
    } catch (remoteError) {
      const localRegistryPath = projectRoot
        ? (fs.existsSync(path.resolve(projectRoot, "Loomix-registry", "src", "modules"))
            ? path.resolve(projectRoot, "Loomix-registry", "src", "modules")
            : path.resolve(projectRoot, "loom-blocks-registry", "src", "modules"))
        : null
      if (localRegistryPath && fs.existsSync(localRegistryPath) && isSafeSubPath(localRegistryPath, componentPath)) {
        const sourceDirPath = path.resolve(localRegistryPath, componentPath)
        const sourceFilePath = path.resolve(localRegistryPath, `${componentPath}.tsx`)

        if (fs.existsSync(sourceDirPath) && fs.statSync(sourceDirPath).isDirectory()) {
          const targetDir = path.resolve(targetBasePath, componentPath)
          syncLocalDirectory(sourceDirPath, targetDir)
          return { mode: "directory (local fallback)", target: targetDir }
        }
        if (fs.existsSync(sourceFilePath)) {
          const targetFilePath = path.resolve(targetBasePath, `${componentPath}.tsx`)
          fs.mkdirSync(path.dirname(targetFilePath), { recursive: true })
          fs.writeFileSync(targetFilePath, fs.readFileSync(sourceFilePath, "utf-8"), "utf-8")
          return { mode: "file (local fallback)", target: targetFilePath }
        }
      }

      throw remoteError.message ? remoteError : new Error(`Component '${componentPath}' not found as file or folder.`)
    }
  }

  if (!isSafeSubPath(registryBase, componentPath)) {
    throw new Error("Source path escapes REGISTRY_BASE directory.")
  }

  const sourceDirPath = path.resolve(registryBase, componentPath)
  const sourceFilePath = path.resolve(registryBase, `${componentPath}.tsx`)

  if (fs.existsSync(sourceDirPath) && fs.statSync(sourceDirPath).isDirectory()) {
    const targetDir = path.resolve(targetBasePath, componentPath)
    syncLocalDirectory(sourceDirPath, targetDir)
    return { mode: "directory", target: targetDir }
  }

  if (fs.existsSync(sourceFilePath)) {
    const targetFilePath = path.resolve(targetBasePath, `${componentPath}.tsx`)
    fs.mkdirSync(path.dirname(targetFilePath), { recursive: true })
    fs.writeFileSync(targetFilePath, fs.readFileSync(sourceFilePath, "utf-8"), "utf-8")
    return { mode: "file", target: targetFilePath }
  }

  throw new Error(`Component '${componentPath}' not found locally.`)
}

async function syncLoomComponent(action, componentPath, options = {}) {
  const projectRoot = options.projectRoot || resolveProjectRoot()
  loadEnvFallback(projectRoot)

  const registryBase = (options.registryBase || process.env.REGISTRY_URL || "").trim()
  const githubPat = options.githubPat || process.env.GITHUB_PAT || ""
  const registryToken = options.registryToken || process.env.LOOM_REGISTRY_TOKEN || process.env.REGISTRY_TOKEN || ""
  const targetBasePath =
    options.targetBasePath ||
    path.resolve(projectRoot, "store", "src", "modules")

  if (!registryBase) {
    throw new Error("REGISTRY_URL environment variable is not set.")
  }

  if (action === "remove") {
    const deleted = removeComponent(targetBasePath, componentPath)
    return { action, componentPath, deleted, projectRoot, targetBasePath }
  }

  const result = await addComponent({
    componentPath,
    registryBase,
    githubPat,
    registryToken,
    targetBasePath,
    projectRoot,
  })

  return {
    action: "add",
    componentPath,
    projectRoot,
    targetBasePath,
    ...result,
  }
}

module.exports = {
  addComponent,
  removeComponent,
  syncLoomComponent,
  resolveProjectRoot,
}

