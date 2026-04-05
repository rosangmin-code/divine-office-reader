"use client"

import { useState, useCallback } from "react"
import { SectionContent, ContentGroup, ALL_CONTENT_GROUPS } from "@/lib/types"

type ContentMap = Record<string, SectionContent>

/** orderedIds에서 필요한 group을 추론 */
export function getGroupForId(id: string): ContentGroup | null {
  for (const g of ALL_CONTENT_GROUPS) {
    if (id.startsWith(g)) return g
  }
  return null
}

export function useSectionLoader(
  initialContent: ContentMap
) {
  const [content, setContent] = useState<ContentMap>(initialContent)
  const [loadedGroups, setLoadedGroups] = useState<Set<ContentGroup>>(() => {
    const groups = new Set<ContentGroup>()
    for (const id of Object.keys(initialContent)) {
      const g = getGroupForId(id)
      if (g) groups.add(g)
    }
    return groups
  })

  const loadGroup = useCallback(async (group: ContentGroup) => {
    if (loadedGroups.has(group)) return
    setLoadedGroups((prev) => new Set(prev).add(group))
    try {
      const res = await fetch(`/api/content/${group}`)
      if (!res.ok) return
      const data: ContentMap = await res.json()
      setContent((prev) => ({ ...prev, ...data }))
    } catch {
      setLoadedGroups((prev) => {
        const next = new Set(prev)
        next.delete(group)
        return next
      })
    }
  }, [loadedGroups])

  return { content, loadGroup, loadedGroups }
}
