"use client"

import { ReaderSettings } from "@/lib/types"

interface Props {
  settings: ReaderSettings
  onToggleSidebar: () => void
  onFontSize: (delta: number) => void
  onToggleDark: () => void
  onToggleFlowGuide?: () => void
  flowGuideOpen?: boolean
}

export default function Toolbar({ settings, onToggleSidebar, onFontSize, onToggleDark, onToggleFlowGuide, flowGuideOpen }: Props) {
  return (
    <header className="h-12 flex items-center justify-between px-3 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 flex-shrink-0 relative z-50">
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleSidebar}
          className="p-2.5 -m-1 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400 min-w-[44px] min-h-[44px] flex items-center justify-center"
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
      <div className="flex items-center gap-1" role="group" aria-label="읽기 설정">
        <button
          onClick={() => onFontSize(-2)}
          className="px-2.5 py-1.5 rounded-lg text-sm hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400 min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="폰트 축소"
        >
          A-
        </button>
        <span className="text-xs text-stone-400 w-8 text-center" aria-live="polite" aria-label={`현재 폰트 크기 ${settings.fontSize}`}>
          {settings.fontSize}
        </span>
        <button
          onClick={() => onFontSize(2)}
          className="px-2.5 py-1.5 rounded-lg text-sm hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400 min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="폰트 확대"
        >
          A+
        </button>
        <div className="w-px h-5 bg-stone-200 dark:bg-stone-700 mx-0.5" role="separator" />
        {onToggleFlowGuide && (
          <button
            onClick={onToggleFlowGuide}
            className={`p-2.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 min-w-[44px] min-h-[44px] flex items-center justify-center ${
              flowGuideOpen ? "text-stone-900 dark:text-stone-100 bg-stone-100 dark:bg-stone-800" : "text-stone-600 dark:text-stone-400"
            }`}
            aria-label={flowGuideOpen ? "기도 가이드 닫기" : "기도 가이드 열기"}
            aria-pressed={flowGuideOpen}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
              <rect x="9" y="3" width="6" height="4" rx="1" />
              <path d="M9 12l2 2 4-4" />
            </svg>
          </button>
        )}
        <button
          onClick={onToggleDark}
          className="p-2.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400 min-w-[44px] min-h-[44px] flex items-center justify-center"
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
