import { describe, it, expect } from "vitest"
import fs from "fs"
import path from "path"

const DATA_DIR = path.join(process.cwd(), "public", "data")
const contentAll = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "content.json"), "utf-8")) as Record<string, { content: string; title: string; titleMn: string; level: number }>
const bookmarks = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "bookmarks.json"), "utf-8"))

function collectLeaves(node: { id: string; children: any[] }): string[] {
  if (node.children.length === 0) return [node.id]
  return node.children.flatMap(collectLeaves)
}

const allIds = Object.keys(contentAll)
const allLeafIds = collectLeaves(bookmarks)

// --- T-CLEAN: Content normalization tests ---

describe("T-CLEAN: 콘텐츠 정규화", () => {
  it("T-CLEAN-01: 폼피드(\\f) 완전 제거", () => {
    const withFormFeed = allIds.filter(id => contentAll[id].content.includes("\f"))
    expect(withFormFeed).toEqual([])
  })

  it("T-CLEAN-02: 탭(\\t) 완전 제거", () => {
    const withTab = allIds.filter(id => contentAll[id].content.includes("\t"))
    expect(withTab).toEqual([])
  })

  it("T-CLEAN-03: 독립 페이지 번호 라인 없음", () => {
    const pageNumRe = /^\d{2,4}$/m
    const withPageNum = allIds.filter(id => {
      const lines = contentAll[id].content.split("\n")
      return lines.some(l => pageNumRe.test(l.trim()) && parseInt(l.trim()) >= 49)
    })
    expect(withPageNum).toEqual([])
  })

  it("T-CLEAN-04: 주차 헤더 독립 라인 없음", () => {
    const headerRe = /^\d\s*д[үуУ]г[аэАЭ]+р\s+долоо\s+хоног$/im
    const withHeader = allIds.filter(id => headerRe.test(contentAll[id].content))
    expect(withHeader).toEqual([])
  })

  it("T-CLEAN-05: 연속 빈 줄 3개 이상 없음", () => {
    const withTripleBlank = allIds.filter(id => contentAll[id].content.includes("\n\n\n"))
    expect(withTripleBlank).toEqual([])
  })

  it("T-CLEAN-06: 콘텐츠 앞뒤 공백 없음", () => {
    const untrimmed = allIds.filter(id => {
      const c = contentAll[id].content
      return c.length > 0 && (c !== c.trim())
    })
    expect(untrimmed).toEqual([])
  })

  it("T-CLEAN-07: 페이지 헤더 결합 라인 없음", () => {
    const embedded = allIds.filter(id => /\f\d+\t/.test(contentAll[id].content))
    expect(embedded).toEqual([])
  })
})

// --- T-STRUCT: TOC structure tests ---

describe("T-STRUCT: 목차 구조", () => {
  it("T-STRUCT-01: propers 하위에 6개 시즌 노드 존재", () => {
    const propersNode = bookmarks.children.find((c: any) => c.id === "propers")
    expect(propersNode).toBeDefined()
    const seasonIds = propersNode.children.map((c: any) => c.id)
    expect(seasonIds).toContain("propers-advent")
    expect(seasonIds).toContain("propers-christmas")
    expect(seasonIds).toContain("propers-lent")
    expect(seasonIds).toContain("propers-easter")
    expect(seasonIds).toContain("propers-ordinary")
    expect(seasonIds).toContain("propers-saints")
  })

  it("T-STRUCT-02: 연중 시기에 주일별 자식 노드 존재", () => {
    const propersNode = bookmarks.children.find((c: any) => c.id === "propers")
    const ordinary = propersNode.children.find((c: any) => c.id === "propers-ordinary")
    expect(ordinary).toBeDefined()
    expect(ordinary.children.length).toBeGreaterThanOrEqual(10)
  })

  it("T-STRUCT-03: propers 총 leaf ≥ 30", () => {
    const propersNode = bookmarks.children.find((c: any) => c.id === "propers")
    const leaves = collectLeaves(propersNode)
    expect(leaves.length).toBeGreaterThanOrEqual(30)
  })

  it("T-STRUCT-04: hymns leaf ≥ 10", () => {
    const hymnsNode = bookmarks.children.find((c: any) => c.id === "hymns")
    const leaves = collectLeaves(hymnsNode)
    expect(leaves.length).toBeGreaterThanOrEqual(10)
  })

  it("T-STRUCT-05: propers-saints 비어있지 않음", () => {
    // Saints should be a container or have real content, not just 486 chars of intro
    const propersNode = bookmarks.children.find((c: any) => c.id === "propers")
    const saints = propersNode.children.find((c: any) => c.id === "propers-saints")
    expect(saints).toBeDefined()
    const saintLeaves = collectLeaves(saints)
    // Either saints has children or its content is substantial
    const totalContent = saintLeaves.reduce((sum: number, id: string) => sum + (contentAll[id]?.content?.length || 0), 0)
    expect(totalContent).toBeGreaterThan(500)
  })

  it("T-STRUCT-06: 모든 leaf에 content 존재", () => {
    const emptyLeaves = allLeafIds.filter(id => {
      const section = contentAll[id]
      return section && section.content.length === 0
    })
    // Allow a few empty containers but most should have content
    expect(emptyLeaves.length).toBeLessThan(5)
  })

  it("T-STRUCT-07: 모든 leaf에 titleMn 존재", () => {
    const emptyTitle = allLeafIds.filter(id => {
      const section = contentAll[id]
      return section && (!section.titleMn || section.titleMn.length === 0)
    })
    expect(emptyTitle).toEqual([])
  })

  it("T-STRUCT-08: week 구조 유지 (회귀 방지)", () => {
    const psalter = bookmarks.children.find((c: any) => c.id === "psalter")
    expect(psalter.children.length).toBe(4) // 4 weeks
    for (const week of psalter.children) {
      const leaves = collectLeaves(week)
      expect(leaves.length).toBeGreaterThanOrEqual(50)
    }
  })
})
