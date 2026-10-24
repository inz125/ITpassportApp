import type { Field } from './judgeExam'

export type Question = {
  id: string
  field: Field
  text: string
  choices: readonly string[]
  answerIndex: number
  explanation: string
}

export const FIELD_LABELS: Record<Field, string> = {
  strategy: 'ストラテジ',
  management: 'マネジメント',
  technology: 'テクノロジ',
}
