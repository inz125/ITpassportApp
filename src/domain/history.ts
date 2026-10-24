import type { Question } from './question'

// 問題の id ごとに「最後に解いたときの正誤」だけを持つ（true: 正解、false: 不正解）
export type History = Readonly<Record<string, boolean>>

export const recordAnswer = (
  history: History,
  questionId: string,
  correct: boolean,
): History => ({ ...history, [questionId]: correct })

// 問題集にない問題の履歴は無視するため、問題集の側から絞り込む
export const pickWeakQuestions = (
  pool: readonly Question[],
  history: History,
): Question[] => pool.filter((question) => history[question.id] === false)

export const countWeak = (
  pool: readonly Question[],
  history: History,
): number => pickWeakQuestions(pool, history).length
