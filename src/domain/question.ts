import type { Field } from './judgeExam'

// 過去問の出典（IPA の利用条件により、出典の明記が必要）
export type QuestionSource = {
  exam: string
  number: number
}

// 図の画像は src/data/figures/<回>/ に置き、データ側で
// new URL('../figures/r08/q003.png', import.meta.url).href のように参照する。
// Vite がビルド時に配信用の URL（ベースパス・ハッシュ付き）に変換し、
// Node（E2E やテスト）でもそのまま読み込める
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
  // 並び替えたあとも、元の記号（ア〜エ）を選択肢と一緒に持ち歩くための記号。過去問だけが持つ。
  // 解説の「アは〜」と合わせるため。オリジナル問題は、元の位置が正解（先頭）と分かってしまうので持たない
  choiceLabels?: readonly string[]
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

const KANA = ['ア', 'イ', 'ウ', 'エ']

// 選択肢の左に表示する記号。決まっていなければ、表示の位置に ア・イ・ウ・エ を付ける
export const choiceLabel = (question: Question, index: number): string =>
  question.choiceLabels?.[index] ?? KANA[index]

// 元の順（ア〜エ）に付ける記号
export const ORIGINAL_CHOICE_LABELS: readonly string[] = KANA
