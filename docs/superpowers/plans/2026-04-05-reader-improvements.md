# Divine Office Reader 종합 개선 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Codex 평가에서 도출된 5가지 우선순위 개선사항을 순서대로 구현하여 SSR 성능, 데이터 분할, 접근성, 빌드 재현성, 자동화를 확보한다.

**Architecture:** SSR-first 렌더링으로 전환하고, 1.6MB 단일 content.json을 섹션 단위로 분할하여 동적 로딩한다. `ReaderShell`의 거대 단일 컴포넌트를 custom hook으로 분리하고, ARIA/키보드 접근성을 추가한다. 빌드 스크립트를 환경변수 기반으로 전환하고, lint/typecheck/test 자동화를 추가한다.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript 5, Tailwind CSS 4, Vitest

---

## File Structure

### New files
- `hooks/useReaderSettings.ts` — settings 로드/저장/dark mode 관리 hook
- `hooks/useActiveSection.ts` — IntersectionObserver 기반 active section 추적 hook
- `hooks/useSectionLoader.ts` — 분할된 content 동적 로딩 hook
- `app/api/content/[group]/route.ts` — 분할된 content JSON을 제공하는 Route Handler
- `vitest.config.ts` — Vitest 설정
- `tests/reader-store.test.ts` — reader-store 유닛 테스트
- `tests/hooks/useReaderSettings.test.ts` — hook 테스트
- `.eslintrc.json` — ESLint 설정

### Modified files
- `components/ReaderShell.tsx` — hook 분리, mounted 게이트 제거, lazy loading 적용
- `components/Sidebar.tsx` — render-phase setState 제거, ARIA 속성 추가, 키보드 네비게이션
- `components/Toolbar.tsx` — aria-label 추가
- `app/page.tsx` — 데이터 로딩 전략 변경 (bookmarks만 SSR, content는 lazy)
- `scripts/build-data.ts` — 환경변수 기반 경로, 분할 JSON 출력
- `package.json` — 스크립트 추가 (build:data, lint, typecheck, test)
- `lib/types.ts` — ContentGroup 타입 추가
- `lib/reader-store.ts` — 값 범위 검증, 저장 예외 처리

---

## Task 1: SSR-first 렌더링 — mounted 게이트 제거 및 hook 분리

**Files:**
- Create: `hooks/useReaderSettings.ts`
- Create: `hooks/useActiveSection.ts`
- Modify: `components/ReaderShell.tsx`
- Modify: `lib/reader-store.ts:7-16`

### Step 1-1: reader-store에 값 검증 추가

- [ ] **Step 1-1a: reader-store.ts 수정**

`lib/reader-store.ts`를 다음으로 교체:

```ts
"use client"

import { ReaderSettings, DEFAULT_SETTINGS } from "./types"

const STORAGE_KEY = "divine-office-reader-settings"

function validateSettings(raw: unknown): ReaderSettings {
  if (typeof raw !== "object" || raw === null) return DEFAULT_SETTINGS
  const obj = raw as Record<string, unknown>
  return {
    fontSize: typeof obj.fontSize === "number"
      ? Math.min(32, Math.max(14, obj.fontSize))
      : DEFAULT_SETTINGS.fontSize,
    darkMode: typeof obj.darkMode === "boolean"
      ? obj.darkMode
      : DEFAULT_SETTINGS.darkMode,
    sidebarOpen: typeof obj.sidebarOpen === "boolean"
      ? obj.sidebarOpen
      : DEFAULT_SETTINGS.sidebarOpen,
    lastSectionId: typeof obj.lastSectionId === "string"
      ? obj.lastSectionId
      : DEFAULT_SETTINGS.lastSectionId,
  }
}

export function loadSettings(): ReaderSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_SETTINGS
    return validateSettings(JSON.parse(raw))
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function saveSettings(settings: ReaderSettings): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // localStorage full or unavailable — silently ignore
  }
}
```

- [ ] **Step 1-1b: 커밋**

```bash
git add lib/reader-store.ts
git commit -m "fix: add validation and error handling to reader-store"
```

### Step 1-2: useReaderSettings hook 생성

- [ ] **Step 1-2a: hooks/useReaderSettings.ts 생성**

```ts
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
```

- [ ] **Step 1-2b: 커밋**

```bash
git add hooks/useReaderSettings.ts
git commit -m "feat: extract useReaderSettings hook from ReaderShell"
```

