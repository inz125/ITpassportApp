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

  await expect(
    page.locator('.field-progress').getByText(/1問解いた.*正解1問（100%）/),
  ).toBeVisible()
})

test('学習の記録の画面でも、横スクロールが出ない', async ({ page }) => {
  await page.goto('./')
  await page.getByRole('button', { name: '学習の記録' }).click()

  const hasHorizontalScroll = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  )

  expect(hasHorizontalScroll).toBe(false)
})

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`正解率の棒（${scheme === 'light' ? '明るい画面' : '暗い画面'}）`, () => {
    test.use({ colorScheme: scheme })

    test('解いた分野の棒は、分野ごとに違う色で、空の部分と見分けがつく', async ({
      page,
    }) => {
      await page.goto('./')
      // 一問一答で1問解いて、その分野の棒を出す
      await page.getByRole('button', { name: '一問一答を始める' }).click()
      await answerCurrent(page, true)
      await goNext(page)
      await page.getByRole('button', { name: '中断する' }).click()
      await page
        .getByRole('alertdialog')
        .getByRole('button', { name: '中断する' })
        .click()
      await page.getByRole('button', { name: '学習の記録' }).click()

      const fills = await page
        .locator('.field-progress .rate-bar:not(.coverage) .rate-bar-fill')
        .evaluateAll((els) =>
          els.map((el) => getComputedStyle(el).backgroundColor),
        )
      const track = await page
        .locator('.rate-bar')
        .first()
        .evaluate((el) => getComputedStyle(el).backgroundColor)

      expect(new Set(fills).size).toBe(3)
      for (const fill of fills) expect(fill).not.toBe(track)
    })

    test('棒は画面の幅に収まる', async ({ page }) => {
      await page.goto('./')
      await page.getByRole('button', { name: '学習の記録' }).click()

      const widths = await page
        .locator('.rate-bar')
        .evaluateAll((els) => els.map((el) => el.getBoundingClientRect().width))
      const viewport = page.viewportSize()!.width

      for (const width of widths) {
        expect(width).toBeGreaterThan(0)
        expect(width).toBeLessThanOrEqual(viewport)
      }
    })
  })
}

test('解いた割合の棒は、正解率の棒と見分けがつく（斜線）', async ({ page }) => {
  await page.goto('./')
  await page.getByRole('button', { name: '学習の記録' }).click()

  const coverage = await page
    .locator('.rate-bar.coverage .rate-bar-fill')
    .first()
    .evaluate((el) => getComputedStyle(el).backgroundImage)
  const correctRate = await page
    .locator('.rate-bar:not(.coverage) .rate-bar-fill')
    .first()
    .evaluate((el) => getComputedStyle(el).backgroundImage)

  expect(coverage).toContain('repeating-linear-gradient')
  expect(correctRate).not.toContain('repeating-linear-gradient')
})
