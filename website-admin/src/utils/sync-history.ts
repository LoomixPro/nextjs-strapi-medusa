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

function getHistoryFilePath(): string {
  const projectRoot = resolveProjectRoot()
  // Store it in the data folder or root. Let's use the root of website-admin.
  return path.join(projectRoot, ".sync-history.json")
}

export function getHistory(): SyncHistoryItem[] {
  const filePath = getHistoryFilePath()
  if (!fs.existsSync(filePath)) {
    return []
  }
  try {
    const data = fs.readFileSync(filePath, "utf-8")
    return JSON.parse(data) as SyncHistoryItem[]
  } catch (error) {
    console.error("Failed to read sync history:", error)
    return []
  }
}

export function addHistoryItem(item: Omit<SyncHistoryItem, "id" | "timestamp">): SyncHistoryItem | null {
  const history = getHistory()
  
  // We remove the cancel-out logic so that backups are strictly preserved in a linear stack
  // This allows true restoration of previous states.

  // Create new item
  const newItem: SyncHistoryItem = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    ...item
  }
  
  history.push(newItem)
  
  fs.writeFileSync(getHistoryFilePath(), JSON.stringify(history, null, 2), "utf-8")
  return newItem
}

export function removeHistoryItem(id: string): boolean {
  const history = getHistory()
  const initialLength = history.length
  
  const newHistory = history.filter(item => item.id !== id)
  
  if (newHistory.length !== initialLength) {
    fs.writeFileSync(getHistoryFilePath(), JSON.stringify(newHistory, null, 2), "utf-8")
    return true
  }
  return false
}

export function clearHistory(): void {
  const filePath = getHistoryFilePath()
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath)
  }
  
  const backupDir = path.join(resolveProjectRoot(), ".sync-backups")
  if (fs.existsSync(backupDir)) {
    fs.rmSync(backupDir, { recursive: true, force: true })
  }
}
