import { expect, test, type Page } from '@playwright/test'
import { R08_QUESTIONS } from '../src/data/pastExams/r08'
import { answerCurrent } from './helpers'

// 模擬試験は過去問1回分（令和8年度 公開問題の100問）で受ける
const TOTAL = R08_QUESTIONS.length
const MOCK_EXAM = '模擬試験（令和8年度 公開問題）'

// 100問を通しで解くので、時間に余裕を持たせる
test.describe.configure({ timeout: 120_000 })

// 全問を順に解いて、確認画面まで進む。answers[i] が null の問題は答えない
const solveAll = async (page: Page, answers: Array<boolean | null>) => {
  for (const [index, correct] of answers.entries()) {
    await expect(page.getByText(`${index + 1} / ${TOTAL}問`)).toBeVisible()
    if (correct !== null) await answerCurrent(page, correct)
    if (index < answers.length - 1) {
      await page.getByRole('button', { name: '次へ', exact: true }).click()
    }
  }
  await page.getByRole('button', { name: '確認へ' }).click()
}

const startExam = async (page: Page) => {
  await page.goto('./')
  await page.getByRole('button', { name: MOCK_EXAM }).click()
}

const hasHorizontalScroll = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)

test('全問正解して提出すると、合格と1000点が表示される', async ({ page }) => {
  await startExam(page)

  await solveAll(page, Array(TOTAL).fill(true))
  await expect(page.getByText('すべての問題に解答済みです')).toBeVisible()
  await page.getByRole('button', { name: '提出する' }).click()

  await expect(page.getByText('合格', { exact: true })).toBeVisible()
  await expect(page.getByText('総合：1000点')).toBeVisible()
  await expect(page.getByText(/^所要時間：\d{2}:\d{2}$/)).toBeVisible()
  await expect(page.getByRole('listitem')).toHaveCount(TOTAL)
})

test('全問間違えて提出すると不合格になり、すべて苦手になる', async ({
  page,
}) => {
  await startExam(page)

  await solveAll(page, Array(TOTAL).fill(false))
  await page.getByRole('button', { name: '提出する' }).click()
  await expect(page.getByText('不合格', { exact: true })).toBeVisible()
  await expect(page.getByText('総合：0点')).toBeVisible()

  await page.getByRole('button', { name: 'トップへ' }).click()
  await expect(
    page.getByRole('button', { name: `苦手を復習する（${TOTAL}問）` }),
  ).toBeEnabled()
})

test('未回答を残したまま提出すると、不正解として採点される', async ({
  page,
}) => {
  await startExam(page)

  await solveAll(page, [true, ...Array(TOTAL - 1).fill(null)])
  await expect(page.getByText(`未回答が${TOTAL - 1}問あります`)).toBeVisible()
  await page.getByRole('button', { name: '提出する' }).click()

  await expect(page.getByText('不合格', { exact: true })).toBeVisible()
  // 1問だけ正解。未回答は不正解として、全問を分母に採点される
  await expect(
    page.getByText(`総合：${Math.round((1 / TOTAL) * 1000)}点`),
  ).toBeVisible()
  const second = page.getByRole('listitem').nth(1)
  await second.getByRole('button').click()
  await expect(second.getByText('あなたの答え：未回答')).toBeVisible()
})

test('解答中に中断すると、履歴に記録されずトップに戻る', async ({ page }) => {
  await startExam(page)
  await answerCurrent(page, false)

  await page.getByRole('button', { name: '中断する' }).click()
  await page
    .getByRole('alertdialog')
    .getByRole('button', { name: '中断する' })
    .click()

  await expect(page.getByRole('button', { name: MOCK_EXAM })).toBeVisible()
  await expect(
    page.getByRole('button', { name: '苦手を復習する（0問）' }),
  ).toBeDisabled()
})

test('解答中・確認・結果の画面で、横スクロールが発生しない', async ({
  page,
}) => {
  await startExam(page)
  expect(await hasHorizontalScroll(page)).toBe(false)

  await solveAll(page, Array(TOTAL).fill(false))
  expect(await hasHorizontalScroll(page)).toBe(false)

  await page.getByRole('button', { name: '提出する' }).click()
  expect(await hasHorizontalScroll(page)).toBe(false)
  await page.getByRole('listitem').first().getByRole('button').click()
  expect(await hasHorizontalScroll(page)).toBe(false)
})

test('過去問の模擬試験は、問番号の順に出題され、オリジナル問題は含まれない', async ({
  page,
}) => {
  await startExam(page)

  await expect(page.getByText(`1 / ${TOTAL}問`)).toBeVisible()
  const exam = '令和8年度 ITパスポート試験 公開問題'
  await expect(
    page.getByText(`出典：${exam} 問1（選択肢の順序を変更）`),
  ).toBeVisible()

  await page.getByRole('button', { name: '次へ', exact: true }).click()
  await expect(page.getByText(`2 / ${TOTAL}問`)).toBeVisible()
  await expect(
    page.getByText(`出典：${exam} 問2（選択肢の順序を変更）`),
  ).toBeVisible()

  // 一問一答などのためのボタンは、過去問がある間は「模擬試験を始める」ではなくなる
  await page.getByRole('button', { name: '中断する' }).click()
  await page
    .getByRole('alertdialog')
    .getByRole('button', { name: '中断する' })
    .click()
  await expect(
    page.getByRole('button', { name: '模擬試験を始める' }),
  ).toHaveCount(0)
})
