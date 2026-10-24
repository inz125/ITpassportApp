import type { Question } from './question'

export type PastExam = {
  name: string
  // 問番号の順
  questions: readonly Question[]
}

// 過去問を試験名（回）ごとにまとめる。回は現れた順、各回の問題は問番号の順に並べる
export const groupPastExams = (questions: readonly Question[]): PastExam[] => {
  const byName = new Map<string, Question[]>()
  for (const question of questions) {
    if (!question.source) continue
    const group = byName.get(question.source.exam) ?? []
    group.push(question)
    byName.set(question.source.exam, group)
  }
  return [...byName].map(([name, group]) => ({
    name,
    questions: group.toSorted((a, b) => a.source!.number - b.source!.number),
  }))
}

// ボタンに出す短い名前。例: 「令和8年度 ITパスポート試験 公開問題」→「令和8年度 公開問題」
export const shortExamName = (name: string): string =>
  name.replace('ITパスポート試験 ', '')
