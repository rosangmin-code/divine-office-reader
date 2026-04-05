"use client"

import { useEffect, useRef, useCallback } from "react"
import { useReaderSettings } from "@/hooks/useReaderSettings"
import { useActiveSection } from "@/hooks/useActiveSection"
import { useSectionLoader, getGroupForId } from "@/hooks/useSectionLoader"
import { BookmarkNode } from "@/lib/types"
import { loadSettings } from "@/lib/reader-store"
import Sidebar from "./Sidebar"
import Toolbar from "./Toolbar"

interface Props {
  bookmarks: BookmarkNode
  orderedIds: string[]
}

export default function ReaderShell({ bookmarks, orderedIds }: Props) {
  const { settings, updateSetting, hydrated } = useReaderSettings()
  const { activeId, scrollTo } = useActiveSection(orderedIds, hydrated)
  const { content, loadGroup } = useSectionLoader({})
  const pendingScrollId = useRef<string | null>(null)

  // Load the first group on mount — reads lastSectionId directly from storage
  // to avoid depending on settings state (which would re-trigger on every change)
  useEffect(() => {
    if (!hydrated) return
    const { lastSectionId } = loadSettings()
    const targetId = lastSectionId || orderedIds[0]
    if (targetId) {
      const group = getGroupForId(targetId)
      if (group) loadGroup(group)
    }
  }, [hydrated, orderedIds, loadGroup])

  // Sync lastSectionId to localStorage when the viewport-tracked section changes.
  // This lives here (not in useActiveSection) because persistence is a ReaderShell concern.
  useEffect(() => {
    if (activeId) {
      updateSetting("lastSectionId", activeId)
    }
  }, [activeId, updateSetting])

  // Load adjacent groups as user scrolls near boundaries
  useEffect(() => {
    if (!activeId) return
    const idx = orderedIds.indexOf(activeId)
    if (idx === -1) return

    for (let i = idx; i < Math.min(idx + 5, orderedIds.length); i++) {
      const group = getGroupForId(orderedIds[i])
      if (group) loadGroup(group)
    }
  }, [activeId, orderedIds, loadGroup])

  // Scroll to pending target after content renders
  useEffect(() => {
    if (pendingScrollId.current && content[pendingScrollId.current]) {
      const id = pendingScrollId.current
      pendingScrollId.current = null
      requestAnimationFrame(() => scrollTo(id))
    }
  }, [content, scrollTo])

  const handleNavigate = useCallback((id: string) => {
    const group = getGroupForId(id)
    if (group) {
      pendingScrollId.current = id
      loadGroup(group)
    } else {
      scrollTo(id)
    }
    if (window.innerWidth < 768) {
      updateSetting("sidebarOpen", false)
    }
  }, [loadGroup, scrollTo, updateSetting])

  return (
    <div className="h-full flex flex-col">
      <Toolbar
        settings={settings}
        onToggleSidebar={() => updateSetting("sidebarOpen", !settings.sidebarOpen)}
        onFontSize={(delta) =>
          updateSetting("fontSize", Math.min(32, Math.max(14, settings.fontSize + delta)))
        }
        onToggleDark={() => updateSetting("darkMode", !settings.darkMode)}
      />
      <div className="flex flex-1 overflow-hidden">
        {settings.sidebarOpen && (
          <Sidebar bookmarks={bookmarks} activeId={activeId} onNavigate={handleNavigate} />
        )}
        <main
          className="flex-1 overflow-y-auto px-4 py-8 md:px-12 lg:px-20"
          style={hydrated ? { fontSize: `${settings.fontSize}px` } : undefined}
        >
          <div className="max-w-3xl mx-auto">
            {orderedIds.map((id) => {
              const section = content[id]
              if (!section) return null
              return (
                <article key={id} id={id} className="mb-12 scroll-mt-16">
                  <h3 className="text-sm font-medium text-stone-400 dark:text-stone-500 mb-2 uppercase tracking-wide">
                    {section.titleMn}
                  </h3>
                  <div className="whitespace-pre-wrap leading-relaxed font-serif">
                    {section.content}
                  </div>
                  <hr className="mt-8 border-stone-200 dark:border-stone-800" />
                </article>
              )
            })}
          </div>
        </main>
      </div>
    </div>
  )
}
