import type { History } from './history'
import { FIELDS } from './fieldPractice'
import type { Field } from './judgeExam'
import type { Question } from './question'

export type FieldProgress = {
  field: Field
  // 問題集にある、その分野の問題数
  total: number
  // 解いたことのある問題の数（直近の結果で数える）
  answered: number
  correct: number
  // 正解率（％、四捨五入）。解いた問題がないときは null
  rate: number | null
}

// 分野ごとに、問題集の問題のうち解いた数と正解数を数える（問題集にない履歴は数えない）
export const fieldProgress = (
  pool: readonly Question[],
  history: History,
): FieldProgress[] =>
  FIELDS.map((field) => {
    const inField = pool.filter((question) => question.field === field)
    const answered = inField.filter(
      (question) => typeof history[question.id] === 'boolean',
    )
    const correct = answered.filter(
      (question) => history[question.id] === true,
    ).length
    return {
      field,
      total: inField.length,
      answered: answered.length,
      correct,
      rate:
        answered.length === 0
          ? null
          : Math.round((correct / answered.length) * 100),
    }
  })

// 解いた割合（％、四捨五入）。問題がないときも 0 を返す
export const coverageRate = (answered: number, total: number): number =>
  total === 0 ? 0 : Math.round((answered / total) * 100)

export type OverallProgress = Pick<
  FieldProgress,
  'total' | 'answered' | 'correct' | 'rate'
>

// 全分野の合計。分野ごとの数を足して、全体の正解率を出す
export const overallProgress = (
  progress: readonly FieldProgress[],
): OverallProgress => {
  const total = progress.reduce((sum, item) => sum + item.total, 0)
  const answered = progress.reduce((sum, item) => sum + item.answered, 0)
  const correct = progress.reduce((sum, item) => sum + item.correct, 0)
  return {
    total,
    answered,
    correct,
    rate: answered === 0 ? null : Math.round((correct / answered) * 100),
  }
}
