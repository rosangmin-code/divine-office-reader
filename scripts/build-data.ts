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
  // P0-1: Enhanced content normalization
  const weekHeaderRe = /^\d\s*д[үуУ]г[аэАЭ]+р\s+долоо\s+хоног$/i
  const pageNumRe = /^\d{1,4}$/
  // Pattern: \f + page number + tabs + week header (embedded page breaks)
  const embeddedPageBreakRe = /^\f?\d{1,4}\s*\t/
  // Pattern: "52  1 дүгээр долоо хоног" — page number + spaces + week header combined
  const pageHeaderComboRe = /^\d{1,4}\s{2,}\d\s*д[үуУ]г/i

  return lines
    .map(line => line.replace(/\f/g, '').replace(/\t+/g, ' '))  // strip \f and \t
    .filter(line => {
      const s = line.trim()
      if (!s) return true
      if (pageNumRe.test(s) && parseInt(s) >= 49) return false
      if (weekHeaderRe.test(s)) return false
      if (embeddedPageBreakRe.test(s)) return false
      if (pageHeaderComboRe.test(s)) return false
      return true
    })
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
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
        children: [],
      })
      rootChildren.push(season.id)
    } else {
      // Create season container + sub-leaves
      const subIds: string[] = []

      // Intro content before first sub-boundary
      if (subBounds[0].offset > 3) {
        const introId = `${season.id}-intro`
        sections.set(introId, {
          id: introId,
          title: `${season.title} 안내`,
          titleMn: `${season.titleMn} — танилцуулга`,
          level: 5,
          content: cleanContent(seasonLines.slice(0, subBounds[0].offset)),
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
    sections.set(introId, {
      id: introId,
      title: '안내',
      titleMn: 'Танилцуулга',
      level: 4,
      content: cleanContent(allLines.slice(0, seasonBounds[0].idx)),
      children: [],
    })
    rootChildren.unshift(introId)
  }

  return { sections, rootChildren }
}

function buildHymnsSections(): { sections: Map<string, Section>, rootChildren: string[] } {
  // P0-3: Use hymns_final.txt instead of hymns_full.txt
  const filePath = path.join(SOURCE, 'hymns', 'hymns_final.txt')
  const text = readFile(filePath)
  const allLines = text.split('\n')

  const sections = new Map<string, Section>()
  const rootChildren: string[] = []

  // Hymn start pattern: "42. Есүс хамгийн нандин нэр юм аа"
  const hymnStartRe = /^(\d+)\.\s+(.+)$/

  // Find ALL "N. Title" lines, then keep only the occurrence with real lyrics
  // The file has an INDEX region (just titles) and a LYRICS region (actual content).
  // In the index, content between entries is minimal. In lyrics, it's substantial.
  const allMatches: { idx: number, num: number, title: string }[] = []
  for (let i = 0; i < allLines.length; i++) {
    const line = allLines[i].trim()
    const m = line.match(hymnStartRe)
    if (m) {
      allMatches.push({ idx: i, num: parseInt(m[1]), title: m[2] })
    }
  }

  // For each hymn number, pick the occurrence with the most content after it
  const byNum = new Map<number, { idx: number, title: string, contentLen: number }[]>()
  for (let h = 0; h < allMatches.length; h++) {
    const start = allMatches[h]
    const endIdx = h + 1 < allMatches.length ? allMatches[h + 1].idx : allLines.length
    const bodyLines = allLines.slice(start.idx + 1, endIdx)
    const content = cleanContent(bodyLines)
    if (!byNum.has(start.num)) byNum.set(start.num, [])
    byNum.get(start.num)!.push({ idx: start.idx, title: start.title, contentLen: content.length })
  }

  // Pick the occurrence with the longest content for each number
  const bestMatches: { idx: number, num: number, title: string }[] = []
  for (const [num, occurrences] of byNum) {
    const best = occurrences.reduce((a, b) => a.contentLen > b.contentLen ? a : b)
    if (best.contentLen >= 30) { // skip entries with too little content
      bestMatches.push({ idx: best.idx, num, title: best.title })
    }
  }
  bestMatches.sort((a, b) => a.idx - b.idx)

  // Build next-boundary map for bestMatches
  // We need to find the end of each hymn: the start of the next bestMatch entry
  const bestIdxSet = new Set(bestMatches.map(m => m.idx))
  // For end boundary, find the next "N. Title" line (from allMatches) that is also a bestMatch
  if (bestMatches.length === 0) {
    const id = 'hymns-all'
    sections.set(id, {
      id, title: '찬미가', titleMn: 'Магтуу',
      level: 3, content: cleanContent(allLines), children: [],
    })
    rootChildren.push(id)
  } else {
    for (let h = 0; h < bestMatches.length; h++) {
      const start = bestMatches[h]
      const endIdx = h + 1 < bestMatches.length ? bestMatches[h + 1].idx : allLines.length
      const bodyLines = allLines.slice(start.idx + 1, endIdx)
      const content = cleanContent(bodyLines)

      if (content.length < 30) continue

      const id = `hymns-${start.num}`
      sections.set(id, {
        id,
        title: `${start.num}. ${start.title}`,
        titleMn: start.title,
        level: 4,
        content,
        children: [],
      })
      rootChildren.push(id)
    }
  }

  return { sections, rootChildren }
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

  // P2-1: Build QA
  validateOutput(contentObj)
}

// P2-1: Build-time QA validation
function validateOutput(contentObj: Record<string, { content: string; titleMn: string }>) {
  const errors: string[] = []
  let formFeedCount = 0
  let tabCount = 0

  for (const [id, section] of Object.entries(contentObj)) {
    if (section.content.includes('\f')) {
      formFeedCount++
      if (formFeedCount <= 3) errors.push(`  T-CLEAN-01: \\f in ${id}`)
    }
    if (section.content.includes('\t')) {
      tabCount++
      if (tabCount <= 3) errors.push(`  T-CLEAN-02: \\t in ${id}`)
    }
    if (!section.titleMn) errors.push(`  T-STRUCT-07: empty titleMn in ${id}`)
  }

  if (formFeedCount > 0) errors.unshift(`  T-CLEAN-01 TOTAL: ${formFeedCount} sections contain \\f`)
  if (tabCount > 0) errors.unshift(`  T-CLEAN-02 TOTAL: ${tabCount} sections contain \\t`)

  if (errors.length > 0) {
    console.warn('\n⚠️  Build QA warnings:')
    errors.forEach(e => console.warn(e))
  } else {
    console.log('✅ Build QA: all checks passed')
  }
}

buildAll()
