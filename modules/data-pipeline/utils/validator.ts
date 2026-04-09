/**
 * Build-time QA validation for the generated output.
 */

/** P2-1: Build-time QA validation */
export function validateOutput(contentObj: Record<string, { content: string; titleMn: string }>) {
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
    console.warn('\n\u26a0\ufe0f  Build QA warnings:')
    errors.forEach(e => console.warn(e))
  } else {
    console.log('\u2705 Build QA: all checks passed')
  }
}
