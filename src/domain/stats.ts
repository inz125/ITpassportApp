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
