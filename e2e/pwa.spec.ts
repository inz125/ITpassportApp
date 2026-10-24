import { expect, test, type BrowserContext, type Page } from '@playwright/test'

test('ホーム画面に追加するための情報（マニフェスト・アイコン）が公開されている', async ({
  page,
  request,
}) => {
  await page.goto('./')

  const manifestHref = await page
    .locator('link[rel="manifest"]')
    .getAttribute('href')
  const manifestUrl = new URL(manifestHref!, page.url()).href
  const manifest = await (await request.get(manifestUrl)).json()

  expect(manifest.display).toBe('standalone')
  expect(manifest.scope).toBe('/ITpassportApp/')
  expect(manifest.start_url).toBe('/ITpassportApp/')
  expect(manifest.lang).toBe('ja')
  for (const icon of manifest.icons) {
    const response = await request.get(new URL(icon.src, manifestUrl).href)
    expect(response.ok(), icon.src).toBe(true)
  }
  const appleIcon = await page
    .locator('link[rel="apple-touch-icon"]')
    .getAttribute('href')
  const appleResponse = await request.get(new URL(appleIcon!, page.url()).href)
  expect(appleResponse.ok()).toBe(true)
})

test('Service Worker が公開パスで有効になる', async ({ page }) => {
  await page.goto('./')

  const scope = await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready
    return new URL(registration.scope).pathname
  })

  expect(scope).toBe('/ITpassportApp/')
})

// 最初は、中身を少し変えた sw.js を配信して登録させる（古い版が入った状態）。
// そのあと、本来の sw.js に戻して更新を確認させる（新しい版が公開された状態）
const installOldVersion = async (
  page: Page,
  context: BrowserContext,
  path: string,
) => {
  await context.route('**/sw.js', async (route) => {
    const response = await route.fetch()
    const body = await response.text()
    await route.fulfill({ response, body: `${body}\n// old version` })
  })
  await page.goto(path)
  await page.evaluate(() => navigator.serviceWorker.ready)
  // 初回は Service Worker が画面を管理しない。開き直して、管理された状態にする
  await page.reload()
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null)
  await context.unroute('**/sw.js')
}

const checkForUpdate = (page: Page) =>
  page.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready
    await registration.update()
    // 新しい版が待機状態になるのを待つ
    for (let i = 0; i < 50 && !registration.waiting; i++) {
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
  })

test('新しい版が公開されると、トップに「更新する」が出て、押すと新しい版に切り替わる', async ({
  page,
  context,
}) => {
  await installOldVersion(page, context, './')
  await expect(page.getByText('新しい版があります')).not.toBeVisible()

  await checkForUpdate(page)

  await expect(page.getByRole('status')).toContainText('新しい版があります')

  await page.getByRole('button', { name: '更新する' }).click()

  await expect(page.getByText('新しい版があります')).not.toBeVisible()
  await expect(
    page.getByRole('heading', { level: 1, name: 'ITパスポート学習' }),
  ).toBeVisible()
})

test('解答中には、更新の案内を出さない', async ({ page, context }) => {
  await installOldVersion(page, context, './')
  await page.getByRole('button', { name: '一問一答を始める' }).click()

  await checkForUpdate(page)

  await expect(page.getByText('新しい版があります')).not.toBeVisible()
  await expect(page.getByText('1 / 10問')).toBeVisible()
})
