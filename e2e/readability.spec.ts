import { expect, test, type Locator } from '@playwright/test'
import { answerCurrent } from './helpers'

// 要素の見た目の大きさ（px）と行間の倍率を取得する
const textMetrics = (locator: Locator) =>
  locator.first().evaluate((el) => {
    const style = getComputedStyle(el)
    const fontSize = parseFloat(style.fontSize)
    return {
      fontSize,
      lineHeightRatio: parseFloat(style.lineHeight) / fontSize,
    }
  })

test('解答中の画面の文字が、見やすい大きさである', async ({ page }) => {
  await page.goto('./')
  await page.getByRole('button', { name: '一問一答を始める' }).click()

  const heading = await textMetrics(page.getByRole('heading', { level: 2 }))
  const choice = await textMetrics(page.locator('.choice'))

  expect(heading.fontSize).toBeLessThanOrEqual(16.5)
  expect(choice.fontSize).toBeLessThanOrEqual(15)
  expect(choice.lineHeightRatio).toBeGreaterThanOrEqual(1.5)
})

test('解答後の解説の文字が、見やすい大きさである', async ({ page }) => {
  await page.goto('./')
  await page.getByRole('button', { name: '一問一答を始める' }).click()
  await answerCurrent(page, true)

  const explanation = await textMetrics(page.locator('.feedback p').last())

  expect(explanation.fontSize).toBeLessThanOrEqual(15)
  expect(explanation.lineHeightRatio).toBeGreaterThanOrEqual(1.5)
})

test('結果画面の一覧の文字が、見やすい大きさである', async ({ page }) => {
  await page.goto('./')
  await page.getByRole('button', { name: '一問一答を始める' }).click()
  for (let i = 0; i < 10; i++) {
    await answerCurrent(page, true)
    await page.getByRole('button', { name: /次の問題へ|結果を見る/ }).click()
  }

  const item = await textMetrics(page.locator('.results li'))

  expect(item.fontSize).toBeLessThanOrEqual(15)
  expect(item.lineHeightRatio).toBeGreaterThanOrEqual(1.5)
})

test('文字を小さくしても、ボタンの高さと横幅は保たれる', async ({ page }) => {
  await page.goto('./')
  await page.getByRole('button', { name: '一問一答を始める' }).click()

  const heights = await page
    .locator('.choice')
    .evaluateAll((els) => els.map((el) => el.getBoundingClientRect().height))
  const hasHorizontalScroll = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  )

  for (const height of heights) expect(height).toBeGreaterThanOrEqual(44)
  expect(hasHorizontalScroll).toBe(false)
})
