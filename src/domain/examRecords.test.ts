import { describe, expect, it } from 'vitest'
import {
  addExamRecord,
  CHART_RECORDS,
  MAX_EXAM_RECORDS,
  recentExamRecords,
  type ExamRecord,
} from './examRecords'

const record = (at: number): ExamRecord => ({
  exam: '模擬試験',
  at,
  totalScore: 600,
  passed: true,
  fieldScores: { strategy: 600, management: 600, technology: 600 },
  elapsedMs: 1000,
})

describe('addExamRecord（模擬試験の成績の保存）', () => {
  it('成績を末尾に追加する（古い順に並ぶ）', () => {
    const records = addExamRecord([record(1)], record(2))

    expect(records.map((r) => r.at)).toEqual([1, 2])
  })

  it('直近50回を超えたら、古いものから捨てる', () => {
    const full = Array.from({ length: MAX_EXAM_RECORDS }, (_, i) => record(i))

    const records = addExamRecord(full, record(999))

    expect(records).toHaveLength(MAX_EXAM_RECORDS)
    expect(records[0].at).toBe(1)
    expect(records.at(-1)!.at).toBe(999)
  })

  it('元の配列を変えない', () => {
    const original = [record(1)]

    addExamRecord(original, record(2))

    expect(original).toHaveLength(1)
  })
})

describe('recentExamRecords（グラフに出す直近の成績）', () => {
  it('直近10回を、古い順に返す', () => {
    const records = Array.from({ length: 12 }, (_, i) => record(i))

    const recent = recentExamRecords(records)

    expect(recent).toHaveLength(CHART_RECORDS)
    expect(recent[0].at).toBe(2)
    expect(recent.at(-1)!.at).toBe(11)
  })

  it('10回未満なら、あるだけ返す', () => {
    expect(recentExamRecords([record(1)])).toHaveLength(1)
  })
})
