/**
 * Build structured JSON data from parsed text files.
 *
 * Source: ../source-data/ (symlink to divine office/parsed_data/)
 * Output: ../public/data/content.json, ../public/data/bookmarks.json
 */

import * as fs from 'fs'
import * as path from 'path'

// --- Types ---

interface Section {
  id: string
  title: string
  titleMn: string
  level: number      // 1=root, 2=part, 3=week/season, 4=day, 5=hour, 6=psalm
  content: string    // raw text content (for leaf sections)
  page?: number
  children: string[]
}

interface BookmarkNode {
  id: string
  title: string
  titleMn: string
  children: BookmarkNode[]
}

// --- Config ---

const SOURCE = path.resolve(process.env.DIVINE_OFFICE_SOURCE || path.join(__dirname, '..', 'source-data'))
const OUT = path.join(process.cwd(), 'public', 'data')

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

// --- Helpers ---

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\u0400-\u04ff]+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * Extract a descriptive subtitle from the section content.
 * Looks for psalm references, canticle names, readings, etc.
 */
function extractSubtitle(lines: string[]): string {
  const psalmRe = /^(Дуулал\s+\d+[:\d\-,\s]*)/
  const canticleRe = /^(Магтаал|Шад магтаал|Хурганы хурим|Мариагийн магтаал|Симеоны магтаал|Захариасын магтаал)/
  const readingRe = /^(Уншлага|Хариу залбирал|Гуйлтын залбирал|Төгсгөлийн даатгал залбирал|Урих дуудлага)/
  const scriptureRe = /^(\d\s+\w+\s+\d+[:\d\-]+|Ром\s+\d+|Колоссай|Илчлэл|Эфэс|Филиппой)/

  for (const line of lines) {
    const s = line.trim()
    const pm = s.match(psalmRe)
    if (pm) return pm[1].trim()
    const cm = s.match(canticleRe)
    if (cm) return cm[1].trim()
    const rm = s.match(readingRe)
    if (rm) return rm[1].trim()
    const sm = s.match(scriptureRe)
    if (sm) return sm[1].trim()
  }
  return ''
}

function readFile(filePath: string): string {
  return fs.readFileSync(filePath, 'utf-8')
}

// --- Parsing ---

interface RawSection {
  dayMn: string       // e.g. "Бямба"
  hourMn: string      // e.g. "орой"
  startLine: number
  endLine: number
  lines: string[]
}

