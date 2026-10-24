import type { Field } from './judgeExam'

// 過去問の出典（IPA の利用条件により、出典の明記が必要）
export type QuestionSource = {
  exam: string
  number: number
}

export type QuestionFigure = {
  src: string
  alt: string
}

export type Question = {
  id: string
  field: Field
  text: string
  choices: readonly string[]
  answerIndex: number
  explanation: string
  // 以下は過去問で使う項目
  source?: QuestionSource
  // 中問の事例文
  passage?: string
  figure?: QuestionFigure
  // 選択肢が図になっているなど、並び替えられない問題
  fixedChoiceOrder?: boolean
}

export const FIELD_LABELS: Record<Field, string> = {
  strategy: 'ストラテジ',
  management: 'マネジメント',
  technology: 'テクノロジ',
}

export const isPastQuestion = (question: Question): boolean =>
  question.source !== undefined

// 選択肢を並び替えて出題するのは問題の改変にあたるため、その旨も明記する
export const formatSource = (question: Question): string | null => {
  if (!question.source) return null
  const base = `出典：${question.source.exam} 問${question.source.number}`
  return question.fixedChoiceOrder ? base : `${base}（選択肢の順序を変更）`
}
