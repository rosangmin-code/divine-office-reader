/**
 * Parse hymns file and build section hierarchy.
 */

import * as path from 'path'
import type { Section } from '../types'
import { readFile } from '../utils/helpers'
import { cleanContent } from '../transforms/content-cleaner'
import { segmentContent } from '../transforms/segmenter'

/** Build structured sections from the hymns file */
export function buildHymnsSections(sourceDir: string): { sections: Map<string, Section>, rootChildren: string[] } {
  // P0-3: Use hymns_final.txt instead of hymns_full.txt
  const filePath = path.join(sourceDir, 'hymns', 'hymns_final.txt')
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
  if (bestMatches.length === 0) {
    const id = 'hymns-all'
    const allContent = cleanContent(allLines)
    sections.set(id, {
      id, title: '찬미가', titleMn: 'Магтуу',
      level: 3, content: allContent, segments: segmentContent(allContent), children: [],
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
        segments: segmentContent(content),
        children: [],
      })
      rootChildren.push(id)
    }
  }

  return { sections, rootChildren }
}
