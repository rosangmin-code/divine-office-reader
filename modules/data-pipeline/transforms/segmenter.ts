/**
 * Content segmentation: classify lines into typed liturgical segments.
 */

import type { Segment } from '../types'

/**
 * Segment cleaned content into typed liturgical segments.
 * Each line is classified by pattern matching, then consecutive
 * segments of the same type are merged.
 */
export function segmentContent(text: string): Segment[] {
  const lines = text.split('\n')

  // Redundant day header (already in titleMn)
  const dayHeaderRe = /^(Ням|Даваа|Мягмар|Лхагва|Пүрэв|Баасан|Бямба)\s+гарагийн\s+(өглөө|орой|оройн)/

  // Section markers (exact match)
  const sectionMarkers = new Set([
    'Уншлага', 'Хариу залбирал', 'Гуйлтын залбирал',
    'Төгсгөлийн даатгал залбирал', 'Урих дуудлага',
    'Дууллыг төгсгөх залбирал', 'Өглөөний даатгал залбирал',
    'Шад дуулал', 'Магтаал', 'Шад магтаал',
    'Мариагийн магтаал', 'Захариасын магтаал', 'Симеоны магтаал',
  ])

  const psalmRefRe = /^Дуулал\s+\d+[:\d\-,\s]*/
  const scriptureRefRe = /^(\d\s+)?(Ром|Илчлэл|Эфэс|Колоссай|Филиппой|Тимот|Еврей|Коринт|Тесалоник|Петр|Галат|Иохан)\s+\d+[:\d\-,\s]*$/
  const doxologyRe = /^Эцэг,?\s+Хүү,?\s+Ариун Сүнсэнд?\s+жавхланг/
  const responseRe = /^-\s+/
  const rubricPatterns = [
    /^Өөр нэг заавар/,
    /бичигдээгүй бол/,
    /үл уншина/,
    /дэг жаягийн дагуу/,
    /уншина$/,
    /^Хэрэв .+ бол$/,
  ]
  const seasonalNoteRe = /^(Ирэлтийн цаг улирал|Дөчин хоногийн цаг улирл|Амилалтын цаг улирл|Эзэний мэндлэлтийн цаг улирл)/

  const raw: Segment[] = []
  let lastPsalmRef = false

  for (const line of lines) {
    const s = line.trim()

    if (!s) {
      if (raw.length > 0 && raw[raw.length - 1].type === 'body') {
        raw[raw.length - 1].text += '\n'
      }
      lastPsalmRef = false
      continue
    }

    // 1. Skip redundant day headers
    if (dayHeaderRe.test(s)) { continue }

    // 2. Section markers
    if (sectionMarkers.has(s)) {
      raw.push({ type: 'section-marker', text: s })
      lastPsalmRef = false
      continue
    }

    // 3. Psalm reference
    if (psalmRefRe.test(s)) {
      raw.push({ type: 'psalm-ref', text: s })
      lastPsalmRef = true
      continue
    }

    // 4. Scripture reference (standalone)
    if (scriptureRefRe.test(s)) {
      raw.push({ type: 'scripture-ref', text: s })
      lastPsalmRef = false
      continue
    }

    // 5. Doxology
    if (doxologyRe.test(s)) {
      raw.push({ type: 'doxology', text: s })
      lastPsalmRef = false
      continue
    }

    // 6. Response line
    if (responseRe.test(s)) {
      raw.push({ type: 'response', text: s.replace(responseRe, '') })
      lastPsalmRef = false
      continue
    }

    // 7. Rubric
    if (rubricPatterns.some(re => re.test(s))) {
      raw.push({ type: 'rubric', text: s })
      lastPsalmRef = false
      continue
    }

    // 8. Seasonal note
    if (seasonalNoteRe.test(s) && s.includes(':')) {
      raw.push({ type: 'seasonal-note', text: s })
      lastPsalmRef = false
      continue
    }

    // 9. Subtitle (first descriptive line after psalm-ref)
    if (lastPsalmRef && !s.startsWith('(') && s.length < 80) {
      raw.push({ type: 'subtitle', text: s })
      lastPsalmRef = false
      continue
    }

    // 10. Default: body
    raw.push({ type: 'body', text: s })
    lastPsalmRef = false
  }

  // Merge consecutive segments of the same type
  const merged: Segment[] = []
  for (const seg of raw) {
    if (merged.length > 0 && merged[merged.length - 1].type === seg.type) {
      merged[merged.length - 1].text += '\n' + seg.text
    } else {
      merged.push({ ...seg })
    }
  }

  // Clean up whitespace
  for (const seg of merged) {
    seg.text = seg.text.replace(/^\n+|\n+$/g, '').replace(/\n{3,}/g, '\n\n')
  }

  return merged.filter(seg => seg.text.trim().length > 0)
}
