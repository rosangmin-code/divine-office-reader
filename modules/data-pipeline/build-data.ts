/**
 * Build structured JSON data from parsed text files.
 *
 * Source: ../source-data/ (symlink to divine office/parsed_data/)
 * Output: ../public/data/content.json, ../public/data/bookmarks.json
 *
 * This is the main orchestrator that imports from sub-modules.
 */

import * as fs from 'fs'
import * as path from 'path'

import type { Section, Segment } from './types'
import { buildWeekSections } from './parsers/week-parser'
import { buildPropersSections } from './parsers/propers-parser'
import { buildHymnsSections } from './parsers/hymns-parser'
import { buildPrayerFlow } from './transforms/prayer-flow-builder'
import { validateOutput } from './utils/validator'

import type { BookmarkNode } from '@/modules/shared'

// --- Config ---

const SOURCE = path.resolve(process.env.DIVINE_OFFICE_SOURCE || path.join(__dirname, '..', '..', 'source-data'))
const OUT = path.join(process.cwd(), 'public', 'data')

// --- Main Build ---

function buildAll() {
  const allSections = new Map<string, Section>()
  const bookmarkTree: BookmarkNode[] = []

  // --- Psalter (4 weeks) ---
  const psalterChildren: string[] = []

  for (let w = 1; w <= 4; w++) {
    const weekId = `week${w}`
    const { sections, rootChildren } = buildWeekSections(w, SOURCE)

    // Add week container
    allSections.set(weekId, {
      id: weekId,
      title: `${w}주차`,
      titleMn: `${w} д${w === 2 ? 'угаар' : 'үгээр'} долоо хоног`,
      level: 3,
      content: '',
      children: rootChildren,
    })

    sections.forEach((v, k) => allSections.set(k, v))
    psalterChildren.push(weekId)
  }

  const psalterId = 'psalter'
  allSections.set(psalterId, {
    id: psalterId,
    title: '4주 시편집',
    titleMn: 'Дуулал номын дөрвөн долоо хоног',
    level: 2,
    content: '',
    children: psalterChildren,
  })

  // --- Propers ---
  const propersParentId = 'propers'
  const { sections: propersSections, rootChildren: propersChildren } = buildPropersSections(SOURCE)

  allSections.set(propersParentId, {
    id: propersParentId,
    title: '시기별 고유문',
    titleMn: 'Цаг улирлын онцлог шинж',
    level: 2,
    content: '',
    children: propersChildren,
  })
  propersSections.forEach((v, k) => allSections.set(k, v))

  // --- Hymns ---
  const hymnsParentId = 'hymns'
  const { sections: hymnsSections, rootChildren: hymnsChildren } = buildHymnsSections(SOURCE)

  allSections.set(hymnsParentId, {
    id: hymnsParentId,
    title: '찬미가',
    titleMn: 'Магтуу',
    level: 2,
    content: '',
    children: hymnsChildren,
  })
  hymnsSections.forEach((v, k) => allSections.set(k, v))

  // --- Root ---
  const rootId = 'root'
  allSections.set(rootId, {
    id: rootId,
    title: '성무일도',
    titleMn: 'Залбиралт цагийн ёслол',
    level: 1,
    content: '',
    children: [psalterId, propersParentId, hymnsParentId],
  })

  // --- Build bookmark tree ---
  function buildTree(sectionId: string): BookmarkNode {
    const section = allSections.get(sectionId)!
    return {
      id: section.id,
      title: section.title,
      titleMn: section.titleMn,
      children: section.children.map(buildTree),
    }
  }

  const rootBookmark = buildTree(rootId)

  // --- Write output ---
  fs.mkdirSync(OUT, { recursive: true })

  // Content: flat map of id -> section data
  const contentObj: Record<string, { title: string; titleMn: string; content: string; segments?: Segment[]; page?: number; level: number; liturgicalRole?: string }> = {}
  allSections.forEach((section) => {
    if (section.content || section.children.length === 0) {
      contentObj[section.id] = {
        title: section.title,
        titleMn: section.titleMn,
        content: section.content,
        ...(section.segments && section.segments.length > 0 ? { segments: section.segments } : {}),
        page: section.page,
        level: section.level,
        ...(section.liturgicalRole ? { liturgicalRole: section.liturgicalRole } : {}),
      }
    }
  })

  fs.writeFileSync(path.join(OUT, 'content.json'), JSON.stringify(contentObj, null, 0))
  fs.writeFileSync(path.join(OUT, 'bookmarks.json'), JSON.stringify(rootBookmark, null, 2))

  // --- Prayer Flow Manifest ---
  const prayerFlows = buildPrayerFlow(allSections)
  fs.writeFileSync(path.join(OUT, 'prayer-flow.json'), JSON.stringify(prayerFlows, null, 2))
  console.log(`  Prayer flows: ${prayerFlows.length} (4 weeks \u00d7 7 days \u00d7 2 hours)`)

  // --- Write split content files ---
  const groups: Record<string, Record<string, { title: string; titleMn: string; content: string; segments?: Segment[]; page?: number; level: number; liturgicalRole?: string }>> = {
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

  // Stats
  const leafSections = Object.keys(contentObj).length
  const totalChars = Object.values(contentObj).reduce((sum, s) => sum + s.content.length, 0)

  console.log(`Done!`)
  console.log(`  Total sections: ${allSections.size}`)
  console.log(`  Leaf sections (with content): ${leafSections}`)
  console.log(`  Total text characters: ${totalChars.toLocaleString()}`)
  console.log(`  Output: ${OUT}/content.json (${(fs.statSync(path.join(OUT, 'content.json')).size / 1024).toFixed(0)} KB)`)
  console.log(`  Output: ${OUT}/bookmarks.json`)

  // P2-1: Build QA
  validateOutput(contentObj)
}

buildAll()