function parseWeekFile(filePath: string): RawSection[] {
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

function cleanContent(lines: string[]): string {
  // Remove standalone page numbers and repeated week header lines
  const weekHeaderRe = /^\d\s*д[үу]г[аэ]+р\s+долоо\s+хоног$/
  const pageNumRe = /^\d{2,3}$/

  return lines
    .filter(line => {
      const s = line.trim()
      if (!s) return true // keep blank lines
      if (pageNumRe.test(s) && parseInt(s) >= 49 && parseInt(s) <= 900) return false
      if (weekHeaderRe.test(s)) return false
      return true
    })
    .join('\n')
    .replace(/\n{3,}/g, '\n\n') // collapse multiple blank lines
    .trim()
}

function extractPageNumber(lines: string[]): number | undefined {
  const pageNumRe = /^\d{2,3}$/
  for (const line of lines.slice(0, 10)) {
    const s = line.trim()
    if (pageNumRe.test(s) && parseInt(s) >= 49) {
      return parseInt(s)
    }
  }
  return undefined
}

// --- Main Build ---

function buildWeekSections(weekNum: number): { sections: Map<string, Section>, rootChildren: string[] } {
  const filePath = path.join(SOURCE, `week${weekNum}`, `week${weekNum}_final.txt`)
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

    sections.set(sectionId, {
      id: sectionId,
      title: fullTitle,
      titleMn: fullTitleMn,
      level: 5,
      content,
      page,
      children: [],
    })

    const dayKey = raw.dayMn
    if (!dayGroups.has(dayKey)) {
      dayGroups.set(dayKey, { dayMn: raw.dayMn, hours: [] })
      dayOrder.push(dayKey)
    }
    dayGroups.get(dayKey)!.hours.push({ hourMn: raw.hourMn, id: sectionId })
  }

  // Deduplicate day order: Sunday Vespers I (Saturday evening) comes before Sunday Morning
  // The parsed order from the file should already be correct

  // Create day-level sections
  const rootChildren: string[] = []

  for (const dayKey of dayOrder) {
    const group = dayGroups.get(dayKey)!
    // Skip if this day was already added with same key
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

function buildPropersSections(): { sections: Map<string, Section>, rootChildren: string[] } {
  const filePath = path.join(SOURCE, 'propers', 'propers_final.txt')
  const text = readFile(filePath)
  const allLines = text.split('\n')

  const sections = new Map<string, Section>()
  const rootChildren: string[] = []

  // Split propers by season headers
  const seasonPatterns: { pattern: RegExp, id: string, title: string, titleMn: string }[] = [
    { pattern: /ИРЭЛТИЙН ЦАГ УЛИРАЛ/, id: 'propers-advent', title: '대림', titleMn: 'Ирэлтийн цаг улирал' },
    { pattern: /ЭЗЭНИЙ МЭНДЭЛСНИЙ.*ЦАГ УЛИРАЛ|ЭЗЭНИЙ МЭНДЛЭЛТИЙН/, id: 'propers-christmas', title: '성탄', titleMn: 'Эзэний мэндлэлтийн цаг улирал' },
    { pattern: /ДӨЧИН ХОНОГИЙН ЦАГ УЛИРАЛ/, id: 'propers-lent', title: '사순', titleMn: 'Дөчин хоногийн цаг улирал' },
    { pattern: /АМИЛАЛТЫН ЦАГ УЛИРАЛ/, id: 'propers-easter', title: '부활', titleMn: 'Амилалтын цаг улирал' },
    { pattern: /ЖИРИЙН ЦАГ УЛИРАЛ|ЖИРИЙН ЦАГ/, id: 'propers-ordinary', title: '연중', titleMn: 'Жирийн цаг улирал' },
    { pattern: /ГЭГЭЭНТНҮҮДИЙН|ОНЦЛОГ ШИНЖ/, id: 'propers-saints', title: '성인축일', titleMn: 'Гэгээнтнүүдийн онцлог шинж' },
  ]

  // Find season boundaries
  const boundaries: { idx: number, id: string, title: string, titleMn: string }[] = []

  for (let i = 0; i < allLines.length; i++) {
    const line = allLines[i].trim().toUpperCase()
    for (const sp of seasonPatterns) {
      if (sp.pattern.test(line) && !boundaries.find(b => b.id === sp.id)) {
        boundaries.push({ idx: i, ...sp })
        break
      }
    }
  }

  // Sort by line index
  boundaries.sort((a, b) => a.idx - b.idx)

  // If no boundaries found, treat entire file as one section
  if (boundaries.length === 0) {
    const id = 'propers-all'
    sections.set(id, {
      id,
      title: '시기별 고유문',
      titleMn: 'Цаг улирлын онцлог шинж',
      level: 3,
      content: cleanContent(allLines),
      children: [],
    })
    rootChildren.push(id)
  } else {
    // Add intro section if content before first boundary
    if (boundaries[0].idx > 5) {
      const introId = 'propers-intro'
      sections.set(introId, {
        id: introId,
        title: '안내',
        titleMn: 'Танилцуулга',
        level: 4,
        content: cleanContent(allLines.slice(0, boundaries[0].idx)),
        children: [],
      })
      rootChildren.push(introId)
    }

    for (let i = 0; i < boundaries.length; i++) {
      const b = boundaries[i]
      const endIdx = i + 1 < boundaries.length ? boundaries[i + 1].idx : allLines.length
      const content = cleanContent(allLines.slice(b.idx, endIdx))

      sections.set(b.id, {
        id: b.id,
        title: b.title,
        titleMn: b.titleMn,
        level: 4,
        content,
        children: [],
      })
      rootChildren.push(b.id)
    }
  }

  return { sections, rootChildren }
}

function buildHymnsSections(): { sections: Map<string, Section>, rootChildren: string[] } {
  const filePath = path.join(SOURCE, 'hymns', 'hymns_full.txt')
  const text = readFile(filePath)
  const content = cleanContent(text.split('\n'))

  const sections = new Map<string, Section>()
  const id = 'hymns-all'

  sections.set(id, {
    id,
    title: '찬미가',
    titleMn: 'Магтуу',
    level: 3,
    content,
    children: [],
  })

  return { sections, rootChildren: [id] }
}

function buildAll() {
  const allSections = new Map<string, Section>()
  const bookmarkTree: BookmarkNode[] = []

  // --- Psalter (4 weeks) ---
  const psalterChildren: string[] = []

  for (let w = 1; w <= 4; w++) {
    const weekId = `week${w}`
    const { sections, rootChildren } = buildWeekSections(w)

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
  const { sections: propersSections, rootChildren: propersChildren } = buildPropersSections()

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
  const { sections: hymnsSections, rootChildren: hymnsChildren } = buildHymnsSections()

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
  const contentObj: Record<string, { title: string; titleMn: string; content: string; page?: number; level: number }> = {}
  allSections.forEach((section) => {
    if (section.content || section.children.length === 0) {
      contentObj[section.id] = {
        title: section.title,
        titleMn: section.titleMn,
        content: section.content,
        page: section.page,
        level: section.level,
      }
    }
  })

  fs.writeFileSync(path.join(OUT, 'content.json'), JSON.stringify(contentObj, null, 0))
  fs.writeFileSync(path.join(OUT, 'bookmarks.json'), JSON.stringify(rootBookmark, null, 2))

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

  // Stats
  const leafSections = Object.keys(contentObj).length
  const totalChars = Object.values(contentObj).reduce((sum, s) => sum + s.content.length, 0)

  console.log(`Done!`)
  console.log(`  Total sections: ${allSections.size}`)
  console.log(`  Leaf sections (with content): ${leafSections}`)
  console.log(`  Total text characters: ${totalChars.toLocaleString()}`)
  console.log(`  Output: ${OUT}/content.json (${(fs.statSync(path.join(OUT, 'content.json')).size / 1024).toFixed(0)} KB)`)
  console.log(`  Output: ${OUT}/bookmarks.json`)
}

buildAll()
