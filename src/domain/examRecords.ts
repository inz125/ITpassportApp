import type { Field } from './judgeExam'

// 提出した模擬試験の成績
export type ExamRecord = {
  // 模擬試験の名前（例：模擬試験（令和8年度 公開問題））
  exam: string
  // 提出した時刻（ミリ秒）
  at: number
  totalScore: number
  passed: boolean
  fieldScores: Record<Field, number>
  // 所要時間（ミリ秒）
  elapsedMs: number
}

export const MAX_EXAM_RECORDS = 50
export const CHART_RECORDS = 10

// 古い順に並べ、直近 MAX_EXAM_RECORDS 回だけ残す
export const addExamRecord = (
  records: readonly ExamRecord[],
  record: ExamRecord,
): ExamRecord[] => [...records, record].slice(-MAX_EXAM_RECORDS)

// グラフに出す直近の成績を、古い順に返す
export const recentExamRecords = (
  records: readonly ExamRecord[],
  count: number = CHART_RECORDS,
): ExamRecord[] => records.slice(-count)
