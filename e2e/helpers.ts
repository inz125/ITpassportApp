import { type Page } from '@playwright/test'
import { QUESTIONS } from '../src/data/questions'

// 表示中の問題を、問題データから引いて正解 / 不正解の選択肢をタップする
export const answerCurrent = async (page: Page, correct: boolean) => {
  const text = await page.getByRole('heading', { level: 2 }).textContent()
  const question = QUESTIONS.find((q) => q.text === text)!
  const choice = correct
    ? question.choices[question.answerIndex]
    : question.choices.find((_, index) => index !== question.answerIndex)!
  await page.getByRole('button', { name: choice, exact: true }).click()
  return question
}

export const goNext = (page: Page) =>
  page.getByRole('button', { name: /次の問題へ|結果を見る/ }).click()
