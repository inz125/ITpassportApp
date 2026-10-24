import { describe, expect, it } from 'vitest'
import {
  answerQuestion,
  canStartExam,
  getUnanswered,
  goNextQuestion,
  goPreviousQuestion,
  goToQuestion,
  gradeExam,
  startExam,
  type ExamSession,
} from './examSession'
import type { Field } from './judgeExam'
import type { Question } from './question'

const makeQuestion = (id: string, field: Field = 'strategy'): Question => ({
  id,
  field,
  text: `問題${id}`,
  choices: ['A', 'B', 'C', 'D'],
  answerIndex: 0,
  explanation: '解説',
})

const three = [
  makeQuestion('1', 'strategy'),
  makeQuestion('2', 'management'),
  makeQuestion('3', 'technology'),
]

// 各分野 10 問ずつの 30 問
const thirty: Question[] = (
  ['strategy', 'management', 'technology'] as const
).flatMap((field) =>
  Array.from({ length: 10 }, (_, i) => makeQuestion(`${field}-${i}`, field)),
)

// 各分野の先頭 n 問に正解（0）、それ以外に不正解（1）を入れた 30 問分の解答済み状態
const answeredWith = (
  correctPerField: [number, number, number],
): ExamSession => {
  let session = startExam(thirty)
  thirty.forEach((_, index) => {
    const fieldIndex = Math.floor(index / 10)
    const inField = index % 10
    const choice = inField < correctPerField[fieldIndex] ? 0 : 1
    session = answerQuestion(goToQuestion(session, index), choice)
  })
  return session
}

describe('startExam（開始）', () => {
  it('最初の問題・すべて未回答の状態で始まる', () => {
    const session = startExam(three)

    expect(session.current).toBe(0)
    expect(session.answers).toEqual([null, null, null])
    expect(getUnanswered(session)).toEqual([0, 1, 2])
  })
})

describe('answerQuestion（解答）', () => {
  it('表示中の問題の答えを記録し、他の問題には影響しない', () => {
    const session = answerQuestion(startExam(three), 2)

    expect(session.answers).toEqual([2, null, null])
  })

  it('答えを変更できる', () => {
    const changed = answerQuestion(answerQuestion(startExam(three), 1), 3)

    expect(changed.answers[0]).toBe(3)
  })

  it('範囲外の選択肢は無視される', () => {
    const session = startExam(three)

    expect(answerQuestion(session, -1)).toEqual(session)
    expect(answerQuestion(session, 4)).toEqual(session)
  })

  it('問題がない試験では、何も記録されない', () => {
    const empty = startExam([])

    expect(answerQuestion(empty, 0)).toEqual(empty)
  })
})

describe('問題の移動', () => {
  it('goNextQuestion は次の問題に進み、最後の問題ではそのまま', () => {
    let session = startExam(three)
    session = goNextQuestion(session)
    expect(session.current).toBe(1)
    session = goNextQuestion(goNextQuestion(session))
    expect(session.current).toBe(2)
  })

  it('goPreviousQuestion は前の問題に戻り、最初の問題ではそのまま', () => {
    const session = goToQuestion(startExam(three), 2)

    expect(goPreviousQuestion(session).current).toBe(1)
    expect(goPreviousQuestion(startExam(three)).current).toBe(0)
  })

  it('goToQuestion は指定した問題に移動し、範囲外は無視される', () => {
    const session = startExam(three)

    expect(goToQuestion(session, 2).current).toBe(2)
    expect(goToQuestion(session, -1).current).toBe(0)
    expect(goToQuestion(session, 3).current).toBe(0)
  })

  it('移動しても、記録した答えは残る', () => {
    const session = goNextQuestion(answerQuestion(startExam(three), 1))

    expect(session.answers).toEqual([1, null, null])
  })
})

describe('getUnanswered（未回答）', () => {
  it('解答していない問題の位置を、小さい順に返す', () => {
    let session = startExam(three)
    session = answerQuestion(goToQuestion(session, 1), 0)

    expect(getUnanswered(session)).toEqual([0, 2])
  })
})

describe('gradeExam（採点）', () => {
  it('問題ごとに、選んだ答えと正誤を返す。未回答は不正解になる', () => {
    let session = startExam(three)
    session = answerQuestion(goToQuestion(session, 0), 0)
    session = answerQuestion(goToQuestion(session, 1), 2)

    const { results } = gradeExam(session)

    expect(results.map((r) => [r.question.id, r.selected, r.correct])).toEqual([
      ['1', 0, true],
      ['2', 2, false],
      ['3', null, false],
    ])
  })

  it('全問正解すると、総合1000点・各分野1000点で合格になる', () => {
    const { judgement } = gradeExam(answeredWith([10, 10, 10]))

    expect(judgement).toEqual({
      totalScore: 1000,
      fieldScores: { strategy: 1000, management: 1000, technology: 1000 },
      passed: true,
    })
  })

  it('総合600点ちょうどで各分野300点以上なら合格になる', () => {
    const { judgement } = gradeExam(answeredWith([6, 6, 6]))

    expect(judgement.totalScore).toBe(600)
    expect(judgement.passed).toBe(true)
  })

  it('総合600点以上でも、1分野が300点未満なら不合格になる', () => {
    const { judgement } = gradeExam(answeredWith([10, 10, 2]))

    expect(judgement.totalScore).toBe(733)
    expect(judgement.fieldScores.technology).toBe(200)
    expect(judgement.passed).toBe(false)
  })

  it('未回答は不正解として、全問を分母に含めて採点する', () => {
    // 先頭の1問だけ正解、残りは未回答
    const session = answerQuestion(startExam(thirty), 0)

    const { judgement } = gradeExam(session)

    expect(judgement.totalScore).toBe(33)
    expect(judgement.passed).toBe(false)
  })
})

describe('canStartExam（開始できるか）', () => {
  it('3つの分野すべてに問題があれば、開始できる', () => {
    expect(canStartExam(three)).toBe(true)
  })

  it('問題がない分野があれば、開始できない', () => {
    expect(canStartExam(three.slice(0, 2))).toBe(false)
    expect(canStartExam([])).toBe(false)
  })
})
