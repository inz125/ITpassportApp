import { describe, expect, it } from 'vitest'
import type { ExamRecord } from '../domain/examRecords'
import {
  EXAM_RECORD_STORAGE_KEY,
  loadExamRecords,
  saveExamRecords,
} from './examRecordStorage'

const record: ExamRecord = {
  exam: '模擬試験（令和8年度 公開問題）',
  at: 1_700_000_000_000,
  totalScore: 720,
  passed: true,
  fieldScores: { strategy: 700, management: 650, technology: 780 },
  elapsedMs: 3_600_000,
}

const memoryStorage = () => {
  const data = new Map<string, string>()
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
  }
}

describe('examRecordStorage（模擬試験の成績の保存）', () => {
  it('保存した成績を、読み直すと同じ内容で取り出せる', () => {
    const storage = memoryStorage()

    saveExamRecords(storage, [record])

    expect(loadExamRecords(storage)).toEqual([record])
  })

  it('保存がまだないときは、空の一覧を返す', () => {
    expect(loadExamRecords(memoryStorage())).toEqual([])
  })

  it('保存内容が壊れていたら、空の一覧として扱う', () => {
    const storage = memoryStorage()
    storage.setItem(EXAM_RECORD_STORAGE_KEY, '{こわれた')

    expect(loadExamRecords(storage)).toEqual([])
  })

  it('形の違う要素は読み飛ばし、正しい成績だけ残す', () => {
    const storage = memoryStorage()
    storage.setItem(
      EXAM_RECORD_STORAGE_KEY,
      JSON.stringify([record, { exam: 'x' }, 'not an object']),
    )

    expect(loadExamRecords(storage)).toEqual([record])
  })

  it('保存先が使えなくても、空として扱う（例外にしない）', () => {
    const broken = {
      getItem: () => {
        throw new Error('アクセスできません')
      },
      setItem: () => {
        throw new Error('保存できません')
      },
    }

    expect(loadExamRecords(broken)).toEqual([])
    expect(() => saveExamRecords(broken, [record])).not.toThrow()
  })

  it('保存先がない（null）ときも、例外にしない', () => {
    expect(loadExamRecords(null)).toEqual([])
    expect(() => saveExamRecords(null, [record])).not.toThrow()
  })
})
