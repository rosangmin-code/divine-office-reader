"use client"

import { useState, useCallback, useRef } from "react"
import { ALL_CONTENT_GROUPS } from "@/modules/shared"
import type { SectionContent, ContentGroup } from "@/modules/shared"

type ContentMap = Record<string, SectionContent>

/** id의 prefix로 소속 group을 추론 */
export function getGroupForId(id: string): ContentGroup | null {
  for (const g of ALL_CONTENT_GROUPS) {
    if (id.startsWith(g + "-") || id === g) return g
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

  // Synchronous in-flight tracking to prevent duplicate fetches within the same render cycle
  const inFlight = useRef<Set<ContentGroup>>(new Set())

  const loadGroup = useCallback(async (group: ContentGroup) => {
    if (inFlight.current.has(group)) return
    inFlight.current.add(group)
    setLoadedGroups((prev) => {
      if (prev.has(group)) return prev
      return new Set(prev).add(group)
    })
    try {
      const res = await fetch(`/api/content/${group}`)
      if (!res.ok) throw new Error(res.statusText)
      const data: ContentMap = await res.json()
      setContent((prev) => ({ ...prev, ...data }))
    } catch {
      inFlight.current.delete(group)
      setLoadedGroups((prev) => {
        const next = new Set(prev)
        next.delete(group)
        return next
      })
    }
  }, [])

  return { content, loadGroup, loadedGroups }
}
