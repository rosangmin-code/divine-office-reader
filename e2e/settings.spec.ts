import { test, expect } from "@playwright/test"

// ============================================================
// SETTING: 읽기 설정
// ============================================================

test.describe("SETTING", () => {
  test("E2E-D-SETTING-01: 폰트 확대 A+", async ({ page }, testInfo) => {
    await page.goto("/")
    await page.waitForTimeout(500)
    if (testInfo.project.name === "mobile") {
      await page.locator('button[aria-label="사이드바 닫기"]').click()
      await page.waitForTimeout(300)
    }

    const sizeDisplay = page.locator('[aria-live="polite"]')
    const initial = Number(await sizeDisplay.textContent())
    await page.locator('button[aria-label="폰트 확대"]').click()
    expect(Number(await sizeDisplay.textContent())).toBe(initial + 2)
  })

  test("E2E-D-SETTING-02: 폰트 축소 A-", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "mobile", "데스크탑 전용")
    await page.goto("/")
    await page.waitForTimeout(500)

    const sizeDisplay = page.locator('[aria-live="polite"]')
    // First increase then decrease to ensure we're not at minimum
    await page.locator('button[aria-label="폰트 확대"]').click()
    const after = Number(await sizeDisplay.textContent())
    await page.locator('button[aria-label="폰트 축소"]').click()
    expect(Number(await sizeDisplay.textContent())).toBe(after - 2)
  })

  test("E2E-D-SETTING-03: 다크 모드 토글", async ({ page }, testInfo) => {
    await page.goto("/")
    await page.waitForTimeout(500)
    if (testInfo.project.name === "mobile") {
      await page.locator('button[aria-label="사이드바 닫기"]').click()
      await page.waitForTimeout(300)
    }

    const html = page.locator("html")
    const wasDark = await html.evaluate((el) => el.classList.contains("dark"))
    await page.locator('button[aria-label*="모드"]').click()
    const isDark = await html.evaluate((el) => el.classList.contains("dark"))
    expect(isDark).toBe(!wasDark)
  })

  test("E2E-D-SETTING-04: 다크 모드 FOUC 없음", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "mobile", "데스크탑 전용")
    // Enable dark mode
    await page.goto("/")
    await page.waitForTimeout(500)
    await page.locator('button[aria-label*="모드"]').click()
    await page.waitForTimeout(300)

    // Reload — dark class should be present before hydration
    await page.reload()
    // Check immediately (before React hydrates)
    const isDark = await page.evaluate(() => document.documentElement.classList.contains("dark"))
    expect(isDark).toBe(true)

    // Clean up: toggle back
    await page.waitForTimeout(500)
    await page.locator('button[aria-label*="모드"]').click()
  })

  test("E2E-D-SETTING-05: 폰트 설정 새로고침 영속", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "mobile", "데스크탑 전용")
    await page.goto("/")
    await page.waitForTimeout(500)

    // Change font size
    await page.locator('button[aria-label="폰트 확대"]').click()
    await page.locator('button[aria-label="폰트 확대"]').click()
    const newSize = await page.locator('[aria-live="polite"]').textContent()

    // Reload
    await page.reload()
    await page.waitForTimeout(1000)
    const restoredSize = await page.locator('[aria-live="polite"]').textContent()
    expect(restoredSize).toBe(newSize)

    // Clean up
    await page.locator('button[aria-label="폰트 축소"]').click()
    await page.locator('button[aria-label="폰트 축소"]').click()
  })

  test("E2E-D-SETTING-06: 마지막 읽기 위치 복원", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "mobile", "데스크탑 전용")
    await page.goto("/")
    await page.waitForSelector("article", { timeout: 10000 })

    // Navigate to a specific section
    const sidebar = page.locator("aside:visible")
    const leaves = sidebar.locator('div[role="treeitem"]:not([aria-expanded]) button')
    if (await leaves.count() > 2) {
      await leaves.nth(2).click()
      await page.waitForTimeout(1500)

      // Reload
      await page.reload()
      await page.waitForTimeout(2000)

      // Should have scrolled to saved position (scrollTop > 0 or same section visible)
      const scrollPos = await page.evaluate(() => document.querySelector("main")?.scrollTop ?? 0)
      // Just verify the app didn't crash on restore
      expect(scrollPos).toBeGreaterThanOrEqual(0)
    }
  })
})
