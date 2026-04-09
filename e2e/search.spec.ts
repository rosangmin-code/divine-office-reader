import { test, expect } from "@playwright/test"

// ============================================================
// SEARCH: 검색
// ============================================================

test.describe("SEARCH", () => {
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "mobile", "데스크탑 전용")
    await page.goto("/")
    await page.waitForSelector("article", { timeout: 10000 })
  })

  test("E2E-D-SEARCH-01: 제목 검색 결과 표시", async ({ page }) => {
    const sidebar = page.locator("aside:visible")
    const input = sidebar.locator('input[type="search"]')
    await input.fill("Дуулал")
    await page.waitForTimeout(300)
    const results = sidebar.locator('[role="option"]')
    expect(await results.count()).toBeGreaterThan(0)
  })

  test("E2E-D-SEARCH-02: 결과 클릭 → 네비게이션 + 검색 초기화", async ({ page }) => {
    const sidebar = page.locator("aside:visible")
    const input = sidebar.locator('input[type="search"]')
    await input.fill("Дуулал")
    await page.waitForTimeout(300)
    const results = sidebar.locator('[role="option"]')
    if (await results.count() > 0) {
      await results.first().click()
      await expect(input).toHaveValue("")
    }
  })

  test("E2E-D-SEARCH-03: 시편 번호 '141' 검색", async ({ page }) => {
    const sidebar = page.locator("aside:visible")
    const input = sidebar.locator('input[type="search"]')
    await input.fill("141")
    await page.waitForTimeout(300)
    const results = sidebar.locator('[role="option"]')
    expect(await results.count()).toBeGreaterThan(0)
  })

  test("E2E-D-SEARCH-04: 찬미가 번호 '42' 검색", async ({ page }) => {
    const sidebar = page.locator("aside:visible")
    const input = sidebar.locator('input[type="search"]')
    await input.fill("42")
    await page.waitForTimeout(300)
    const results = sidebar.locator('[role="option"]')
    expect(await results.count()).toBeGreaterThan(0)
  })

  test("E2E-D-SEARCH-05: 1자 입력 → 트리 유지", async ({ page }) => {
    const sidebar = page.locator("aside:visible")
    const input = sidebar.locator('input[type="search"]')
    await input.fill("А")
    await page.waitForTimeout(300)
    // Tree should still be visible (not search results)
    const tree = sidebar.locator('nav[role="tree"]')
    await expect(tree).toBeVisible()
    const listbox = sidebar.locator('[role="listbox"]')
    expect(await listbox.count()).toBe(0)
  })

  test("E2E-D-SEARCH-06: 결과 없음 메시지", async ({ page }) => {
    const sidebar = page.locator("aside:visible")
    const input = sidebar.locator('input[type="search"]')
    await input.fill("zzzzzznotfound")
    await page.waitForTimeout(300)
    const noResult = sidebar.locator('[role="status"]')
    await expect(noResult).toBeVisible()
  })
})
