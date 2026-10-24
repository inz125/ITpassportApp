import { expect, test, type Page } from '@playwright/test'
import { answerCurrent, goNext } from './helpers'

const STORAGE_KEY = 'itpassport-app:history:v1'

// ページを開く前に、端末（localStorage）へ履歴を入れておく
const seedHistory = (page: Page, value: string) =>
  page.addInitScript(([key, stored]) => localStorage.setItem(key, stored), [
    STORAGE_KEY,
    value,
  ] as const)

test('苦手な問題を復習して全問正解すると、苦手がなくなる', async ({ page }) => {
  await seedHistory(
    page,
    JSON.stringify({
      'strategy-1': false,
      'management-1': false,
      'technology-1': false,
      'strategy-2': true,
    }),
  )
  await page.goto('./')

  await page.getByRole('button', { name: '苦手を復習する（3問）' }).click()
  for (const number of [1, 2, 3]) {
    await expect(page.getByText(`${number} / 3問`)).toBeVisible()
    await answerCurrent(page, true)
    await goNext(page)
  }

  await expect(page.getByText('3問中3問正解')).toBeVisible()
  await expect(page.getByText('残りの苦手：0問')).toBeVisible()
  await expect(page.getByRole('button', { name: 'もう一度' })).toBeDisabled()

  await page.getByRole('button', { name: 'トップへ' }).click()
  await expect(
    page.getByRole('button', { name: '苦手を復習する（0問）' }),
  ).toBeDisabled()
  await expect(page.getByText('苦手な問題はありません')).toBeVisible()
})

test('一問一答で間違えた問題は苦手になり、ページを開き直しても残る', async ({
  page,
}) => {
  await page.goto('./')
  await page.getByRole('button', { name: '一問一答を始める' }).click()
  const mistaken = await answerCurrent(page, false)

  // 解答の途中で中断する
  await page.getByRole('button', { name: '中断する' }).click()
  await page
    .getByRole('alertdialog')
    .getByRole('button', { name: '中断する' })
    .click()
  await page.reload()

  await page.getByRole('button', { name: '苦手を復習する（1問）' }).click()
  await expect(page.getByText('1 / 1問')).toBeVisible()
  await expect(
    page.getByRole('heading', { level: 2, name: mistaken.text }),
  ).toBeVisible()

  await answerCurrent(page, true)
  await goNext(page)
  await expect(page.getByText('残りの苦手：0問')).toBeVisible()
})

test('保存内容が壊れていても、アプリが起動して使える', async ({ page }) => {
  await seedHistory(page, '{こわれた')
  await page.goto('./')

  await expect(
    page.getByRole('button', { name: '苦手を復習する（0問）' }),
  ).toBeDisabled()
  await page.getByRole('button', { name: '一問一答を始める' }).click()
  await expect(page.getByText('1 / 10問')).toBeVisible()
})
