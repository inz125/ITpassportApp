import { expect, test } from '@playwright/test'
import { answerCurrent, goNext } from './helpers'

test('テクノロジで練習すると、テクノロジの問題だけが10問出る', async ({
  page,
}) => {
  await page.goto('./')
  await page.getByRole('button', { name: 'テクノロジで練習' }).click()

  for (let number = 1; number <= 10; number++) {
    await expect(page.getByText(`${number} / 10問`)).toBeVisible()
    await expect(page.getByText('テクノロジ', { exact: true })).toBeVisible()
    const question = await answerCurrent(page, true)
    expect(question.field).toBe('technology')
    await goNext(page)
  }

  await expect(page.getByText('10問中10問正解')).toBeVisible()
  await expect(page.getByText(/残りの苦手/)).toHaveCount(0)

  // 「もう一度」で、同じ分野からもう一度出題される
  await page.getByRole('button', { name: 'もう一度' }).click()
  await expect(page.getByText('1 / 10問')).toBeVisible()
  await expect(page.getByText('テクノロジ', { exact: true })).toBeVisible()
})

test('分野別演習で間違えた問題は、苦手復習の対象になる', async ({ page }) => {
  await page.goto('./')
  await page.getByRole('button', { name: 'ストラテジで練習' }).click()
  const mistaken = await answerCurrent(page, false)

  await page.getByRole('button', { name: '中断する' }).click()
  await page
    .getByRole('alertdialog')
    .getByRole('button', { name: '中断する' })
    .click()

  await page.getByRole('button', { name: '苦手を復習する（1問）' }).click()
  await expect(
    page.getByRole('heading', { level: 2, name: mistaken.text }),
  ).toBeVisible()
})
