import { describe, it, expect, beforeEach, vi } from "vitest"
import { loadSettings, saveSettings } from "@/lib/reader-store"
import { DEFAULT_SETTINGS } from "@/lib/types"

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value }),
    removeItem: vi.fn((key: string) => { delete store[key] }),
    clear: vi.fn(() => { store = {} }),
  }
})()

Object.defineProperty(globalThis, "localStorage", { value: localStorageMock })

describe("reader-store", () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  it("returns defaults when nothing is stored", () => {
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS)
  })

  it("persists and loads settings", () => {
    const custom = { ...DEFAULT_SETTINGS, fontSize: 24, darkMode: true }
    saveSettings(custom)
    expect(loadSettings()).toEqual(custom)
  })

  it("clamps fontSize within valid range", () => {
    localStorageMock.setItem(
      "divine-office-reader-settings",
      JSON.stringify({ fontSize: 999 })
    )
    const result = loadSettings()
    expect(result.fontSize).toBe(32)
  })

  it("returns defaults for corrupted JSON", () => {
    localStorageMock.setItem("divine-office-reader-settings", "not-json")
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS)
  })

  it("validates boolean fields", () => {
    localStorageMock.setItem(
      "divine-office-reader-settings",
      JSON.stringify({ darkMode: "yes", sidebarOpen: 42 })
    )
    const result = loadSettings()
    expect(result.darkMode).toBe(DEFAULT_SETTINGS.darkMode)
    expect(result.sidebarOpen).toBe(DEFAULT_SETTINGS.sidebarOpen)
  })
})
