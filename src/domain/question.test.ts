import { describe, expect, it } from 'vitest'
import {
  choiceLabel,
  formatSource,
  isPastQuestion,
  type Question,
} from './question'

const original: Question = {
  id: 'strategy-1',
  field: 'strategy',
  text: 'オリジナルの問題',
  choices: ['A', 'B', 'C', 'D'],
  answerIndex: 0,
  explanation: '解説',
}

const past: Question = {
  ...original,
  id: 'r08-12',
  source: { exam: '令和8年度 ITパスポート試験 公開問題', number: 12 },
}

describe('isPastQuestion（過去問かどうか）', () => {
  it('出典がある問題は過去問、ない問題はオリジナル問題', () => {
    expect(isPastQuestion(past)).toBe(true)
    expect(isPastQuestion(original)).toBe(false)
  })
})

describe('formatSource（出典の表示）', () => {
  it('選択肢を並び替える過去問は、その旨を添えて出典を表示する', () => {
    expect(formatSource(past)).toBe(
      '出典：令和8年度 ITパスポート試験 公開問題 問12（選択肢の順序を変更）',
    )
  })

  it('選択肢を並び替えない過去問は、出典だけを表示する', () => {
    expect(formatSource({ ...past, fixedChoiceOrder: true })).toBe(
      '出典：令和8年度 ITパスポート試験 公開問題 問12',
    )
  })

  it('オリジナル問題には出典がない', () => {
    expect(formatSource(original)).toBeNull()
  })
})

describe('choiceLabel（選択肢の記号）', () => {
  it('表示の位置に ア・イ・ウ・エ を付ける', () => {
    expect([0, 1, 2, 3].map((i) => choiceLabel(i))).toEqual([
      'ア',
      'イ',
      'ウ',
      'エ',
    ])
  })
})
