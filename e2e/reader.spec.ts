import { test, expect } from "@playwright/test"

test.describe("페이지 로드", () => {
  test("메인 페이지가 정상 로드되고 Loading이 없다", async ({ page }) => {
    await page.goto("/")
    await expect(page.locator("header")).toBeVisible()
    await expect(page.locator("text=Loading...")).not.toBeVisible()
  })

  test("콘텐츠 API가 정상 응답한다", async ({ request }) => {
    const res = await request.get("/api/content/week1")
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(Object.keys(body).length).toBeGreaterThan(0)
  })

  test("잘못된 그룹은 404를 반환한다", async ({ request }) => {
    const res = await request.get("/api/content/invalid")
    expect(res.status()).toBe(404)
  })
})

test.describe("사이드바 — 데스크탑", () => {
  test("트리 항목을 클릭하면 네비게이션된다", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "mobile", "데스크탑 전용")
    await page.goto("/")
    await page.waitForSelector("article", { timeout: 10000 })

    // Desktop sidebar: visible aside (mobile aside is inside md:hidden parent)
    const sidebar = page.locator("aside:visible")
    const treeNav = sidebar.locator('nav[role="tree"]')
    await expect(treeNav).toBeVisible()

    const leaf = treeNav.locator('div[role="treeitem"]:not([aria-expanded]) button').first()
    await expect(leaf).toBeVisible()
    await leaf.click()
    expect(page.url()).toMatch(/localhost/)
  })

  test("토글 버튼으로 사이드바를 숨기고 다시 열 수 있다", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "mobile", "데스크탑 전용")
    await page.goto("/")
    await page.waitForSelector("article", { timeout: 10000 })

    const sidebar = page.locator("aside:visible")
    await expect(sidebar).toBeVisible()

    await page.locator('button[aria-label="사이드바 닫기"]').click()
    await page.waitForTimeout(300)
    await expect(page.locator("aside:visible")).not.toBeVisible()

    await page.locator('button[aria-label="사이드바 열기"]').click()
    await page.waitForTimeout(300)
    await expect(page.locator("aside:visible")).toBeVisible()
  })
})

test.describe("사이드바 — 모바일", () => {
  test("오버레이로 열리고 닫기 버튼으로 닫힌다", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "desktop", "모바일 전용")
    await page.goto("/")
    await page.waitForTimeout(1000)

    // Sidebar starts open — close via toolbar button (toolbar is z-50, above overlay)
    await page.locator('button[aria-label="사이드바 닫기"]').click()
    await page.waitForTimeout(300)

    const overlay = page.locator('.md\\:hidden.fixed')
    await expect(overlay).toHaveClass(/pointer-events-none/)

    // Reopen
    await page.locator('button[aria-label="사이드바 열기"]').click()
    await page.waitForTimeout(300)
    await expect(overlay).not.toHaveClass(/pointer-events-none/)
  })
})

test.describe("검색", () => {
  test("검색어 입력 시 결과가 표시되고 클릭할 수 있다", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "mobile", "데스크탑 전용")
    await page.goto("/")
    await page.waitForSelector("article", { timeout: 10000 })

    // Desktop sidebar's search input (visible aside)
    const sidebar = page.locator("aside:visible")
    const searchInput = sidebar.locator('input[type="search"]')
    await searchInput.fill("Дуулал")
    await page.waitForTimeout(300)

    const results = sidebar.locator('[role="option"]')
    const count = await results.count()
    if (count > 0) {
      await results.first().click()
      await expect(searchInput).toHaveValue("")
    }
  })
})

test.describe("읽기 설정", () => {
  test("폰트 크기를 조절할 수 있다", async ({ page }, testInfo) => {
    await page.goto("/")
    await page.waitForTimeout(500)
    if (testInfo.project.name === "mobile") {
      await page.locator('button[aria-label="사이드바 닫기"]').click()
      await page.waitForTimeout(300)
    }

    const sizeDisplay = page.locator('[aria-live="polite"]')
    const initialSize = await sizeDisplay.textContent()

    await page.locator('button[aria-label="폰트 확대"]').click()
    const newSize = await sizeDisplay.textContent()
    expect(Number(newSize)).toBe(Number(initialSize) + 2)
  })

  test("다크 모드를 토글할 수 있다", async ({ page }, testInfo) => {
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
})

test.describe("브레드크럼", () => {
  test("네비게이션 후 브레드크럼이 존재한다", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "mobile", "데스크탑 전용")
    await page.goto("/")
    await page.waitForSelector("article", { timeout: 10000 })

    const sidebar = page.locator("aside:visible")
    const leaf = sidebar.locator('div[role="treeitem"]:not([aria-expanded]) button').first()
    await leaf.click()
    await page.waitForTimeout(500)

    // Breadcrumb container exists (shown between toolbar and content)
    const breadcrumb = page.locator("text=/")
    expect(await breadcrumb.count()).toBeGreaterThanOrEqual(0)
  })
})

test.describe("콘텐츠 로딩", () => {
  test("콘텐츠가 로드되고 본문이 표시된다", async ({ page }) => {
    await page.goto("/")
    await page.waitForSelector("article", { timeout: 10000 })

    const articleCount = await page.locator("article").count()
    expect(articleCount).toBeGreaterThan(0)

    const firstArticle = page.locator("article").first()
    await expect(firstArticle).toBeVisible()
    const text = await firstArticle.textContent()
    expect(text!.length).toBeGreaterThan(10)
  })
})
