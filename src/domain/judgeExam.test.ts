import { describe, expect, it } from 'vitest'
import { judgeExam } from './judgeExam'

// ITパスポート試験の合格基準（1000点満点換算）
// - 総合評価点が 600 点以上
// - 分野別評価点（ストラテジ・マネジメント・テクノロジ）がそれぞれ 300 点以上
describe('judgeExam（模擬試験の合否判定）', () => {
  it('全分野で全問正解すると総合1000点で合格になる', () => {
    const result = judgeExam({
      strategy: { correct: 35, total: 35 },
      management: { correct: 20, total: 20 },
      technology: { correct: 45, total: 45 },
    })

    expect(result).toEqual({
      totalScore: 1000,
      fieldScores: { strategy: 1000, management: 1000, technology: 1000 },
      passed: true,
    })
  })

  it('総合600点ちょうどで各分野300点以上なら合格になる', () => {
    const result = judgeExam({
      strategy: { correct: 6, total: 10 },
      management: { correct: 6, total: 10 },
      technology: { correct: 6, total: 10 },
    })

    expect(result.totalScore).toBe(600)
    expect(result.passed).toBe(true)
  })

  it('総合が600点未満だと不合格になる', () => {
    const result = judgeExam({
      strategy: { correct: 5, total: 10 },
      management: { correct: 6, total: 10 },
      technology: { correct: 6, total: 10 },
    })

    expect(result.totalScore).toBe(567)
    expect(result.passed).toBe(false)
  })

  it('総合600点以上でも1分野が300点未満なら不合格になる', () => {
    const result = judgeExam({
      strategy: { correct: 10, total: 10 },
      management: { correct: 2, total: 10 },
      technology: { correct: 10, total: 10 },
    })

    expect(result.totalScore).toBe(733)
    expect(result.fieldScores.management).toBe(200)
    expect(result.passed).toBe(false)
  })

  it('分野別300点ちょうどは基準を満たす', () => {
    const result = judgeExam({
      strategy: { correct: 3, total: 10 },
      management: { correct: 10, total: 10 },
      technology: { correct: 10, total: 10 },
    })

    expect(result.fieldScores.strategy).toBe(300)
    expect(result.passed).toBe(true)
  })

  it('出題数が0の分野があるとエラーになる', () => {
    expect(() =>
      judgeExam({
        strategy: { correct: 0, total: 0 },
        management: { correct: 1, total: 1 },
        technology: { correct: 1, total: 1 },
      }),
    ).toThrow('出題数は1以上')
  })

  it('正解数が出題数を超えるとエラーになる', () => {
    expect(() =>
      judgeExam({
        strategy: { correct: 11, total: 10 },
        management: { correct: 1, total: 1 },
        technology: { correct: 1, total: 1 },
      }),
    ).toThrow('正解数は0以上かつ出題数以下')
  })
})
