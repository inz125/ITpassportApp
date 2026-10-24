import { describe, expect, it } from 'vitest'
import type { Field } from '../domain/judgeExam'
import { isPastQuestion } from '../domain/question'
import { ORIGINAL_QUESTIONS, QUESTIONS } from './questions'

const countByField = (field: Field) =>
  ORIGINAL_QUESTIONS.filter((question) => question.field === field).length

const PAST_QUESTIONS = QUESTIONS.filter(isPastQuestion)

describe('QUESTIONS（問題データ）', () => {
  it('オリジナル問題は30問ある', () => {
    expect(ORIGINAL_QUESTIONS).toHaveLength(30)
  })

  it('オリジナル問題は、ストラテジ・マネジメント・テクノロジが10問ずつある', () => {
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

  // 正解だけ長い問題は、内容が分からなくても長さで当てられてしまう
  describe('オリジナル問題の選択肢の長さに偏りがない（過去問は原文のまま）', () => {
    const length = (text: string) => [...text].length

    it('正解の選択肢が誤答の平均の1.5倍を超えて長い問題がない', () => {
      for (const question of ORIGINAL_QUESTIONS) {
        const answer = length(question.choices[question.answerIndex])
        const others = question.choices
          .filter((_, index) => index !== question.answerIndex)
          .map(length)
        const average = others.reduce((sum, n) => sum + n, 0) / others.length

        expect(answer / average, question.id).toBeLessThanOrEqual(1.5)
      }
    })

    it('正解の選択肢がいちばん長い問題は、全体の40%以下である', () => {
      const longestAnswer = ORIGINAL_QUESTIONS.filter((question) => {
        const lengths = question.choices.map(length)
        const answer = lengths[question.answerIndex]
        return lengths.every(
          (n, index) => index === question.answerIndex || n < answer,
        )
      })

      expect(longestAnswer.length).toBeLessThanOrEqual(
        ORIGINAL_QUESTIONS.length * 0.4,
      )
    })
  })

  describe('過去問', () => {
    it('過去問には、出典（試験名と問番号）が必ずある', () => {
      for (const question of PAST_QUESTIONS) {
        expect(question.source!.exam.trim(), question.id).not.toBe('')
        expect(Number.isInteger(question.source!.number), question.id).toBe(
          true,
        )
        expect(question.source!.number, question.id).toBeGreaterThan(0)
      }
    })

    it('同じ試験の中で、問番号が重複しない', () => {
      const keys = PAST_QUESTIONS.map(
        (q) => `${q.source!.exam} 問${q.source!.number}`,
      )

      expect(new Set(keys).size).toBe(keys.length)
    })

    it('図がある問題は、画像の URL と代替テキストを持つ', () => {
      for (const question of QUESTIONS.filter((q) => q.figure)) {
        expect(question.figure!.src, question.id).not.toBe('')
        expect(question.figure!.alt.trim(), question.id).not.toBe('')
      }
    })

    it('事例文がある問題は、事例文が空でない', () => {
      for (const question of QUESTIONS.filter((q) => q.passage !== undefined)) {
        expect(question.passage!.trim(), question.id).not.toBe('')
      }
    })
  })
})
