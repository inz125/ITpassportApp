import { expect, test } from '@playwright/test'

test('トップページにアプリのタイトルが表示される', async ({ page }) => {
  await page.goto('./')

  await expect(page).toHaveTitle('ITパスポート学習')
  await expect(
    page.getByRole('heading', { level: 1, name: 'ITパスポート学習' }),
  ).toBeVisible()
})

test('iPhone の画面幅で横スクロールが発生しない', async ({ page }) => {
  await page.goto('./')

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  )
  expect(overflow).toBe(false)
})
