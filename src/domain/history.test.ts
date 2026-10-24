import { describe, expect, it } from 'vitest'
import {
  countWeak,
  pickWeakQuestions,
  recordAnswer,
  type History,
} from './history'
import type { Question } from './question'

const makeQuestion = (id: string): Question => ({
  id,
  field: 'strategy',
  text: `問題${id}`,
  choices: ['A', 'B', 'C', 'D'],
  answerIndex: 0,
  explanation: '解説',
})

const pool = ['1', '2', '3', '4'].map(makeQuestion)

describe('recordAnswer（解答の記録）', () => {
  it('問題ごとの正誤を記録する', () => {
    const history = recordAnswer(recordAnswer({}, '1', true), '2', false)

    expect(history).toEqual({ '1': true, '2': false })
  })

  it('同じ問題を解き直すと、最新の正誤に置き換わる', () => {
    const wrong = recordAnswer({}, '1', false)

    expect(recordAnswer(wrong, '1', true)).toEqual({ '1': true })
  })

  it('元の履歴を変更しない', () => {
    const history: History = { '1': false }

    recordAnswer(history, '1', true)

    expect(history).toEqual({ '1': false })
  })
})

describe('pickWeakQuestions（苦手の問題）', () => {
  it('最後に不正解だった問題だけが苦手になる', () => {
    const history: History = { '1': false, '2': true, '3': false }

    const weak = pickWeakQuestions(pool, history)

    expect(weak.map((q) => q.id)).toEqual(['1', '3'])
  })

  it('苦手の問題を正解すると、苦手から外れる', () => {
    const wrong = recordAnswer({}, '1', false)
    expect(pickWeakQuestions(pool, wrong)).toHaveLength(1)

    const fixed = recordAnswer(wrong, '1', true)

    expect(pickWeakQuestions(pool, fixed)).toHaveLength(0)
  })

  it('まだ解いていない問題は苦手に含まれない', () => {
    expect(pickWeakQuestions(pool, {})).toEqual([])
  })

  it('問題集にない問題の履歴は無視される', () => {
    const history: History = { '1': false, 'deleted-question': false }

    const weak = pickWeakQuestions(pool, history)

    expect(weak.map((q) => q.id)).toEqual(['1'])
  })
})

describe('countWeak（苦手の数）', () => {
  it('苦手の問題の数を返す', () => {
    const history: History = { '1': false, '2': false, '3': true }

    expect(countWeak(pool, history)).toBe(2)
  })

  it('問題集にない問題の履歴は数えない', () => {
    expect(countWeak(pool, { gone: false })).toBe(0)
  })
})
