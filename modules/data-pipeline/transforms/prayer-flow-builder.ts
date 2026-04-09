/**
 * Build prayer flow manifests mapping liturgical order to content sections.
 */

import type { Section, PrayerFlowBuild, PrayerFlowStepBuild, FlowTemplateEntry } from '../types'
import { slugify } from '../utils/helpers'

// --- Day name mappings ---

const DAY_NAMES_KO: Record<string, string> = {
  'Ням': '일요일',
  'Даваа': '월요일',
  'Мягмар': '화요일',
  'Лхагва': '수요일',
  'Пүрэв': '목요일',
  'Баасан': '금요일',
  'Бямба': '토요일',
}

// --- Template orders ---

export const MORNING_ORDER: FlowTemplateEntry[] = [
  { role: 'opening', label: '시작 기원', labelMn: 'Эхлэл', source: 'fixed', pageRef: 44 },
  { role: 'invitatory', label: '초대찬미 (시편 95)', labelMn: 'Урих дуудлага (Дуулал 95)', source: 'psalter', pageRef: 28 },
  { role: 'hymn', label: '찬미가', labelMn: 'Магтуу', source: 'hymns' },
  { role: 'psalm', label: '시편 1', labelMn: 'Дуулал 1', source: 'psalter' },
  { role: 'canticle', label: '구약 찬가', labelMn: 'Магтаал', source: 'psalter' },
  { role: 'psalm-2', label: '시편 2', labelMn: 'Дуулал 2', source: 'psalter' },
  { role: 'reading', label: '짧은 독서', labelMn: 'Уншлага', source: 'propers' },
  { role: 'responsory', label: '짧은 응답송', labelMn: 'Хариу залбирал', source: 'propers' },
  { role: 'gospel-canticle', label: '베네딕투스 (복음 찬가)', labelMn: 'Захариасын магтаал', source: 'psalter' },
  { role: 'intercessions', label: '청원 기도', labelMn: 'Гуйлтын залбирал', source: 'psalter' },
  { role: 'our-father', label: '주님의 기도', labelMn: 'Тэнгэр дэх Эцэг минь ээ...', source: 'fixed' },
  { role: 'concluding', label: '마침 기도', labelMn: 'Төгсгөлийн даатгал залбирал', source: 'propers' },
  { role: 'dismissal', label: '파견', labelMn: 'Төгсгөл', source: 'fixed', pageRef: 44 },
]

export const EVENING_ORDER: FlowTemplateEntry[] = [
  { role: 'opening', label: '시작 기원', labelMn: 'Эхлэл', source: 'fixed', pageRef: 38 },
  { role: 'hymn', label: '찬미가', labelMn: 'Магтуу', source: 'hymns' },
  { role: 'psalm', label: '시편 1', labelMn: 'Дуулал 1', source: 'psalter' },
  { role: 'psalm-2', label: '시편 2', labelMn: 'Дуулал 2', source: 'psalter' },
  { role: 'canticle', label: '신약 찬가', labelMn: 'Шад магтаал', source: 'psalter' },
  { role: 'reading', label: '짧은 독서', labelMn: 'Уншлага', source: 'propers' },
  { role: 'responsory', label: '짧은 응답송', labelMn: 'Хариу залбирал', source: 'propers' },
  { role: 'gospel-canticle', label: '마니피캇 (복음 찬가)', labelMn: 'Мариагийн магтаал', source: 'psalter' },
  { role: 'intercessions', label: '청원 기도', labelMn: 'Гуйлтын залбирал', source: 'psalter' },
  { role: 'our-father', label: '주님의 기도', labelMn: 'Тэнгэр дэх Эцэг минь ээ...', source: 'fixed' },
  { role: 'concluding', label: '마침 기도', labelMn: 'Төгсгөлийн даатгал залбирал', source: 'propers' },
  { role: 'dismissal', label: '파견', labelMn: 'Төгсгөл', source: 'fixed', pageRef: 38 },
]

