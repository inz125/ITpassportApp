import { describe, expect, it } from 'vitest'
import type { Question } from './question'
import {
  countCorrect,
  getResults,
  goNext,
  isAnswerCorrect,
  isFinished,
  selectChoice,
  startSession,
} from './quizSession'

const makeQuestion = (id: string, answerIndex = 0): Question => ({
  id,
  field: 'technology',
  text: `問題${id}`,
  choices: ['A', 'B', 'C', 'D'],
  answerIndex,
  explanation: '解説',
})

const questions = [
  makeQuestion('1', 0),
  makeQuestion('2', 1),
  makeQuestion('3', 2),
]

describe('startSession（開始）', () => {
  it('最初の問題・未解答の状態で始まる', () => {
    const session = startSession(questions)

    expect(session.current).toBe(0)
    expect(session.selected).toBeNull()
    expect(session.answers).toEqual([])
    expect(isFinished(session)).toBe(false)
  })
})

describe('selectChoice（解答）', () => {
  it('選択肢を選ぶと解答が確定する', () => {
    const session = selectChoice(startSession(questions), 2)

    expect(session.selected).toBe(2)
  })

  it('解答済みの問題では選択肢を変更できない', () => {
    const answered = selectChoice(startSession(questions), 1)

    expect(selectChoice(answered, 2).selected).toBe(1)
  })

  it('範囲外の選択肢は無視される', () => {
    const session = startSession(questions)

    expect(selectChoice(session, -1).selected).toBeNull()
    expect(selectChoice(session, 4).selected).toBeNull()
  })
})

describe('isAnswerCorrect（正誤判定）', () => {
  it('未解答のときは null になる', () => {
    expect(isAnswerCorrect(startSession(questions))).toBeNull()
  })

  it('正解の選択肢を選ぶと true になる', () => {
    expect(isAnswerCorrect(selectChoice(startSession(questions), 0))).toBe(true)
  })

  it('不正解の選択肢を選ぶと false になる', () => {
    expect(isAnswerCorrect(selectChoice(startSession(questions), 3))).toBe(
      false,
    )
  })
})

describe('goNext（次の問題へ）', () => {
  it('未解答のときは進まない', () => {
    const session = startSession(questions)

    expect(goNext(session)).toEqual(session)
  })

  it('解答済みなら次の問題に進み、解答が記録されて選択状態が戻る', () => {
    const session = goNext(selectChoice(startSession(questions), 3))

    expect(session.current).toBe(1)
    expect(session.selected).toBeNull()
    expect(session.answers).toEqual([3])
  })

  it('最後の問題で進むと終了状態になる', () => {
    let session = startSession(questions)
    for (let i = 0; i < questions.length; i++) {
      session = goNext(selectChoice(session, 0))
    }

    expect(isFinished(session)).toBe(true)
  })

  it('終了後にさらに進んでも状態は変わらない', () => {
    let session = startSession([makeQuestion('1')])
    session = goNext(selectChoice(session, 0))

    expect(goNext(session)).toEqual(session)
  })
})

describe('getResults / countCorrect（結果）', () => {
  it('問題ごとの正誤と正解数を返す', () => {
    // 正解は 0, 1, 2 番目。解答は 0（正解）, 3（不正解）, 2（正解）
    let session = startSession(questions)
    for (const choice of [0, 3, 2]) {
      session = goNext(selectChoice(session, choice))
    }

    const results = getResults(session)

    expect(results.map((r) => r.correct)).toEqual([true, false, true])
    expect(results.map((r) => r.question.id)).toEqual(['1', '2', '3'])
    expect(countCorrect(results)).toBe(2)
  })
})
