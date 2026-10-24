import { describe, expect, it } from 'vitest'
import type { History } from './history'
import { fieldProgress } from './stats'
import type { Question } from './question'

const make = (id: string, field: Question['field']): Question => ({
  id,
  field,
  text: `問題${id}`,
  choices: ['正解', '誤り1', '誤り2', '誤り3'],
  answerIndex: 0,
  explanation: '解説',
})

// ストラテジ: 1, 4 ／ マネジメント: 2 ／ テクノロジ: 3
const pool: Question[] = [
  make('1', 'strategy'),
  make('2', 'management'),
  make('3', 'technology'),
  make('4', 'strategy'),
]

const progressOf = (history: History) =>
  Object.fromEntries(
    fieldProgress(pool, history).map((progress) => [progress.field, progress]),
  )

describe('fieldProgress（分野別の正解率）', () => {
  it('解いた履歴がないと、どの分野も解いた数は0で、正解率はない', () => {
    const progress = progressOf({})

    expect(progress.strategy).toEqual({
      field: 'strategy',
      total: 2,
      answered: 0,
      correct: 0,
      rate: null,
    })
  })

  it('直近の結果で、解いた数と正解数を数える', () => {
    // 1 は正解、4 は不正解
    const progress = progressOf({ '1': true, '4': false })

    expect(progress.strategy).toMatchObject({ answered: 2, correct: 1 })
  })

  it('正解率は四捨五入した％で表す', () => {
    // 2問中1問正解 → 50%、3問中2問正解 → 67%
    expect(progressOf({ '1': true, '4': false }).strategy.rate).toBe(50)
    expect(progressOf({ '2': true }).management.rate).toBe(100)
  })

  it('問題集にない問題の履歴は数えない', () => {
    const progress = progressOf({ deleted: true, '3': false })

    expect(progress.strategy.answered).toBe(0)
    expect(progress.technology).toMatchObject({ answered: 1, correct: 0 })
  })

  it('分野は、ストラテジ・マネジメント・テクノロジの順で返す', () => {
    expect(fieldProgress(pool, {}).map((p) => p.field)).toEqual([
      'strategy',
      'management',
      'technology',
    ])
  })
})
