"use client"

import { useEffect } from "react"
import { useReaderSettings } from "@/hooks/useReaderSettings"
import { useActiveSection } from "@/hooks/useActiveSection"
import { BookmarkNode, SectionContent } from "@/lib/types"
import Sidebar from "./Sidebar"
import Toolbar from "./Toolbar"

interface Props {
  bookmarks: BookmarkNode
  content: Record<string, SectionContent>
  orderedIds: string[]
}

export default function ReaderShell({ bookmarks, content, orderedIds }: Props) {
  const { settings, updateSetting, hydrated } = useReaderSettings()
  const { activeId, scrollTo } = useActiveSection(orderedIds, hydrated)

  // Sync lastSectionId when active section changes
  useEffect(() => {
    if (activeId) {
      updateSetting("lastSectionId", activeId)
    }
  }, [activeId, updateSetting])

  const handleNavigate = (id: string) => {
    scrollTo(id)
    if (window.innerWidth < 768) {
      updateSetting("sidebarOpen", false)
    }
  }

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