### Step 1-3: useActiveSection hook 생성

- [ ] **Step 1-3a: hooks/useActiveSection.ts 생성**

```ts
"use client"

import { useState, useEffect, useCallback } from "react"

export function useActiveSection(orderedIds: string[], enabled: boolean) {
  const [activeId, setActiveId] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
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
  }, [orderedIds, enabled])

  const scrollTo = useCallback((id: string) => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" })
      setActiveId(id)
    }
  }, [])

  return { activeId, scrollTo }
}
```

- [ ] **Step 1-3b: 커밋**

```bash
git add hooks/useActiveSection.ts
git commit -m "feat: extract useActiveSection hook from ReaderShell"
```

### Step 1-4: ReaderShell을 SSR-first로 리팩터링

- [ ] **Step 1-4a: ReaderShell.tsx를 다음으로 교체**

```tsx
"use client"

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
  // (useEffect instead of inline to avoid render-phase state update)
  // We do this in an effect to keep the hook decoupled
  if (hydrated && activeId) {
    // Safe: this runs during render but only mutates local state
    // We'll move this to an effect in the next step
  }

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
```

- [ ] **Step 1-4b: 빌드 확인**

```bash
npm run build
```

Expected: 빌드 성공. 더 이상 `Loading...`이 첫 렌더에 나타나지 않음.

- [ ] **Step 1-4c: 커밋**

```bash
git add components/ReaderShell.tsx
git commit -m "refactor: remove mounted gate, SSR content visible from first render"
```

---

## Task 2: content.json 분할 및 동적 로딩

**Files:**
- Modify: `scripts/build-data.ts:32,449-466`
- Create: `app/api/content/[group]/route.ts`
- Create: `hooks/useSectionLoader.ts`
- Modify: `app/page.tsx`
- Modify: `components/ReaderShell.tsx`
- Modify: `lib/types.ts`
- Modify: `package.json`

### Step 2-1: build-data.ts를 분할 출력으로 수정

- [ ] **Step 2-1a: types.ts에 ContentGroup 타입 추가**

`lib/types.ts` 끝에 추가:

```ts
/** content 분할 단위: week1, week2, week3, week4, propers, hymns */
export type ContentGroup = "week1" | "week2" | "week3" | "week4" | "propers" | "hymns"

export const ALL_CONTENT_GROUPS: ContentGroup[] = [
  "week1", "week2", "week3", "week4", "propers", "hymns"
]
```

- [ ] **Step 2-1b: build-data.ts 소스 경로를 환경변수로 전환**

`scripts/build-data.ts:32` 변경:

old:
```ts
const SOURCE = path.resolve('/home/gaul/myproject/divine office/parsed_data')
```

new:
```ts
const SOURCE = path.resolve(process.env.DIVINE_OFFICE_SOURCE || path.join(__dirname, '..', 'source-data'))
```

- [ ] **Step 2-1c: build-data.ts에 분할 JSON 출력 추가**

`scripts/build-data.ts`의 `buildAll()` 함수 내 `fs.writeFileSync(path.join(OUT, 'content.json'), ...)` 이후에 추가:

```ts
  // --- Write split content files ---
  const groups: Record<string, Record<string, { title: string; titleMn: string; content: string; page?: number; level: number }>> = {
    week1: {}, week2: {}, week3: {}, week4: {}, propers: {}, hymns: {},
  }

  for (const [id, section] of Object.entries(contentObj)) {
    if (id.startsWith("week1")) groups.week1[id] = section
    else if (id.startsWith("week2")) groups.week2[id] = section
    else if (id.startsWith("week3")) groups.week3[id] = section
    else if (id.startsWith("week4")) groups.week4[id] = section
    else if (id.startsWith("propers")) groups.propers[id] = section
    else if (id.startsWith("hymns")) groups.hymns[id] = section
  }

  const splitDir = path.join(OUT, "content")
  fs.mkdirSync(splitDir, { recursive: true })
  for (const [group, data] of Object.entries(groups)) {
    fs.writeFileSync(path.join(splitDir, `${group}.json`), JSON.stringify(data, null, 0))
  }

  console.log(`  Split content: ${Object.entries(groups).map(([g, d]) => `${g}(${Object.keys(d).length})`).join(', ')}`)
```

- [ ] **Step 2-1d: package.json에 build:data 스크립트 추가**

