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
