import { describe, expect, it } from 'vitest'
import type { History } from './history'
import { coverageRate, fieldProgress, overallProgress } from './stats'
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

describe('coverageRate（解いた割合）', () => {
  it('解いた数 ÷ 問題数を、四捨五入した％で返す', () => {
    expect(coverageRate(1, 3)).toBe(33)
    expect(coverageRate(2, 3)).toBe(67)
    expect(coverageRate(3, 3)).toBe(100)
  })

  it('1問も解いていないときは 0', () => {
    expect(coverageRate(0, 10)).toBe(0)
  })

  it('問題が0のときも、0 を返す（0で割らない）', () => {
    expect(coverageRate(0, 0)).toBe(0)
  })
})

describe('overallProgress（全分野の合計）', () => {
  it('分野ごとの数を合計して、解いた数・正解数・全問題数・正解率を返す', () => {
    // ストラテジ 2問（1問解いた・正解）、マネジメント 1問（解いた・不正解）、テクノロジ 1問（未）
    const total = overallProgress(
      fieldProgress(pool, { '1': true, '2': false }),
    )

    expect(total).toEqual({ total: 4, answered: 2, correct: 1, rate: 50 })
  })

  it('何も解いていないときは、正解率がない（null）', () => {
    const total = overallProgress(fieldProgress(pool, {}))

    expect(total).toEqual({ total: 4, answered: 0, correct: 0, rate: null })
  })
})
