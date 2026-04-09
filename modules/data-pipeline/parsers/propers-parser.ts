/**
 * Parse propers (seasonal proper texts) file and build section hierarchy.
 */

import * as path from 'path'
import type { Section } from '../types'
import { readFile, slugify } from '../utils/helpers'
import { cleanContent } from '../transforms/content-cleaner'
import { segmentContent } from '../transforms/segmenter'

/** Build structured sections from the propers file */
export function buildPropersSections(sourceDir: string): { sections: Map<string, Section>, rootChildren: string[] } {
  const filePath = path.join(sourceDir, 'propers', 'propers_final.txt')
  const text = readFile(filePath)
  const allLines = text.split('\n')

  const sections = new Map<string, Section>()
  const rootChildren: string[] = []

  // P0-2 + P1-1: Precise season headers (first occurrence only per season)
  const seasonDefs: { pattern: RegExp, id: string, title: string, titleMn: string }[] = [
    { pattern: /^ИРЭЛТИЙН ЦАГ УЛИРАЛ$/, id: 'propers-advent', title: '대림', titleMn: 'Ирэлтийн цаг улирал' },
    { pattern: /^ЭЗЭНИЙ МЭНДЛЭЛТИЙН ЦАГ УЛИРАЛ$/, id: 'propers-christmas', title: '성탄', titleMn: 'Эзэний мэндлэлтийн цаг улирал' },
    { pattern: /^ДӨЧИН ХОНОГИЙН ЦАГ УЛИРАЛ$/, id: 'propers-lent', title: '사순', titleMn: 'Дөчин хоногийн цаг улирал' },
    { pattern: /^(ДЭЭГҮҮР ӨНГӨРӨХ ЦАГ УЛИРАЛ|АМИЛАЛТЫН ЦАГ УЛИРАЛ)$/, id: 'propers-easter', title: '부활', titleMn: 'Амилалтын цаг улирал' },
    { pattern: /^ЖИРИЙН ЦАГ УЛИРАЛ ДАХЬ$/, id: 'propers-ordinary', title: '연중', titleMn: 'Жирийн цаг улирал' },
    { pattern: /^ГЭГЭЭНТНҮҮДИЙН$/, id: 'propers-saints', title: '성인축일', titleMn: 'Гэгээнтнүүдийн' },
  ]

  // Sub-section headers within seasons: weekdays, Sundays, feasts
  const sundayRe = /^(НЯМ ГАРАГ|ДАВАА ГАРАГ|МЯГМАР ГАРАГ|ЛХАГВА ГАРАГ|ПҮРЭВ ГАРАГ|БААСАН ГАРАГ|БЯМБА ГАРАГ|.*ДАХЬ НЯМ ГАРАГ|.*ДАХ НЯМ ГАРАГ|.*ДЭХ НЯМ ГАРАГ|.*ДЭХ ДОЛОО ХОНОГ|ЭЗЭНИЙ .*|АРИУН .*|ПЭНТИКОСТ|ГУРВАН ХОНОГ|ТЭНГЭРБУРХАНЫ .*|ТУЙЛЫН .*|ХРИСТИЙН .*|.*ДОЛОО ХОНОГУУД|.*ГЭГЭЭНТНИЙ|.*ГЭГЭЭНТНҮҮД|ХАМАГ ГЭГЭЭНТНҮҮД|.*БАПТИСТ.*)$/

  // Step 1: Find season boundaries
  const seasonBounds: { idx: number, id: string, title: string, titleMn: string }[] = []
  const foundSeasons = new Set<string>()

  for (let i = 0; i < allLines.length; i++) {
    const line = allLines[i].trim()
    for (const sd of seasonDefs) {
      if (!foundSeasons.has(sd.id) && sd.pattern.test(line)) {
        seasonBounds.push({ idx: i, ...sd })
        foundSeasons.add(sd.id)
        break
      }
    }
  }
  seasonBounds.sort((a, b) => a.idx - b.idx)

  // Step 2: For each season, find Sunday/feast sub-boundaries
  for (let si = 0; si < seasonBounds.length; si++) {
    const season = seasonBounds[si]
    const seasonEnd = si + 1 < seasonBounds.length ? seasonBounds[si + 1].idx : allLines.length
    const seasonLines = allLines.slice(season.idx, seasonEnd)

    // Find sub-section headers within this season
    const subBounds: { offset: number, titleMn: string }[] = []
    for (let j = 1; j < seasonLines.length; j++) {
      const line = seasonLines[j].trim()
      if (sundayRe.test(line) && line.length > 3 && line.length < 80) {
        subBounds.push({ offset: j, titleMn: line })
      }
    }

    if (subBounds.length === 0) {
      // No sub-divisions: keep as single leaf
      const content = cleanContent(seasonLines)
      sections.set(season.id, {
        id: season.id,
        title: season.title,
        titleMn: season.titleMn,
        level: 4,
        content,
        segments: segmentContent(content),
        children: [],
      })
      rootChildren.push(season.id)
    } else {
      // Create season container + sub-leaves
      const subIds: string[] = []

      // Intro content before first sub-boundary
      if (subBounds[0].offset > 3) {
        const introId = `${season.id}-intro`
        const introContent = cleanContent(seasonLines.slice(0, subBounds[0].offset))
        sections.set(introId, {
          id: introId,
          title: `${season.title} 안내`,
          titleMn: `${season.titleMn} — танилцуулга`,
          level: 5,
          content: introContent,
          segments: segmentContent(introContent),
          children: [],
        })
        subIds.push(introId)
      }

      for (let k = 0; k < subBounds.length; k++) {
        const sub = subBounds[k]
        const subEnd = k + 1 < subBounds.length ? subBounds[k + 1].offset : seasonLines.length
        const subContent = cleanContent(seasonLines.slice(sub.offset, subEnd))
        const subSlug = slugify(sub.titleMn).substring(0, 40)
        const subId = `${season.id}-${subSlug}`

        // Korean title mapping for common patterns
        let koTitle = sub.titleMn
        const sundayMatch = sub.titleMn.match(/(.+)\s+ДАХЬ НЯМ ГАРАГ/)
        if (sundayMatch) koTitle = `${sundayMatch[1]} 주일`

        sections.set(subId, {
          id: subId,
          title: koTitle,
          titleMn: sub.titleMn,
          level: 5,
          content: subContent,
          segments: segmentContent(subContent),
          children: [],
        })
        subIds.push(subId)
      }

      // Season container
      sections.set(season.id, {
        id: season.id,
        title: season.title,
        titleMn: season.titleMn,
        level: 4,
        content: '',
        children: subIds,
      })
      rootChildren.push(season.id)
    }
  }

  // Add intro if content before first season
  if (seasonBounds.length > 0 && seasonBounds[0].idx > 5) {
    const introId = 'propers-intro'
    const introContent = cleanContent(allLines.slice(0, seasonBounds[0].idx))
    sections.set(introId, {
      id: introId,
      title: '안내',
      titleMn: 'Танилцуулга',
      level: 4,
      content: introContent,
      segments: segmentContent(introContent),
      children: [],
    })
    rootChildren.unshift(introId)
  }

  return { sections, rootChildren }
}
