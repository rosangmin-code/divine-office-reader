"use client"

import { useState, useEffect, useCallback } from "react"
import { ReaderSettings, DEFAULT_SETTINGS } from "@/lib/types"
import { loadSettings, saveSettings } from "@/lib/reader-store"

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
    const id = settings.lastSectionId
    if (id) {
      document.getElementById(id)?.scrollIntoView({ behavior: "instant" })
    }
    // Only run once after hydration
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated])

  const updateSetting = useCallback(
    <K extends keyof ReaderSettings>(key: K, value: ReaderSettings[K]) => {
      setSettings((prev) => ({ ...prev, [key]: value }))
    },
    []
  )

  return { settings, updateSetting, hydrated }
}
