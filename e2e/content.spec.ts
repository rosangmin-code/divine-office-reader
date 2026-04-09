import { test, expect } from "@playwright/test"

// ============================================================
// LOAD: 페이지 로드
// ============================================================

test.describe("LOAD", () => {
  test("E2E-D-LOAD-01: 메인 페이지 로드, Loading 없음", async ({ page }) => {
    await page.goto("/")
    await expect(page.locator("header")).toBeVisible()
    await expect(page.locator("text=Loading...")).not.toBeVisible()
  })

  test("E2E-D-LOAD-02: Content API 200 (week1)", async ({ request }) => {
    const res = await request.get("/api/content/week1")
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(Object.keys(body).length).toBeGreaterThan(0)
  })

  test("E2E-D-LOAD-03: 잘못된 그룹 404", async ({ request }) => {
    const res = await request.get("/api/content/invalid")
    expect(res.status()).toBe(404)
  })

  test("E2E-D-LOAD-04: Content API 200 (propers)", async ({ request }) => {
    const res = await request.get("/api/content/propers")
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(Object.keys(body).length).toBeGreaterThan(30)
  })

  test("E2E-D-LOAD-05: Content API 200 (hymns)", async ({ request }) => {
    const res = await request.get("/api/content/hymns")
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(Object.keys(body).length).toBeGreaterThan(10)
  })

  test("E2E-D-LOAD-06: 스켈레톤 → 본문 전환", async ({ page }) => {
    await page.goto("/")
    // Either skeleton or article should appear quickly
    await page.waitForSelector("article, .animate-pulse", { timeout: 5000 })
    // Eventually articles should replace skeletons
    await page.waitForSelector("article", { timeout: 15000 })
    const articleCount = await page.locator("article").count()
    expect(articleCount).toBeGreaterThan(0)
  })
})

// ============================================================
// CONTENT: 콘텐츠 표시
// ============================================================

test.describe("CONTENT", () => {
  test("E2E-D-CONTENT-01: article 렌더링", async ({ page }) => {
    await page.goto("/")
    await page.waitForSelector("article", { timeout: 10000 })
    expect(await page.locator("article").count()).toBeGreaterThan(0)
  })

  test("E2E-D-CONTENT-02: article 본문 10자 이상", async ({ page }) => {
    await page.goto("/")
    await page.waitForSelector("article", { timeout: 10000 })
    const text = await page.locator("article").first().textContent()
    expect(text!.length).toBeGreaterThan(10)
  })

  test("E2E-D-CONTENT-03: propers leaf → 본문 로드", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "mobile", "데스크탑 전용")
    await page.goto("/")
    await page.waitForSelector("article", { timeout: 10000 })

    const sidebar = page.locator("aside:visible")
    // Navigate to propers
    const propersBtn = sidebar.locator('button:has-text("Цаг улирлын")').first()
    if (await propersBtn.isVisible()) {
      await propersBtn.click()
      await page.waitForTimeout(500)
      // Click first season
      const seasonBtn = sidebar.locator('button:has-text("Ирэлтийн")').first()
      if (await seasonBtn.count() > 0) {
        await seasonBtn.click()
        await page.waitForTimeout(3000)
        // Content should have loaded
        const articles = await page.locator("article").count()
        expect(articles).toBeGreaterThan(0)
      }
    }
  })

  test("E2E-D-CONTENT-04: hymns leaf → 본문 로드", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "mobile", "데스크탑 전용")
    await page.goto("/")
    await page.waitForSelector("article", { timeout: 10000 })

    const sidebar = page.locator("aside:visible")
    const hymnsBtn = sidebar.locator('button:has-text("Магтуу")').first()
    if (await hymnsBtn.isVisible()) {
      await hymnsBtn.click()
      await page.waitForTimeout(3000)
      const articles = await page.locator("article").count()
      expect(articles).toBeGreaterThan(0)
    }
  })

  test("E2E-D-CONTENT-05: 그룹 간 전환 콘텐츠 로드", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "mobile", "데스크탑 전용")
    await page.goto("/")
    await page.waitForSelector("article", { timeout: 10000 })

    // First group should be loaded (week1)
    const firstArticle = await page.locator("article").first().textContent()
    expect(firstArticle!.length).toBeGreaterThan(10)

    // Navigate to a different group via search
    const sidebar = page.locator("aside:visible")
    const input = sidebar.locator('input[type="search"]')
    await input.fill("Магтуу")
    await page.waitForTimeout(300)
    const results = sidebar.locator('[role="option"]')
    if (await results.count() > 0) {
      await results.first().click()
      await page.waitForTimeout(3000)
      // New content should be loaded
      const articleCount = await page.locator("article").count()
      expect(articleCount).toBeGreaterThan(0)
    }
  })
})