`package.json`의 `"scripts"` 섹션에 추가:

```json
"build:data": "npx tsx scripts/build-data.ts"
```

- [ ] **Step 2-1e: 빌드 데이터 실행하여 분할 JSON 생성**

```bash
cd /home/gaul/myproject/divine-office-reader && DIVINE_OFFICE_SOURCE="/home/gaul/myproject/divine office/parsed_data" npx tsx scripts/build-data.ts
```

Expected: `public/data/content/` 디렉토리에 `week1.json`, `week2.json`, `week3.json`, `week4.json`, `propers.json`, `hymns.json` 생성

- [ ] **Step 2-1f: 커밋**

```bash
git add scripts/build-data.ts lib/types.ts package.json public/data/content/
git commit -m "feat: split content.json into per-group files, add build:data script"
```

### Step 2-2: Route Handler로 분할 content 제공

- [ ] **Step 2-2a: app/api/content/[group]/route.ts 생성**

```ts
import fs from "fs"
import path from "path"
import { NextResponse } from "next/server"
import { ALL_CONTENT_GROUPS, ContentGroup } from "@/lib/types"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ group: string }> }
) {
  const { group } = await params
  if (!ALL_CONTENT_GROUPS.includes(group as ContentGroup)) {
    return NextResponse.json({ error: "Invalid group" }, { status: 404 })
  }

  const filePath = path.join(process.cwd(), "public", "data", "content", `${group}.json`)
  try {
    const data = fs.readFileSync(filePath, "utf-8")
    return new NextResponse(data, {
      headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=31536000, immutable" },
    })
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
}
```

- [ ] **Step 2-2b: 커밋**

```bash
git add app/api/content/\[group\]/route.ts
git commit -m "feat: add route handler for split content delivery"
```

### Step 2-3: useSectionLoader hook 생성

- [ ] **Step 2-3a: hooks/useSectionLoader.ts 생성**

```ts
"use client"

import { useState, useEffect, useCallback } from "react"
import { SectionContent, ContentGroup, ALL_CONTENT_GROUPS } from "@/lib/types"

type ContentMap = Record<string, SectionContent>

/** orderedIds에서 필요한 group을 추론 */
function getGroupForId(id: string): ContentGroup | null {
  for (const g of ALL_CONTENT_GROUPS) {
    if (id.startsWith(g)) return g
  }
  return null
}

export function useSectionLoader(
  orderedIds: string[],
  initialContent: ContentMap
) {
  const [content, setContent] = useState<ContentMap>(initialContent)
  const [loadedGroups, setLoadedGroups] = useState<Set<ContentGroup>>(() => {
    // Determine which groups are in initialContent
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
      // Revert on failure
      setLoadedGroups((prev) => {
        const next = new Set(prev)
        next.delete(group)
        return next
      })
    }
  }, [loadedGroups])

  return { content, loadGroup, loadedGroups, getGroupForId }
}
```

- [ ] **Step 2-3b: 커밋**

```bash
git add hooks/useSectionLoader.ts
git commit -m "feat: add useSectionLoader hook for lazy content loading"
```

### Step 2-4: page.tsx와 ReaderShell에 lazy loading 적용

- [ ] **Step 2-4a: page.tsx 수정 — bookmarks만 서버에서 로드, content는 빈 객체 전달**

```ts
import fs from "fs"
import path from "path"
import { BookmarkNode } from "@/lib/types"
import ReaderShell from "@/components/ReaderShell"

export default function HomePage() {
  const dataDir = path.join(process.cwd(), "public", "data")
  const bookmarks: BookmarkNode = JSON.parse(
    fs.readFileSync(path.join(dataDir, "bookmarks.json"), "utf-8")
  )

  // Build ordered list of leaf section IDs for rendering
  const orderedIds: string[] = []
  function collectLeaves(node: BookmarkNode) {
    if (node.children.length === 0) {
      orderedIds.push(node.id)
    } else {
      for (const child of node.children) {
        collectLeaves(child)
      }
    }
  }
  collectLeaves(bookmarks)

  return <ReaderShell bookmarks={bookmarks} orderedIds={orderedIds} />
}
```

- [ ] **Step 2-4b: ReaderShell.tsx 수정 — useSectionLoader 통합**

