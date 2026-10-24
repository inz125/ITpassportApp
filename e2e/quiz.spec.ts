import { expect, test } from '@playwright/test'

test('一問一答を10問解いて結果を確認し、もう一度始められる', async ({
  page,
}) => {
  await page.goto('./')
  await page.getByRole('button', { name: '一問一答を始める' }).click()

  for (let i = 1; i <= 10; i++) {
    await expect(page.getByText(`${i} / 10問`)).toBeVisible()

    // 次の問題へ進めるのは解答後だけ
    const next = page.getByRole('button', { name: /次の問題へ|結果を見る/ })
    await expect(next).toBeDisabled()

    await page.locator('.choice').first().click()
    await expect(page.getByRole('status')).toBeVisible()
    await next.click()
  }

  await expect(page.getByText(/^10問中\d+問正解$/)).toBeVisible()
  await expect(page.getByRole('listitem')).toHaveCount(10)

  await page.getByRole('button', { name: 'もう一度' }).click()
  await expect(page.getByText('1 / 10問')).toBeVisible()
})

test('解答中に中断するとトップに戻る', async ({ page }) => {
  await page.goto('./')
  await page.getByRole('button', { name: '一問一答を始める' }).click()

  await page.getByRole('button', { name: '中断する' }).click()
  await page
    .getByRole('alertdialog')
    .getByRole('button', { name: '中断する' })
    .click()

  await expect(
    page.getByRole('button', { name: '一問一答を始める' }),
  ).toBeVisible()
})

test('問題・選択肢・結果の画面で横スクロールが発生しない', async ({ page }) => {
  const hasHorizontalScroll = () =>
    page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    )

  await page.goto('./')
  await page.getByRole('button', { name: '一問一答を始める' }).click()
  expect(await hasHorizontalScroll()).toBe(false)

  await page.locator('.choice').first().click()
  expect(await hasHorizontalScroll()).toBe(false)

  for (let i = 1; i <= 10; i++) {
    await page.getByRole('button', { name: /次の問題へ|結果を見る/ }).click()
    if (i < 10) await page.locator('.choice').first().click()
  }
  expect(await hasHorizontalScroll()).toBe(false)
})

test('選択肢のタップ領域が44px以上ある', async ({ page }) => {
  await page.goto('./')
  await page.getByRole('button', { name: '一問一答を始める' }).click()

  const boxes = await page
    .locator('.choice')
    .evaluateAll((els) => els.map((el) => el.getBoundingClientRect().height))

  expect(boxes).toHaveLength(4)
  for (const height of boxes) {
    expect(height).toBeGreaterThanOrEqual(44)
  }
})
