/**
 * Content cleaning and page number extraction.
 */

/** Clean raw lines: strip form-feeds, tabs, page numbers, week headers */
export function cleanContent(lines: string[]): string {
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

/** Extract page number from the first few lines of a section */
export function extractPageNumber(lines: string[]): number | undefined {
  const pageNumRe = /^\d{2,3}$/
  for (const line of lines.slice(0, 10)) {
    const s = line.trim()
    if (pageNumRe.test(s) && parseInt(s) >= 49) {
      return parseInt(s)
    }
  }
  return undefined
}
