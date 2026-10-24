import { expect, test } from '@playwright/test'
import { answerCurrent, goNext } from './helpers'

test('学習の記録を開き、戻れる。記録がないときは案内が出る', async ({
  page,
}) => {
  await page.goto('./')

  await page.getByRole('button', { name: '学習の記録' }).click()

  await expect(
    page.getByRole('heading', { level: 1, name: '学習の記録' }),
  ).toBeVisible()
  await expect(page.getByText('模擬試験の記録はまだありません')).toBeVisible()

  await page.getByRole('button', { name: '戻る' }).click()

  await expect(
    page.getByRole('button', { name: '一問一答を始める' }),
  ).toBeVisible()
})

test('一問一答で解いた分が、分野別の正解率に反映される', async ({ page }) => {
  await page.goto('./')
  await page.getByRole('button', { name: '一問一答を始める' }).click()
  await answerCurrent(page, true)
  await goNext(page)

  await page.getByRole('button', { name: '中断する' }).click()
  await page
    .getByRole('alertdialog')
    .getByRole('button', { name: '中断する' })
    .click()
  await page.getByRole('button', { name: '学習の記録' }).click()

  await expect(page.getByText(/1問解いた.*正解1問（100%）/)).toBeVisible()
})

test('学習の記録の画面でも、横スクロールが出ない', async ({ page }) => {
  await page.goto('./')
  await page.getByRole('button', { name: '学習の記録' }).click()

  const hasHorizontalScroll = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  )

  expect(hasHorizontalScroll).toBe(false)
})