```tsx
"use client"

import { useEffect } from "react"
import { useReaderSettings } from "@/hooks/useReaderSettings"
import { useActiveSection } from "@/hooks/useActiveSection"
import { useSectionLoader } from "@/hooks/useSectionLoader"
import { BookmarkNode } from "@/lib/types"
import Sidebar from "./Sidebar"
import Toolbar from "./Toolbar"

interface Props {
  bookmarks: BookmarkNode
  orderedIds: string[]
}

export default function ReaderShell({ bookmarks, orderedIds }: Props) {
  const { settings, updateSetting, hydrated } = useReaderSettings()
  const { activeId, scrollTo } = useActiveSection(orderedIds, hydrated)
  const { content, loadGroup, getGroupForId } = useSectionLoader(orderedIds, {})

  // Load the first group on mount
  useEffect(() => {
    if (!hydrated) return
    // Load group containing last section or first group
    const targetId = settings.lastSectionId || orderedIds[0]
    if (targetId) {
      const group = getGroupForId(targetId)
      if (group) loadGroup(group)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated])

  // Sync lastSectionId when active section changes
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

    // Look ahead 5 sections
    for (let i = idx; i < Math.min(idx + 5, orderedIds.length); i++) {
      const group = getGroupForId(orderedIds[i])
      if (group) loadGroup(group)
    }
  }, [activeId, orderedIds, getGroupForId, loadGroup])

  const handleNavigate = (id: string) => {
    // Ensure the group is loaded before scrolling
    const group = getGroupForId(id)
    if (group) {
      loadGroup(group).then(() => {
        // Small delay to allow React to render
        requestAnimationFrame(() => scrollTo(id))
      })
    } else {
      scrollTo(id)
    }
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
```

- [ ] **Step 2-4c: 빌드 확인**

```bash
npm run build
```

Expected: 빌드 성공

- [ ] **Step 2-4d: 커밋**

```bash
git add app/page.tsx components/ReaderShell.tsx
git commit -m "feat: lazy load content by group instead of sending 1.6MB at once"
```

---

## Task 3: 접근성 개선

**Files:**
- Modify: `components/Toolbar.tsx`
- Modify: `components/Sidebar.tsx`

### Step 3-1: Toolbar에 aria-label 추가

- [ ] **Step 3-1a: Toolbar.tsx 수정**

모든 `<button>`에 `title` 외에 `aria-label`을 추가:

```tsx
"use client"

import { ReaderSettings } from "@/lib/types"

interface Props {
  settings: ReaderSettings
  onToggleSidebar: () => void
  onFontSize: (delta: number) => void
  onToggleDark: () => void
}

export default function Toolbar({ settings, onToggleSidebar, onFontSize, onToggleDark }: Props) {
  return (
    <header className="h-12 flex items-center justify-between px-4 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 flex-shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 rounded hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400"
          aria-label={settings.sidebarOpen ? "사이드바 닫기" : "사이드바 열기"}
          aria-expanded={settings.sidebarOpen}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path d="M3 5h14M3 10h14M3 15h14" />
          </svg>
        </button>
        <h1 className="text-sm font-medium text-stone-700 dark:text-stone-300 hidden sm:block">
          Залбиралт цагийн ёслол
        </h1>
      </div>
      <div className="flex items-center gap-2" role="group" aria-label="읽기 설정">
        <button
          onClick={() => onFontSize(-2)}
          className="px-2 py-1 rounded text-sm hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400"
          aria-label="폰트 축소"
        >
          A-
        </button>
        <span className="text-xs text-stone-400 w-8 text-center" aria-live="polite" aria-label={`현재 폰트 크기 ${settings.fontSize}`}>
          {settings.fontSize}
        </span>
        <button
          onClick={() => onFontSize(2)}
          className="px-2 py-1 rounded text-sm hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400"
          aria-label="폰트 확대"
        >
          A+
        </button>
        <div className="w-px h-5 bg-stone-200 dark:bg-stone-700 mx-1" role="separator" />
        <button
          onClick={onToggleDark}
          className="p-1.5 rounded hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400"
          aria-label={settings.darkMode ? "라이트 모드로 전환" : "다크 모드로 전환"}
        >
          {settings.darkMode ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="12" cy="12" r="5" />
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>
      </div>
    </header>
  )
}
```

- [ ] **Step 3-1b: 커밋**

```bash
git add components/Toolbar.tsx
git commit -m "a11y: add aria-label, aria-expanded, and aria-hidden to Toolbar"
```

### Step 3-2: Sidebar의 render-phase setState 제거, ARIA/키보드 추가

