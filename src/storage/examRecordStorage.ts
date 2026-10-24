import type { ExamRecord } from '../domain/examRecords'
import { FIELDS } from '../domain/fieldPractice'
import type { Field } from '../domain/judgeExam'

// 保存形式を変えるときは、末尾のバージョンを上げる
export const EXAM_RECORD_STORAGE_KEY = 'itpassport-app:exam-records:v1'

type ReadableStorage = Pick<Storage, 'getItem'>
type WritableStorage = Pick<Storage, 'setItem'>

const isFieldScores = (value: unknown): value is Record<Field, number> =>
  typeof value === 'object' &&
  value !== null &&
  FIELDS.every(
    (field) => typeof (value as Record<string, unknown>)[field] === 'number',
  )

const isExamRecord = (value: unknown): value is ExamRecord =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as ExamRecord).exam === 'string' &&
  typeof (value as ExamRecord).at === 'number' &&
  typeof (value as ExamRecord).totalScore === 'number' &&
  typeof (value as ExamRecord).passed === 'boolean' &&
  isFieldScores((value as ExamRecord).fieldScores) &&
  typeof (value as ExamRecord).elapsedMs === 'number'

export const loadExamRecords = (
  storage: ReadableStorage | null,
): ExamRecord[] => {
  try {
    const raw = storage?.getItem(EXAM_RECORD_STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isExamRecord)
  } catch {
    return []
  }
}

export const saveExamRecords = (
  storage: WritableStorage | null,
  records: readonly ExamRecord[],
): void => {
  try {
    storage?.setItem(EXAM_RECORD_STORAGE_KEY, JSON.stringify(records))
  } catch {
    // 保存できなくても学習は続けられるようにする（成績は残らない）
  }
}
