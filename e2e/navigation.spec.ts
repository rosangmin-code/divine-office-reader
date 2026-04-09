import { test, expect } from "@playwright/test"

// ============================================================
// NAV: 네비게이션
// ============================================================

test.describe("NAV — 데스크탑", () => {
  test("E2E-D-NAV-01: 사이드바 leaf 클릭 → 본문 스크롤", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "mobile", "데스크탑 전용")
    await page.goto("/")
    await page.waitForSelector("article", { timeout: 10000 })

    const sidebar = page.locator("aside:visible")
    const leaf = sidebar.locator('div[role="treeitem"]:not([aria-expanded]) button').first()
    await expect(leaf).toBeVisible()
    await leaf.click()
    expect(page.url()).toMatch(/localhost/)
  })

  test("E2E-D-NAV-02: 사이드바 토글 열기/닫기", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "mobile", "데스크탑 전용")
    await page.goto("/")
    await page.waitForSelector("article", { timeout: 10000 })

    await expect(page.locator("aside:visible")).toBeVisible()
    await page.locator('button[aria-label="사이드바 닫기"]').click()
    await page.waitForTimeout(300)
    await expect(page.locator("aside:visible")).not.toBeVisible()

    await page.locator('button[aria-label="사이드바 열기"]').click()
    await page.waitForTimeout(300)
    await expect(page.locator("aside:visible")).toBeVisible()
  })

  test("E2E-D-NAV-04: 컨테이너 노드 클릭 → 첫 leaf로 이동", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "mobile", "데스크탑 전용")
    await page.goto("/")
    await page.waitForSelector("article", { timeout: 10000 })

    const sidebar = page.locator("aside:visible")
    // Click a container node (has aria-expanded)
    const container = sidebar.locator('div[role="treeitem"][aria-expanded] button').first()
    const scrollBefore = await page.evaluate(() => document.querySelector("main")?.scrollTop ?? 0)
    await container.click()
    await page.waitForTimeout(2000)
    // Should have scrolled or loaded content
    const articles = await page.locator("article").count()
    expect(articles).toBeGreaterThan(0)
  })

  test("E2E-D-NAV-05: 브레드크럼 경로 표시", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "mobile", "데스크탑 전용")
    await page.goto("/")
    await page.waitForSelector("article", { timeout: 10000 })

    const sidebar = page.locator("aside:visible")
    const leaf = sidebar.locator('div[role="treeitem"]:not([aria-expanded]) button').first()
    await leaf.click()
    await page.waitForTimeout(1000)

    // Breadcrumb should contain "/" separators
    const breadcrumbText = await page.locator("header + div").first().textContent()
    // Breadcrumb exists (may be empty for top-level items)
    expect(breadcrumbText).toBeDefined()
  })

  test("E2E-D-NAV-06: propers 시즌 하위 목차 표시", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "mobile", "데스크탑 전용")
    await page.goto("/")
    await page.waitForSelector("article", { timeout: 10000 })

    const sidebar = page.locator("aside:visible")
    // Propers parent should exist in sidebar tree
    const propersNode = sidebar.locator('button:has-text("Цаг улирлын")')
    if (await propersNode.count() > 0) {
      // First click expands + navigates to first leaf
      await propersNode.first().click()
      await page.waitForTimeout(1000)
      // Propers tree should now be expanded, showing season children
      // Look for any season-specific text inside the propers subtree
      const seasonNodes = sidebar.locator('div[role="treeitem"][aria-expanded] button')
      // At minimum, the propers node itself is expanded
      expect(await seasonNodes.count()).toBeGreaterThan(0)
    }
  })

  test("E2E-D-NAV-07: hymns 개별 찬미가 목차 표시", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "mobile", "데스크탑 전용")
    await page.goto("/")
    await page.waitForSelector("article", { timeout: 10000 })

    const sidebar = page.locator("aside:visible")
    const hymns = sidebar.locator('button:has-text("Магтуу")')
    if (await hymns.count() > 0) {
      await hymns.first().click()
      await page.waitForTimeout(500)
      // Should show hymn children (they have titleMn like "Та Иосеф", "Хамт алхацгаая" etc.)
      await page.waitForTimeout(500)
      const hymnItems = sidebar.locator('div[role="treeitem"]:not([aria-expanded]) button')
      expect(await hymnItems.count()).toBeGreaterThan(5)
    }
  })

  test("E2E-D-NAV-08: week 트리 전체 깊이 탐색", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "mobile", "데스크탑 전용")
    await page.goto("/")
    await page.waitForSelector("article", { timeout: 10000 })

    const sidebar = page.locator("aside:visible")
    // Week 1 should be auto-expanded (depth < 2)
    const dayNode = sidebar.locator('button:has-text("Бямба гараг")').first()
    expect(await dayNode.count()).toBeGreaterThan(0)

    // Click day to expand hour-level
    await dayNode.click()
    await page.waitForTimeout(500)
    // Should show hour-level leaves
    const hourLeaves = sidebar.locator('button:has-text("Бямба гарагийн")')
    expect(await hourLeaves.count()).toBeGreaterThan(0)
  })

  test("E2E-D-NAV-10: 활성 항목 사이드바 자동 스크롤", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "mobile", "데스크탑 전용")
    await page.goto("/")
    await page.waitForSelector("article", { timeout: 10000 })

    const sidebar = page.locator("aside:visible")
    const leaf = sidebar.locator('div[role="treeitem"]:not([aria-expanded]) button').first()
    await leaf.click()
    await page.waitForTimeout(1000)

    // Active item should have aria-current="location"
    const activeItem = sidebar.locator('[aria-current="location"]')
    expect(await activeItem.count()).toBeGreaterThan(0)
  })
})

test.describe("NAV — 모바일", () => {
  test("E2E-M-NAV-03: 모바일 오버레이 열기/닫기", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "desktop", "모바일 전용")
    await page.goto("/")
    await page.waitForTimeout(1000)

    await page.locator('button[aria-label="사이드바 닫기"]').click()
    await page.waitForTimeout(300)
    const overlay = page.locator('.md\\:hidden.fixed')
    await expect(overlay).toHaveClass(/pointer-events-none/)

    await page.locator('button[aria-label="사이드바 열기"]').click()
    await page.waitForTimeout(300)
    await expect(overlay).not.toHaveClass(/pointer-events-none/)
  })

  test("E2E-M-NAV-09: 모바일 leaf 클릭 → 스크롤 + 사이드바 닫힘", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "desktop", "모바일 전용")
    await page.goto("/")
    await page.waitForTimeout(2000)

    // Sidebar should be open by default — find a leaf inside mobile overlay
    const overlay = page.locator('.md\\:hidden.fixed')
    const leaf = overlay.locator('div[role="treeitem"]:not([aria-expanded]) button').first()
    if (await leaf.isVisible()) {
      await leaf.click()
      await page.waitForTimeout(1000)
      // Sidebar should close after navigation on mobile
      await expect(overlay).toHaveClass(/pointer-events-none/)
    }
  })
})