/** Build prayer flow manifests for all weeks/days/hours */
export function buildPrayerFlow(allSections: Map<string, Section>): PrayerFlowBuild[] {
  const flows: PrayerFlowBuild[] = []
  const dayKeys = ['Бямба', 'Ням', 'Даваа', 'Мягмар', 'Лхагва', 'Пүрэв', 'Баасан']
  const hours: ('morning' | 'evening')[] = ['morning', 'evening']
  const hourMnMap = { morning: 'өглөө', evening: 'орой' }

  for (let w = 1; w <= 4; w++) {
    for (const dayMn of dayKeys) {
      for (const hour of hours) {
        const hourMn = hourMnMap[hour]
        const daySlug = slugify(dayMn)

        // Collect all psalter sections for this week/day/hour
        const prefix = `week${w}-${daySlug}-${slugify(hourMn)}`
        const psalterSections: Section[] = []
        for (const [id, section] of allSections) {
          if (id.startsWith(prefix) && section.level === 5) {
            psalterSections.push(section)
          }
        }

        if (psalterSections.length === 0) continue

        const template = hour === 'morning' ? MORNING_ORDER : EVENING_ORDER
        const steps: PrayerFlowStepBuild[] = []
        let order = 0

        // Track which psalter sections have been assigned
        const assigned = new Set<string>()

        // For each template step, try to find a matching psalter section
        let psalmCount = 0
        for (const tmpl of template) {
          order++
          const step: PrayerFlowStepBuild = {
            order,
            liturgicalRole: tmpl.role,
            label: tmpl.label,
            labelMn: tmpl.labelMn,
            source: tmpl.source,
            isGap: false,
          }

          if (tmpl.source === 'fixed') {
            step.isGap = true
            if (tmpl.pageRef) step.pageRef = tmpl.pageRef
          } else if (tmpl.source === 'hymns') {
            // Hymn: no specific section, user must choose
            step.isGap = false
          } else if (tmpl.source === 'propers') {
            // Propers: season-dependent, no fixed section
            step.isGap = false
          } else if (tmpl.source === 'psalter') {
            // Try to find matching psalter section by liturgical role
            const targetRole = tmpl.role === 'psalm-2' ? 'psalm' : tmpl.role
            let matched: Section | undefined

            if (tmpl.role === 'psalm' || tmpl.role === 'psalm-2') {
              // Find nth unassigned psalm
              psalmCount++
              let found = 0
              for (const s of psalterSections) {
                if (!assigned.has(s.id) && s.liturgicalRole === 'psalm') {
                  found++
                  if (found === (tmpl.role === 'psalm' ? 1 : 1)) {
                    matched = s
                    break
                  }
                }
              }
            } else {
              // Find first unassigned section with matching role
              matched = psalterSections.find(s => !assigned.has(s.id) && s.liturgicalRole === targetRole)
            }

            if (matched) {
              step.sectionId = matched.id
              step.label = matched.title
              step.labelMn = matched.titleMn
              assigned.add(matched.id)
            } else {
              // No matching psalter section found — might be in propers or missing
              step.isGap = tmpl.role === 'invitatory' // invitatory often referenced by page
              if (tmpl.pageRef) step.pageRef = tmpl.pageRef
            }
          }

          steps.push(step)
        }

        // Add any unassigned psalter sections as 'continuation' steps
        for (const s of psalterSections) {
          if (!assigned.has(s.id)) {
            order++
            steps.push({
              order,
              liturgicalRole: s.liturgicalRole || 'continuation',
              label: s.title,
              labelMn: s.titleMn,
              source: 'psalter',
              sectionId: s.id,
              isGap: false,
            })
          }
        }

        flows.push({
          week: w,
          day: dayMn,
          dayKo: DAY_NAMES_KO[dayMn] || dayMn,
          hour,
          steps,
        })
      }
    }
  }

  return flows
}
