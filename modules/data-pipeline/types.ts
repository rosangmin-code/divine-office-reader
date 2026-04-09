/**
 * Build-time types used only by the data pipeline.
 * Runtime types (BookmarkNode, SectionContent, etc.) live in @/modules/shared.
 */

import type { LiturgicalSegment, LiturgicalRole } from "@/modules/shared"

/** A typed segment (re-exported for convenience within the pipeline) */
export type Segment = LiturgicalSegment

/** Internal section representation during the build process */
export interface Section {
  id: string
  title: string
  titleMn: string
  level: number      // 1=root, 2=part, 3=week/season, 4=day, 5=hour, 6=psalm
  content: string    // raw text content (for leaf sections)
  segments?: Segment[]
  page?: number
  children: string[]
  liturgicalRole?: string
}

/** Raw section extracted from a week file before processing */
export interface RawSection {
  dayMn: string       // e.g. "Бямба"
  hourMn: string      // e.g. "орой"
  startLine: number
  endLine: number
  lines: string[]
}

/** A single step in a prayer flow sequence (build-time version) */
export interface PrayerFlowStepBuild {
  order: number
  liturgicalRole: string
  label: string
  labelMn: string
  source: 'psalter' | 'propers' | 'hymns' | 'fixed'
  sectionId?: string
  pageRef?: number
  isGap: boolean
}

/** A complete prayer flow for one hour of one day (build-time version) */
export interface PrayerFlowBuild {
  week: number
  day: string
  dayKo: string
  hour: 'morning' | 'evening'
  steps: PrayerFlowStepBuild[]
}

/** Template entry for prayer flow ordering */
export interface FlowTemplateEntry {
  role: string
  label: string
  labelMn: string
  source: 'psalter' | 'propers' | 'hymns' | 'fixed'
  pageRef?: number
}
