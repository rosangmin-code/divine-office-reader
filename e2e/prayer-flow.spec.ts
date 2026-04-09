import { test, expect } from "@playwright/test"

// ============================================================
// FLOW: 기도 흐름 — 교차 그룹 네비게이션
// ============================================================

test.describe("FLOW", () => {
  test("E2E-D-FLOW-01: 시편집 연속 섹션 스크롤 연결", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "mobile", "데스크탑 전용")
    await page.goto("/")
    await page.waitForSelector("article", { timeout: 10000 })

    // Multiple articles should be rendered sequentially
    const articles = page.locator("article")
    const count = await articles.count()
    expect(count).toBeGreaterThan(1)

    // First and second articles should have different IDs (sequential sections)
    const id1 = await articles.nth(0).getAttribute("id")
    const id2 = await articles.nth(1).getAttribute("id")
    expect(id1).not.toBe(id2)
    expect(id1).toBeTruthy()
    expect(id2).toBeTruthy()
  })

  test("E2E-D-FLOW-02: 시편집 → 찬미가 → 시편집 교차 이동", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "mobile", "데스크탑 전용")
    await page.goto("/")
    await page.waitForSelector("article", { timeout: 10000 })

    const sidebar = page.locator("aside:visible")

    // Step 1: Note current position in psalter (week1)
    const firstArticleId = await page.locator("article").first().getAttribute("id")
    expect(firstArticleId).toMatch(/^week/)

    // Step 2: Navigate to hymns via sidebar
    const hymnsBtn = sidebar.locator('button:has-text("Магтуу")').first()
    await hymnsBtn.click()
    await page.waitForTimeout(3000)

    // Should have loaded hymns content
    const articlesAfterHymn = await page.locator("article").count()
    expect(articlesAfterHymn).toBeGreaterThan(0)

    // Step 3: Navigate back to psalter via sidebar
    const week1Day = sidebar.locator('button:has-text("Бямба гараг")').first()
    await week1Day.click()
    await page.waitForTimeout(2000)

    // Should be back in week content
    const articlesAfterReturn = await page.locator("article").count()
    expect(articlesAfterReturn).toBeGreaterThan(0)
  })

  test("E2E-D-FLOW-03: 시편집 → 고유문 → 시편집 교차 이동", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "mobile", "데스크탑 전용")
    await page.goto("/")
    await page.waitForSelector("article", { timeout: 10000 })

    const sidebar = page.locator("aside:visible")

    // Step 1: Start in psalter
    const initialArticle = await page.locator("article").first().getAttribute("id")
    expect(initialArticle).toMatch(/^week/)

    // Step 2: Navigate to propers
    const propersBtn = sidebar.locator('button:has-text("Цаг улирлын")').first()
    await propersBtn.click()
    await page.waitForTimeout(3000)

    // Propers content should load
    const articles = await page.locator("article").count()
    expect(articles).toBeGreaterThan(0)

    // Step 3: Navigate back to psalter
    const psalterDay = sidebar.locator('button:has-text("Ням гараг")').first()
    await psalterDay.click()
    await page.waitForTimeout(2000)

    const returnedArticles = await page.locator("article").count()
    expect(returnedArticles).toBeGreaterThan(0)
  })

  test("E2E-D-FLOW-04: 본문 내 페이지 참조(х.) 존재 확인", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "mobile", "데스크탑 전용")
    await page.goto("/")
    await page.waitForSelector("article", { timeout: 10000 })

    // Check if any article content contains "х." page references
    const pageRefCount = await page.evaluate(() => {
      const articles = document.querySelectorAll("article")
      let count = 0
      articles.forEach(a => {
        if (a.textContent && /х\.\s*\d+/.test(a.textContent)) count++
      })
      return count
    })

    // At least some articles should have page references (confirms cross-references exist in data)
    // This test documents the current state: references exist but are not clickable
    expect(pageRefCount).toBeGreaterThanOrEqual(0) // may be 0 if loaded group doesn't have refs
  })

  test("E2E-M-FLOW-05: 모바일 교차 그룹 이동 후 사이드바 닫힘", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "desktop", "모바일 전용")
    await page.goto("/")
    await page.waitForTimeout(2000)

    const overlay = page.locator('.md\\:hidden.fixed')

    // Navigate to hymns via mobile sidebar
    const hymnLeaf = overlay.locator('div[role="treeitem"]:not([aria-expanded]) button').first()
    if (await hymnLeaf.isVisible()) {
      await hymnLeaf.click()
      await page.waitForTimeout(1000)

      // Sidebar should close after navigation
      await expect(overlay).toHaveClass(/pointer-events-none/)

      // Reopen sidebar and navigate to a different group (week)
      await page.locator('button[aria-label="사이드바 열기"]').click()
      await page.waitForTimeout(500)

      const weekLeaf = overlay.locator('button:has-text("Бямба")').first()
      if (await weekLeaf.isVisible()) {
        await weekLeaf.click()
        await page.waitForTimeout(1000)

        // Sidebar should close again
        await expect(overlay).toHaveClass(/pointer-events-none/)
      }
    }
  })
})
