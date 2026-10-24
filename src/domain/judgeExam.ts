export type Field = 'strategy' | 'management' | 'technology'

export type FieldResult = {
  correct: number
  total: number
}

export type ExamJudgement = {
  totalScore: number
  fieldScores: Record<Field, number>
  passed: boolean
}

const FULL_SCORE = 1000
const TOTAL_PASSING_SCORE = 600
const FIELD_PASSING_SCORE = 300
const FIELDS: readonly Field[] = ['strategy', 'management', 'technology']

const toScore = (correct: number, total: number): number =>
  Math.round((correct / total) * FULL_SCORE)

const validate = ({ correct, total }: FieldResult): void => {
  if (total < 1) {
    throw new Error('出題数は1以上である必要があります')
  }
  if (correct < 0 || correct > total) {
    throw new Error('正解数は0以上かつ出題数以下である必要があります')
  }
}

export const judgeExam = (
  results: Record<Field, FieldResult>,
): ExamJudgement => {
  FIELDS.forEach((field) => validate(results[field]))

  const fieldScores = Object.fromEntries(
    FIELDS.map((field) => [
      field,
      toScore(results[field].correct, results[field].total),
    ]),
  ) as Record<Field, number>

  const correct = FIELDS.reduce((sum, field) => sum + results[field].correct, 0)
  const total = FIELDS.reduce((sum, field) => sum + results[field].total, 0)
  const totalScore = toScore(correct, total)

  const passed =
    totalScore >= TOTAL_PASSING_SCORE &&
    FIELDS.every((field) => fieldScores[field] >= FIELD_PASSING_SCORE)

  return { totalScore, fieldScores, passed }
}
