import { describe, expect, it } from 'vitest'
import type { Field } from './judgeExam'
import { FIELDS, countByField, pickByField } from './fieldPractice'
import type { Question } from './question'

const makeQuestion = (id: string, field: Field): Question => ({
  id,
  field,
  text: `問題${id}`,
  choices: ['A', 'B', 'C', 'D'],
  answerIndex: 0,
  explanation: '解説',
})

const pool: Question[] = [
  makeQuestion('1', 'strategy'),
  makeQuestion('2', 'management'),
  makeQuestion('3', 'strategy'),
  makeQuestion('4', 'technology'),
]

describe('FIELDS（分野の一覧）', () => {
  it('ストラテジ・マネジメント・テクノロジの順に並ぶ', () => {
    expect(FIELDS).toEqual(['strategy', 'management', 'technology'])
  })
})

describe('pickByField（分野で絞り込み）', () => {
  it('指定した分野の問題だけを、問題集の順に返す', () => {
    const picked = pickByField(pool, 'strategy')

    expect(picked.map((q) => q.id)).toEqual(['1', '3'])
  })

  it('その分野の問題がないときは、空になる', () => {
    expect(pickByField(pool.slice(0, 1), 'technology')).toEqual([])
  })
})

describe('countByField（分野ごとの問題数）', () => {
  it('分野ごとの問題数を返し、問題がない分野は0になる', () => {
    expect(countByField(pool.slice(0, 3))).toEqual({
      strategy: 2,
      management: 1,
      technology: 0,
    })
  })
})