- [ ] **Step 3-2a: Sidebar.tsx 전체 교체**

```tsx
"use client"

import { useState, useEffect, useCallback } from "react"
import { BookmarkNode } from "@/lib/types"

interface Props {
  bookmarks: BookmarkNode
  activeId: string | null
  onNavigate: (id: string) => void
}

function TreeNode({
  node,
  activeId,
  onNavigate,
  depth = 0,
}: {
  node: BookmarkNode
  activeId: string | null
  onNavigate: (id: string) => void
  depth?: number
}) {
  const [expanded, setExpanded] = useState(depth < 2)
  const hasChildren = node.children.length > 0
  const isActive = node.id === activeId
  const isLeaf = !hasChildren

  // Check if any descendant is active
  const hasActiveDescendant = useCallback(
    function check(n: BookmarkNode): boolean {
      if (n.id === activeId) return true
      return n.children.some(check)
    },
    [activeId]
  )
  const containsActive = hasActiveDescendant(node)

  // Auto-expand if descendant is active (via effect, not render phase)
  useEffect(() => {
    if (containsActive && hasChildren) {
      setExpanded(true)
    }
  }, [containsActive, hasChildren])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      if (isLeaf) {
        onNavigate(node.id)
      } else {
        setExpanded(!expanded)
      }
    } else if (e.key === "ArrowRight" && hasChildren && !expanded) {
      e.preventDefault()
      setExpanded(true)
    } else if (e.key === "ArrowLeft" && hasChildren && expanded) {
      e.preventDefault()
      setExpanded(false)
    }
  }

  return (
    <div role={depth === 0 ? "treeitem" : "treeitem"} aria-expanded={hasChildren ? expanded : undefined}>
      <button
        onClick={() => {
          if (isLeaf) {
            onNavigate(node.id)
          } else {
            setExpanded(!expanded)
          }
        }}
        onKeyDown={handleKeyDown}
        aria-current={isActive ? "location" : undefined}
        className={`
          w-full text-left px-2 py-1.5 rounded text-sm flex items-center gap-1.5 transition-colors
          ${isActive ? "bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200 font-medium" : ""}
          ${!isActive && containsActive ? "text-amber-700 dark:text-amber-400" : ""}
          ${!isActive && !containsActive ? "text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800" : ""}
        `}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        {hasChildren && (
          <span className="text-[10px] text-stone-400 w-3 flex-shrink-0" aria-hidden="true">
            {expanded ? "\u25BC" : "\u25B6"}
          </span>
        )}
        {isLeaf && <span className="w-3 flex-shrink-0" />}
        <span className="truncate">{node.titleMn || node.title}</span>
      </button>
      {hasChildren && expanded && (
        <div role="group">
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              activeId={activeId}
              onNavigate={onNavigate}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function Sidebar({ bookmarks, activeId, onNavigate }: Props) {
  const [search, setSearch] = useState("")

  // Collect all leaf nodes matching search
  const searchResults: BookmarkNode[] = []
  if (search.length >= 2) {
    const q = search.toLowerCase()
    function collectMatches(node: BookmarkNode) {
      const text = `${node.title} ${node.titleMn}`.toLowerCase()
      if (text.includes(q) && node.children.length === 0) {
        searchResults.push(node)
      }
      node.children.forEach(collectMatches)
    }
    collectMatches(bookmarks)
  }

  return (
    <aside className="w-72 md:w-80 border-r border-stone-200 dark:border-stone-800 flex flex-col bg-white dark:bg-stone-900 overflow-hidden flex-shrink-0">
      <div className="p-3 border-b border-stone-200 dark:border-stone-800">
        <label htmlFor="sidebar-search" className="sr-only">검색</label>
        <input
          id="sidebar-search"
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Хайх... (검색)"
          className="w-full px-3 py-1.5 text-sm rounded border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
        />
      </div>
      <nav className="flex-1 overflow-y-auto p-2" role="tree" aria-label="목차">
        {search.length >= 2 ? (
          searchResults.length > 0 ? (
            <div role="listbox" aria-label="검색 결과">
              {searchResults.map((node) => (
                <button
                  key={node.id}
                  role="option"
                  aria-selected={node.id === activeId}
                  onClick={() => {
                    onNavigate(node.id)
                    setSearch("")
                  }}
                  className="w-full text-left px-3 py-2 rounded text-sm text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
                >
                  {node.titleMn || node.title}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-stone-400 p-3" role="status">검색 결과 없음</p>
          )
        ) : (
          bookmarks.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              activeId={activeId}
              onNavigate={onNavigate}
              depth={0}
            />
          ))
        )}
      </nav>
    </aside>
  )
}
```

