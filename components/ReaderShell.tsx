"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { BookmarkNode, SectionContent, ReaderSettings, DEFAULT_SETTINGS } from "@/lib/types"
import { loadSettings, saveSettings } from "@/lib/reader-store"
import Sidebar from "./Sidebar"
import Toolbar from "./Toolbar"

interface Props {
  bookmarks: BookmarkNode
  content: Record<string, SectionContent>
  orderedIds: string[]
}

export default function ReaderShell({ bookmarks, content, orderedIds }: Props) {
  const [settings, setSettings] = useState<ReaderSettings>(DEFAULT_SETTINGS)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const readerRef = useRef<HTMLDivElement>(null)

  // Load settings on mount
  useEffect(() => {
    const s = loadSettings()
    setSettings(s)
    setMounted(true)
    if (s.darkMode) document.documentElement.classList.add("dark")
    if (s.lastSectionId) {
      setTimeout(() => {
        document.getElementById(s.lastSectionId!)?.scrollIntoView({ behavior: "instant" })
      }, 100)
    }
  }, [])

  // Save settings on change
  useEffect(() => {
    if (!mounted) return
    saveSettings(settings)
    if (settings.darkMode) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [settings, mounted])

  // Track active section via IntersectionObserver
  useEffect(() => {
    if (!mounted) return
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const id = entry.target.id
            setActiveId(id)
            setSettings((prev) => ({ ...prev, lastSectionId: id }))
            break
          }
        }
      },
      { rootMargin: "-10% 0px -80% 0px" }
    )

    for (const id of orderedIds) {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    }

    return () => observer.disconnect()
  }, [orderedIds, mounted])

  const scrollTo = useCallback((id: string) => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" })
      setActiveId(id)
      // Close sidebar on mobile
      if (window.innerWidth < 768) {
        setSettings((prev) => ({ ...prev, sidebarOpen: false }))
      }
    }
  }, [])

  const updateSetting = useCallback(<K extends keyof ReaderSettings>(key: K, value: ReaderSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }, [])

  if (!mounted) {
    return <div className="h-full flex items-center justify-center text-stone-400">Loading...</div>
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
          <Sidebar bookmarks={bookmarks} activeId={activeId} onNavigate={scrollTo} />
        )}
        <main
          ref={readerRef}
          className="flex-1 overflow-y-auto px-4 py-8 md:px-12 lg:px-20"
          style={{ fontSize: `${settings.fontSize}px` }}
        >
          <div className="max-w-3xl mx-auto">
            {orderedIds.map((id) => {
              const section = content[id]
              if (!section) return null
              return (
                <article
                  key={id}
                  id={id}
                  className="mb-12 scroll-mt-16"
                >
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
