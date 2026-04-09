"use client"

import type { LiturgicalSegment } from "@/modules/shared"

interface Props {
  segments: LiturgicalSegment[]
}

/** Render inline page references (х. NNN) as styled spans */
function renderWithPageRefs(text: string) {
  const pageRefRe = /(х\.\s*\d+)/g
  const parts = text.split(pageRefRe)
  if (parts.length === 1) return text

  return parts.map((part, i) => {
    if (pageRefRe.test(part)) {
      // Reset regex lastIndex since we reuse it
      pageRefRe.lastIndex = 0
      return (
        <span key={i} className="text-stone-500 dark:text-stone-400 underline decoration-dotted underline-offset-2">
          {part}
        </span>
      )
    }
    return part
  })
}

function renderText(text: string) {
  // Split by newlines to create proper paragraphs
  const lines = text.split('\n')
  if (lines.length === 1) return renderWithPageRefs(text)

  return lines.map((line, i) => (
    <span key={i}>
      {i > 0 && <br />}
      {renderWithPageRefs(line)}
    </span>
  ))
}

export default function LiturgicalContent({ segments }: Props) {
  return (
    <div className="liturgical-content font-serif leading-relaxed space-y-3">
      {segments.map((seg, i) => {
        switch (seg.type) {
          case 'section-marker':
            return (
              <h4
                key={i}
                className="uppercase tracking-widest text-[0.75em] font-semibold mt-6 mb-1 text-amber-800 dark:text-amber-400"
              >
                {seg.text}
              </h4>
            )

          case 'psalm-ref':
            return (
              <h4
                key={i}
                className="font-bold text-[1.05em] mt-5 mb-0.5"
              >
                {seg.text}
              </h4>
            )

          case 'subtitle':
            return (
              <p
                key={i}
                className="italic text-[0.85em] text-stone-500 dark:text-stone-400 mb-1"
              >
                {seg.text}
              </p>
            )

          case 'scripture-ref':
            return (
              <cite
                key={i}
                className="block not-italic font-medium text-[0.85em] text-stone-600 dark:text-stone-400 mb-1"
              >
                {seg.text}
              </cite>
            )

          case 'rubric':
            return (
              <p
                key={i}
                className="liturgical-rubric italic text-[0.9em]"
              >
                {renderText(seg.text)}
              </p>
            )

          case 'response':
            return (
              <p
                key={i}
                className="liturgical-response pl-5"
              >
                <span className="font-semibold mr-1">—</span>
                {renderText(seg.text)}
              </p>
            )

          case 'doxology':
            return (
              <p
                key={i}
                className="italic text-stone-600 dark:text-stone-400"
              >
                {renderText(seg.text)}
              </p>
            )

          case 'seasonal-note':
            return (
              <div
                key={i}
                className="border-l-2 border-amber-400 dark:border-amber-600 pl-3 text-[0.85em] italic text-stone-600 dark:text-stone-400 my-2"
                role="note"
              >
                {renderText(seg.text)}
              </div>
            )

          case 'body':
          default:
            return (
              <p
                key={i}
                className="whitespace-pre-wrap"
              >
                {renderWithPageRefs(seg.text)}
              </p>
            )
        }
      })}
    </div>
  )
}
