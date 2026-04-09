/**
 * Parse week files and build week section hierarchies.
 */

import * as path from 'path'
import type { Section, RawSection, Segment } from '../types'
import { readFile, slugify, extractSubtitle, classifyLiturgicalRole } from '../utils/helpers'
import { cleanContent, extractPageNumber } from '../transforms/content-cleaner'
import { segmentContent } from '../transforms/segmenter'

// --- Name mappings ---

const DAY_NAMES_MN: Record<string, string> = {
  'Ням': 'Ням гараг',
  'Даваа': 'Даваа гараг',
  'Мягмар': 'Мягмар гараг',
  'Лхагва': 'Лхагва гараг',
  'Пүрэв': 'Пүрэв гараг',
  'Баасан': 'Баасан гараг',
  'Бямба': 'Бямба гараг',
}

const DAY_NAMES_KO: Record<string, string> = {
  'Ням': '일요일',
  'Даваа': '월요일',
  'Мягмар': '화요일',
  'Лхагва': '수요일',
  'Пүрэв': '목요일',
  'Баасан': '금요일',
  'Бямба': '토요일',
}

const HOUR_KO: Record<string, string> = {
  'өглөө': '아침기도',
  'орой': '저녁기도',
  'оройн': '저녁기도',
}

/** Parse a week file into raw day/hour sections */
export function parseWeekFile(filePath: string): RawSection[] {
  const text = readFile(filePath)
  const allLines = text.split('\n')

  // Match day+hour headers: "Бямба гарагийн орой", "Ням гарагийн өглөө" etc
  const headerRe = /^(Ням|Даваа|Мягмар|Лхагва|Пүрэв|Баасан|Бямба)\s+гарагийн\s+(өглөө|орой|оройн)/

  const sections: RawSection[] = []
  let currentSection: { dayMn: string; hourMn: string; startLine: number } | null = null

  for (let i = 0; i < allLines.length; i++) {
    const line = allLines[i].trim()
    const match = line.match(headerRe)

    if (match) {
      // Close previous section
      if (currentSection) {
        sections.push({
          ...currentSection,
          endLine: i,
          lines: allLines.slice(currentSection.startLine, i),
        })
      }
      currentSection = {
        dayMn: match[1],
        hourMn: match[2],
        startLine: i,
      }
    }
  }

  // Close last section
  if (currentSection) {
    sections.push({
      ...currentSection,
      endLine: allLines.length,
      lines: allLines.slice(currentSection.startLine),
    })
  }

  return sections
}

/** Build structured sections for a given week number */
export function buildWeekSections(weekNum: number, sourceDir: string): { sections: Map<string, Section>, rootChildren: string[] } {
  const filePath = path.join(sourceDir, `week${weekNum}`, `week${weekNum}_final.txt`)
  const rawSections = parseWeekFile(filePath)

  const sections = new Map<string, Section>()
  const dayGroups = new Map<string, { dayMn: string, hours: { hourMn: string, id: string }[] }>()

  // Group by day, maintaining order
  const dayOrder: string[] = []
  let sectionCounter = 0

  for (const raw of rawSections) {
    sectionCounter++
    const hourLabel = HOUR_KO[raw.hourMn] || raw.hourMn
    const dayLabel = DAY_NAMES_KO[raw.dayMn] || raw.dayMn

    const sectionId = `week${weekNum}-${slugify(raw.dayMn)}-${slugify(raw.hourMn)}-${sectionCounter}`
    const content = cleanContent(raw.lines)
    const page = extractPageNumber(raw.lines)
    const subtitle = extractSubtitle(raw.lines)
    const fullTitle = subtitle ? `${hourLabel} — ${subtitle}` : `${hourLabel}`
    const fullTitleMn = subtitle ? `${raw.dayMn} гарагийн ${raw.hourMn === 'оройн' ? 'орой' : raw.hourMn} — ${subtitle}` : `${raw.dayMn} гарагийн ${raw.hourMn === 'оройн' ? 'орой' : raw.hourMn}`

    const liturgicalRole = classifyLiturgicalRole(subtitle)

    const segments = segmentContent(content)

    sections.set(sectionId, {
      id: sectionId,
      title: fullTitle,
      titleMn: fullTitleMn,
      level: 5,
      content,
      segments,
      page,
      children: [],
      liturgicalRole,
    })

    const dayKey = raw.dayMn
    if (!dayGroups.has(dayKey)) {
      dayGroups.set(dayKey, { dayMn: raw.dayMn, hours: [] })
      dayOrder.push(dayKey)
    }
    dayGroups.get(dayKey)!.hours.push({ hourMn: raw.hourMn, id: sectionId })
  }

  // Create day-level sections
  const rootChildren: string[] = []

  for (const dayKey of dayOrder) {
    const group = dayGroups.get(dayKey)!
    const dayId = `week${weekNum}-${slugify(group.dayMn)}`

    // Check if already exists (e.g., multiple Saturday sections)
    if (sections.has(dayId)) {
      // Append hours to existing day
      const existing = sections.get(dayId)!
      for (const hour of group.hours) {
        if (!existing.children.includes(hour.id)) {
          existing.children.push(hour.id)
        }
      }
    } else {
      const daySection: Section = {
        id: dayId,
        title: DAY_NAMES_KO[group.dayMn] || group.dayMn,
        titleMn: DAY_NAMES_MN[group.dayMn] || group.dayMn,
        level: 4,
        content: '',
        children: group.hours.map(h => h.id),
      }
      sections.set(dayId, daySection)
      rootChildren.push(dayId)
    }
  }

  return { sections, rootChildren }
}
