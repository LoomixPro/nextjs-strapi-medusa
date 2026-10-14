import fs from "fs"
import path from "path"
import crypto from "crypto"
import { resolveProjectRoot } from "./project-root"

export interface SyncHistoryItem {
  id: string
  action: "add" | "remove"
  componentPath: string
  timestamp: string
  backupPath?: string
}

const STORE_PARAMS = { type: "plugin", name: "storefront_sync", key: "history" } as const

declare const strapi: any

function getHistoryFilePath(): string {
  if (process.env.SYNC_HISTORY_PATH) {
    return path.resolve(process.env.SYNC_HISTORY_PATH)
  }
  const projectRoot = resolveProjectRoot()
  // In Docker environment, public/uploads is mounted as a persistent volume (strapi_uploads)
  const uploadsDir = path.join(projectRoot, "public", "uploads")
  if (fs.existsSync(uploadsDir)) {
    return path.join(uploadsDir, ".sync-history.json")
  }
  return path.join(projectRoot, ".sync-history.json")
}

export async function getHistory(): Promise<SyncHistoryItem[]> {
  // 1. Try reading from Strapi core store (PostgreSQL DB, highly persistent across restarts & rebuilds)
  if (typeof strapi !== "undefined" && typeof strapi.store === "function") {
    try {
      const data = await strapi.store(STORE_PARAMS).get()
      if (Array.isArray(data)) {
        return data as SyncHistoryItem[]
      }
    } catch (error) {
      console.error("Failed to read sync history from strapi.store:", error)
    }
  }

  // 2. Fallback to file storage (checks uploads volume directory first, then legacy root location)
  const filePath = getHistoryFilePath()
  const rootFilePath = path.join(resolveProjectRoot(), ".sync-history.json")
  const targetFile = fs.existsSync(filePath)
    ? filePath
    : fs.existsSync(rootFilePath)
    ? rootFilePath
    : null

  if (targetFile) {
    try {
      const data = fs.readFileSync(targetFile, "utf-8")
      const parsed = JSON.parse(data) as SyncHistoryItem[]
      if (Array.isArray(parsed)) {
        // Automatically migrate legacy file history to strapi.store if strapi is active
        if (typeof strapi !== "undefined" && typeof strapi.store === "function" && parsed.length > 0) {
          await strapi.store(STORE_PARAMS).set({ value: parsed }).catch(() => {})
        }
        return parsed
      }
    } catch (error) {
      console.error("Failed to read sync history from file:", error)
    }
  }

  return []
}

export async function addHistoryItem(item: Omit<SyncHistoryItem, "id" | "timestamp">): Promise<SyncHistoryItem | null> {
  const history = await getHistory()
  
  // Create new item
  const newItem: SyncHistoryItem = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    ...item
  }
  
  history.push(newItem)
  
  // 1. Persist to strapi.store (database)
  if (typeof strapi !== "undefined" && typeof strapi.store === "function") {
    try {
      await strapi.store(STORE_PARAMS).set({ value: history })
    } catch (error) {
      console.error("Failed to save sync history to strapi.store:", error)
    }
  }

  // 2. Persist to file in persistent directory as secondary storage
  try {
    const filePath = getHistoryFilePath()
    const dir = path.dirname(filePath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    fs.writeFileSync(filePath, JSON.stringify(history, null, 2), "utf-8")
  } catch (error) {
    console.error("Failed to save sync history to file:", error)
  }

  return newItem
}

export async function removeHistoryItem(id: string): Promise<boolean> {
  const history = await getHistory()
  const initialLength = history.length
  
  const newHistory = history.filter(item => item.id !== id)
  
  if (newHistory.length !== initialLength) {
    // 1. Update strapi.store (database)
    if (typeof strapi !== "undefined" && typeof strapi.store === "function") {
      try {
        await strapi.store(STORE_PARAMS).set({ value: newHistory })
      } catch (error) {
        console.error("Failed to update sync history in strapi.store:", error)
      }
    }

    // 2. Update persistent file
    try {
      fs.writeFileSync(getHistoryFilePath(), JSON.stringify(newHistory, null, 2), "utf-8")
    } catch (error) {
      console.error("Failed to update sync history file:", error)
    }
    return true
  }
  return false
}

export async function clearHistory(): Promise<void> {
  // 1. Clear strapi.store (database)
  if (typeof strapi !== "undefined" && typeof strapi.store === "function") {
    try {
      await strapi.store(STORE_PARAMS).set({ value: [] })
    } catch (error) {
      console.error("Failed to clear sync history in strapi.store:", error)
    }
  }

  // 2. Clear persistent file
  const filePath = getHistoryFilePath()
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath)
    } catch (error) {
      console.error("Failed to unlink sync history file:", error)
    }
  }

  // 3. Clear legacy file if exists
  const rootFilePath = path.join(resolveProjectRoot(), ".sync-history.json")
  if (rootFilePath !== filePath && fs.existsSync(rootFilePath)) {
    try {
      fs.unlinkSync(rootFilePath)
    } catch (error) {}
  }
  
  const backupDir = path.join(resolveProjectRoot(), ".sync-backups")
  if (fs.existsSync(backupDir)) {
    try {
      fs.rmSync(backupDir, { recursive: true, force: true })
    } catch (error) {}
  }
}
