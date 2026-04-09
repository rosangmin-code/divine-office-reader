import type { ReaderSettings, ContentGroup } from "./types"

export const DEFAULT_SETTINGS: ReaderSettings = {
  fontSize: 18,
  darkMode: false,
  sidebarOpen: true,
  lastSectionId: null,
}

export const ALL_CONTENT_GROUPS: ContentGroup[] = [
  "week1", "week2", "week3", "week4", "propers", "hymns"
]
