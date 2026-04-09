"use client"

import { useState, useEffect, useCallback } from "react"
import { DEFAULT_SETTINGS } from "@/modules/shared"
import type { ReaderSettings } from "@/modules/shared"
import { loadSettings, saveSettings } from "../lib/reader-store"

export function useReaderSettings() {
  const [settings, setSettings] = useState<ReaderSettings>(DEFAULT_SETTINGS)
  const [hydrated, setHydrated] = useState(false)

  // Load persisted settings on mount
  useEffect(() => {
    const s = loadSettings()
    setSettings(s)
    setHydrated(true)
  }, [])

  // Persist settings & sync dark mode class
  useEffect(() => {
    if (!hydrated) return
    saveSettings(settings)
    if (settings.darkMode) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [settings, hydrated])

  // Restore scroll position once on mount
  useEffect(() => {
    if (!hydrated) return
    const { lastSectionId } = loadSettings()
    if (lastSectionId) {
      document.getElementById(lastSectionId)?.scrollIntoView({ behavior: "instant" })
    }
  }, [hydrated])

  const updateSetting = useCallback(
    <K extends keyof ReaderSettings>(key: K, value: ReaderSettings[K]) => {
      setSettings((prev) => ({ ...prev, [key]: value }))
    },
    []
  )

  return { settings, updateSetting, hydrated }
}
