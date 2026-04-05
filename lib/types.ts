export interface BookmarkNode {
  id: string
  title: string
  titleMn: string
  children: BookmarkNode[]
}

export interface SectionContent {
  title: string
  titleMn: string
  content: string
  page?: number
  level: number
}

export interface ReaderSettings {
  fontSize: number       // 16-28
  darkMode: boolean
  sidebarOpen: boolean
  lastSectionId: string | null
}

export const DEFAULT_SETTINGS: ReaderSettings = {
  fontSize: 18,
  darkMode: false,
  sidebarOpen: true,
  lastSectionId: null,
}

/** content 분할 단위: week1, week2, week3, week4, propers, hymns */
export type ContentGroup = "week1" | "week2" | "week3" | "week4" | "propers" | "hymns"

export const ALL_CONTENT_GROUPS: ContentGroup[] = [
  "week1", "week2", "week3", "week4", "propers", "hymns"
]
