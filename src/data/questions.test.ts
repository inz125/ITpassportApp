import { describe, expect, it } from 'vitest'
import type { Field } from '../domain/judgeExam'
import { QUESTIONS } from './questions'

const countByField = (field: Field) =>
  QUESTIONS.filter((question) => question.field === field).length

describe('QUESTIONS（問題データ）', () => {
  it('問題は30問ある', () => {
    expect(QUESTIONS).toHaveLength(30)
  })

  it('ストラテジ・マネジメント・テクノロジが10問ずつある', () => {
    expect(countByField('strategy')).toBe(10)
    expect(countByField('management')).toBe(10)
    expect(countByField('technology')).toBe(10)
  })

  it('すべての問題が4つの選択肢を持つ', () => {
    for (const question of QUESTIONS) {
      expect(question.choices, question.id).toHaveLength(4)
    }
  })

  it('すべての問題で、正解の選択肢がちょうど1つ存在する', () => {
    for (const question of QUESTIONS) {
      expect(Number.isInteger(question.answerIndex), question.id).toBe(true)
      expect(question.answerIndex, question.id).toBeGreaterThanOrEqual(0)
      expect(question.answerIndex, question.id).toBeLessThan(
        question.choices.length,
      )
      const answer = question.choices[question.answerIndex]
      const sameAsAnswer = question.choices.filter((c) => c === answer)
      expect(sameAsAnswer, question.id).toHaveLength(1)
    }
  })

  it('すべての問題が空でない問題文と解説を持つ', () => {
    for (const question of QUESTIONS) {
      expect(question.text.trim(), question.id).not.toBe('')
      expect(question.explanation.trim(), question.id).not.toBe('')
    }
  })

  it('問題の id が重複しない', () => {
    const ids = QUESTIONS.map((question) => question.id)

    expect(new Set(ids).size).toBe(ids.length)
  })

  it('1つの問題内で選択肢の文言が重複せず、空でもない', () => {
    for (const question of QUESTIONS) {
      expect(new Set(question.choices).size, question.id).toBe(
        question.choices.length,
      )
      for (const choice of question.choices) {
        expect(choice.trim(), question.id).not.toBe('')
      }
    }
  })
})