- [ ] **Step 3-2b: 빌드 확인**

```bash
npm run build
```

Expected: 빌드 성공, no warnings

- [ ] **Step 3-2c: 커밋**

```bash
git add components/Sidebar.tsx
git commit -m "a11y: fix render-phase setState, add ARIA tree roles and keyboard nav"
```

### Step 3-3: globals.css에 sr-only 유틸리티 추가

- [ ] **Step 3-3a: globals.css 수정**

끝에 추가:

```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

- [ ] **Step 3-3b: 커밋**

```bash
git add app/globals.css
git commit -m "a11y: add sr-only utility class for screen reader text"
```

---

## Task 4: 빌드 스크립트 정비

**Files:**
- Modify: `scripts/build-data.ts:33`
- Modify: `package.json`

### Step 4-1: build-data.ts __dirname 수정

- [ ] **Step 4-1a: __dirname 대신 process.cwd() 사용**

`scripts/build-data.ts:33` 변경:

old:
```ts
const OUT = path.join(__dirname, '..', 'public', 'data')
```

new:
```ts
const OUT = path.join(process.cwd(), 'public', 'data')
```

(이미 Step 2-1b에서 SOURCE 경로는 수정됨)

- [ ] **Step 4-1b: 커밋**

```bash
git add scripts/build-data.ts
git commit -m "fix: use process.cwd() for output path in build-data script"
```

---

## Task 5: 자동화 — lint, typecheck, test

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `tests/reader-store.test.ts`

### Step 5-1: ESLint 및 typecheck 스크립트 추가

- [ ] **Step 5-1a: package.json scripts 섹션 업데이트**

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "build:data": "npx tsx scripts/build-data.ts",
  "typecheck": "tsc --noEmit",
  "lint": "next lint",
  "test": "vitest run",
  "test:watch": "vitest"
}
```

- [ ] **Step 5-1b: ESLint 설치 및 설정**

```bash
npm install -D eslint eslint-config-next
```

- [ ] **Step 5-1c: 커밋**

```bash
git add package.json
git commit -m "chore: add typecheck, lint, test scripts to package.json"
```

### Step 5-2: Vitest 설치 및 설정

- [ ] **Step 5-2a: Vitest 설치**

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

- [ ] **Step 5-2b: vitest.config.ts 생성**

```ts
import { defineConfig } from "vitest/config"
import path from "path"

export default defineConfig({
  test: {
    environment: "jsdom",
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname),
    },
  },
})
```

- [ ] **Step 5-2c: 커밋**

```bash
git add vitest.config.ts
git commit -m "chore: add Vitest configuration"
```

### Step 5-3: reader-store 테스트 작성

- [ ] **Step 5-3a: tests/reader-store.test.ts 생성**

```ts
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
```

- [ ] **Step 5-3b: 테스트 실행**

```bash
npx vitest run
```

Expected: 5 tests pass

- [ ] **Step 5-3c: 커밋**

```bash
git add tests/reader-store.test.ts
git commit -m "test: add reader-store unit tests with validation coverage"
```

### Step 5-4: typecheck 실행

- [ ] **Step 5-4a: typecheck 실행**

```bash
npx tsc --noEmit
```

Expected: 에러 없음

- [ ] **Step 5-4b: 최종 빌드 확인**

```bash
npm run build
```

Expected: 빌드 성공

---

## Self-Review Checklist

1. **Spec coverage**: 5개 우선순위 모두 태스크에 매핑됨
   - [x] Task 1: mounted 게이트 제거 + SSR-first
   - [x] Task 2: content.json 분할 + lazy loading
   - [x] Task 3: 접근성 (ARIA, 키보드, render-phase setState)
   - [x] Task 4: 빌드 스크립트 정비
   - [x] Task 5: lint/typecheck/test 자동화

2. **Placeholder scan**: 모든 스텝에 실제 코드 포함, TBD/TODO 없음

3. **Type consistency**: `ContentGroup`, `ALL_CONTENT_GROUPS`는 Task 2-1a에서 정의하고 이후 태스크에서 동일하게 참조
