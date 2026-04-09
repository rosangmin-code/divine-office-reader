/**
 * Shared utility functions for the data pipeline.
 */

import * as fs from 'fs'

/** Convert a string to a URL-friendly slug (supports Cyrillic) */
export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\u0400-\u04ff]+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * Extract a descriptive subtitle from the section content.
 * Looks for psalm references, canticle names, readings, etc.
 * Searches up to first 20 non-empty lines for better coverage.
 */
export function extractSubtitle(lines: string[]): string {
  const psalmRe = /^(Дуулал\s+\d+[:\d\-,\s]*)/
  const canticleRe = /^(Магтаал|Шад магтаал|Хурганы хурим|Мариагийн магтаал|Симеоны магтаал|Захариасын магтаал)/
  const readingRe = /^(Уншлага|Хариу залбирал|Гуйлтын залбирал|Төгсгөлийн даатгал залбирал|Урих дуудлага)/
  const scriptureRe = /^(\d\s+\w+\s+\d+[:\d\-]+|Ром\s+\d+|Колоссай|Илчлэл|Эфэс|Филиппой)/

  // Check up to first 20 non-empty lines
  let checked = 0
  for (const line of lines) {
    const s = line.trim()
    if (!s) continue
    checked++
    if (checked > 20) break

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

/**
 * Classify a section's liturgical role from its subtitle.
 */
export function classifyLiturgicalRole(subtitle: string): string {
  if (!subtitle) return 'continuation'
  if (subtitle.startsWith('Дуулал')) return 'psalm'
  if (subtitle === 'Мариагийн магтаал' || subtitle === 'Захариасын магтаал' || subtitle === 'Симеоны магтаал') return 'gospel-canticle'
  if (subtitle === 'Магтаал' || subtitle === 'Шад магтаал' || subtitle === 'Хурганы хурим') return 'canticle'
  if (subtitle === 'Уншлага') return 'reading'
  if (subtitle === 'Хариу залбирал') return 'responsory'
  if (subtitle === 'Гуйлтын залбирал') return 'intercessions'
  if (subtitle === 'Төгсгөлийн даатгал залбирал') return 'concluding'
  if (subtitle === 'Урих дуудлага') return 'invitatory'
  return 'continuation'
}

/** Read a file synchronously as UTF-8 text */
export function readFile(filePath: string): string {
  return fs.readFileSync(filePath, 'utf-8')
}
