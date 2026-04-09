"use client"

import { useState, useCallback } from "react"
import { usePrayerFlow } from "../hooks/usePrayerFlow"
import type { PrayerFlowStep } from "@/modules/shared"

const DAYS = [
  { mn: "Бямба", ko: "토" },
  { mn: "Ням", ko: "일" },
  { mn: "Даваа", ko: "월" },
  { mn: "Мягмар", ko: "화" },
  { mn: "Лхагва", ko: "수" },
  { mn: "Пүрэв", ko: "목" },
  { mn: "Баасан", ko: "금" },
]

const ROLE_ICONS: Record<string, string> = {
  opening: "▸",
  invitatory: "☩",
  hymn: "♪",
  psalm: "📖",
  "psalm-2": "📖",
  canticle: "🎵",
  reading: "📜",
  responsory: "↩",
  "gospel-canticle": "✦",
  intercessions: "🙏",
  "our-father": "✝",
  concluding: "◆",
  dismissal: "▪",
  continuation: "…",
}

const SOURCE_BADGE: Record<string, { label: string; cls: string }> = {
  psalter: { label: "시편집", cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
  propers: { label: "고유문", cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" },
  hymns: { label: "찬미가", cls: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" },
  fixed: { label: "고정문", cls: "bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400" },
}

interface Props {
  open: boolean
  onClose: () => void
  activeId: string | null
  onNavigate: (id: string) => void
}

export default function PrayerFlowGuide({ open, onClose, activeId, onNavigate }: Props) {
  const { flows, loaded } = usePrayerFlow()
  const [week, setWeek] = useState(1)
  const [dayIdx, setDayIdx] = useState(0)
  const [hour, setHour] = useState<"morning" | "evening">("morning")

  const day = DAYS[dayIdx]
  const flow = loaded ? flows.find(f => f.week === week && f.day === day.mn && f.hour === hour) : undefined

  const handleStepClick = useCallback((step: PrayerFlowStep) => {
    if (step.sectionId) {
      onNavigate(step.sectionId)
    }
  }, [onNavigate])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-40 flex md:relative md:inset-auto md:z-auto">
      {/* Backdrop (mobile) */}
      <div className="absolute inset-0 bg-black/30 md:hidden" onClick={onClose} />

      <div className="relative z-10 w-80 max-w-[85vw] h-full bg-white dark:bg-stone-900 border-r border-stone-200 dark:border-stone-800 flex flex-col overflow-hidden md:h-auto md:border-r-0 md:border-l">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-stone-200 dark:border-stone-800 flex-shrink-0">
          <h2 className="text-sm font-semibold text-stone-700 dark:text-stone-300">
            기도 순서 가이드
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500 min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="기도 가이드 닫기"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>
        </div>

        {/* Selectors */}
        <div className="px-3 py-2 border-b border-stone-200 dark:border-stone-800 flex-shrink-0 space-y-2">
          {/* Week selector */}
          <div className="flex gap-1">
            {[1, 2, 3, 4].map(w => (
              <button
                key={w}
                onClick={() => setWeek(w)}
                className={`flex-1 py-1.5 text-xs rounded-md font-medium transition-colors ${
                  week === w
                    ? "bg-stone-800 text-white dark:bg-stone-200 dark:text-stone-900"
                    : "bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700"
                }`}
              >
                {w}주
              </button>
            ))}
          </div>

          {/* Day selector */}
          <div className="flex gap-0.5">
            {DAYS.map((d, i) => (
              <button
                key={d.mn}
                onClick={() => setDayIdx(i)}
                className={`flex-1 py-1.5 text-xs rounded-md font-medium transition-colors ${
                  dayIdx === i
                    ? "bg-stone-800 text-white dark:bg-stone-200 dark:text-stone-900"
                    : "bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700"
                }`}
              >
                {d.ko}
              </button>
            ))}
          </div>

          {/* Hour selector */}
          <div className="flex gap-1">
            <button
              onClick={() => setHour("morning")}
              className={`flex-1 py-1.5 text-xs rounded-md font-medium transition-colors ${
                hour === "morning"
                  ? "bg-stone-800 text-white dark:bg-stone-200 dark:text-stone-900"
                  : "bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700"
              }`}
            >
              아침기도 (Өглөө)
            </button>
            <button
              onClick={() => setHour("evening")}
              className={`flex-1 py-1.5 text-xs rounded-md font-medium transition-colors ${
                hour === "evening"
                  ? "bg-stone-800 text-white dark:bg-stone-200 dark:text-stone-900"
                  : "bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700"
              }`}
            >
              저녁기도 (Орой)
            </button>
          </div>
        </div>

        {/* Steps list */}
        <div className="flex-1 overflow-y-auto">
          {!loaded && (
            <div className="p-4 text-sm text-stone-400">불러오는 중...</div>
          )}
          {loaded && !flow && (
            <div className="p-4 text-sm text-stone-400">해당 기도 데이터가 없습니다.</div>
          )}
          {flow && (
            <ol className="py-1">
              {flow.steps.map((step) => {
                const isActive = step.sectionId === activeId
                const isClickable = !!step.sectionId
                const badge = SOURCE_BADGE[step.source]
                const icon = ROLE_ICONS[step.liturgicalRole] || "·"

                return (
                  <li key={step.order}>
                    <button
                      disabled={!isClickable}
                      onClick={() => handleStepClick(step)}
                      className={`w-full text-left px-3 py-2 flex items-start gap-2 transition-colors ${
                        isActive
                          ? "bg-stone-100 dark:bg-stone-800"
                          : isClickable
                            ? "hover:bg-stone-50 dark:hover:bg-stone-800/50"
                            : ""
                      } ${!isClickable ? "opacity-60" : ""}`}
                    >
                      {/* Step number */}
                      <span className="text-[10px] font-mono text-stone-400 mt-0.5 w-4 text-right flex-shrink-0">
                        {step.order}
                      </span>

                      {/* Icon */}
                      <span className="text-xs mt-0.5 flex-shrink-0 w-4 text-center" aria-hidden="true">
                        {icon}
                      </span>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-stone-700 dark:text-stone-300 leading-snug">
                          {step.label}
                        </div>
                        {step.labelMn !== step.label && (
                          <div className="text-[10px] text-stone-400 dark:text-stone-500 leading-snug mt-0.5 truncate">
                            {step.labelMn}
                          </div>
                        )}
                        <div className="flex items-center gap-1 mt-1">
                          {badge && (
                            <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${badge.cls}`}>
                              {badge.label}
                            </span>
                          )}
                          {step.isGap && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400 font-medium">
                              {step.pageRef ? `책 x. ${step.pageRef}` : "앱 미포함"}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Active indicator */}
                      {isActive && (
                        <span className="text-xs text-stone-800 dark:text-stone-200 mt-0.5 flex-shrink-0">▶</span>
                      )}
                    </button>
                  </li>
                )
              })}
            </ol>
          )}
        </div>

        {/* Footer legend */}
        <div className="px-3 py-2 border-t border-stone-200 dark:border-stone-800 flex-shrink-0">
          <div className="flex flex-wrap gap-2 text-[9px] text-stone-400">
            {Object.entries(SOURCE_BADGE).map(([key, { label, cls }]) => (
              <span key={key} className={`px-1.5 py-0.5 rounded-full ${cls}`}>{label}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
