import { expect, test } from '@playwright/test'

// GitHub Pages の公開 URL は https://inz125.github.io/ITpassportApp/ で、
// パスの大文字・小文字はリポジトリ名と一致している必要がある
const PAGES_PATH = '/ITpassportApp/'

test('GitHub Pages の公開パスでトップページが表示される', async ({ page }) => {
  await page.goto(PAGES_PATH)

  await expect(
    page.getByRole('heading', { level: 1, name: 'ITパスポート学習' }),
  ).toBeVisible()
})

test('JS・CSS・アイコンの参照先が公開パスで始まる', async ({ page }) => {
  await page.goto(PAGES_PATH)

  const assetPaths = await page.evaluate(() =>
    [
      ...document.querySelectorAll<HTMLScriptElement>('script[src]'),
      ...document.querySelectorAll<HTMLLinkElement>('link[href]'),
    ].map((el) => new URL('src' in el ? el.src : el.href).pathname),
  )

  expect(assetPaths.length).toBeGreaterThan(0)
  for (const path of assetPaths) {
    expect(path.startsWith(PAGES_PATH)).toBe(true)
  }
})
