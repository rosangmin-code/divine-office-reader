"use client"

import { DEFAULT_SETTINGS } from "@/modules/shared"
import type { ReaderSettings } from "@/modules/shared"

const STORAGE_KEY = "divine-office-reader-settings"

function validateSettings(raw: unknown): ReaderSettings {
  if (typeof raw !== "object" || raw === null) return DEFAULT_SETTINGS
  const obj = raw as Record<string, unknown>
  return {
    fontSize: typeof obj.fontSize === "number"
      ? Math.min(32, Math.max(14, obj.fontSize))
      : DEFAULT_SETTINGS.fontSize,
    darkMode: typeof obj.darkMode === "boolean"
      ? obj.darkMode
      : DEFAULT_SETTINGS.darkMode,
    sidebarOpen: typeof obj.sidebarOpen === "boolean"
      ? obj.sidebarOpen
      : DEFAULT_SETTINGS.sidebarOpen,
    lastSectionId: typeof obj.lastSectionId === "string"
      ? obj.lastSectionId
      : DEFAULT_SETTINGS.lastSectionId,
  }
}

export function loadSettings(): ReaderSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_SETTINGS
    return validateSettings(JSON.parse(raw))
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function saveSettings(settings: ReaderSettings): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // localStorage full or unavailable — silently ignore
  }
}
