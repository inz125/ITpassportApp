import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  getDefaultStorage,
  HISTORY_STORAGE_KEY,
  loadHistory,
  saveHistory,
} from './historyStorage'

const brokenStorage = {
  getItem: () => {
    throw new Error('アクセスできません')
  },
  setItem: () => {
    throw new Error('保存できません')
  },
}

const storageWith = (value: string | null) => ({
  getItem: () => value,
  setItem: () => {},
})

afterEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
})

describe('saveHistory / loadHistory（保存と読み込み）', () => {
  it('保存した履歴を読み込める', () => {
    saveHistory(localStorage, { '1': false, '2': true })

    expect(loadHistory(localStorage)).toEqual({ '1': false, '2': true })
  })

  it('保存の形式にバージョンが付いたキーを使う', () => {
    saveHistory(localStorage, { '1': false })

    expect(HISTORY_STORAGE_KEY).toMatch(/v1$/)
    expect(localStorage.getItem(HISTORY_STORAGE_KEY)).toBe('{"1":false}')
  })

  it('何も保存されていないときは空の履歴になる', () => {
    expect(loadHistory(localStorage)).toEqual({})
  })
})

describe('保存できない環境・壊れた保存内容', () => {
  it('ストレージがないときは、読み込みは空の履歴、保存は何もしない', () => {
    expect(loadHistory(null)).toEqual({})
    expect(() => saveHistory(null, { '1': false })).not.toThrow()
  })

  it('ストレージが例外を投げても、読み込みは空の履歴になる', () => {
    expect(loadHistory(brokenStorage)).toEqual({})
  })

  it('ストレージが例外を投げても、保存はエラーにならない', () => {
    expect(() => saveHistory(brokenStorage, { '1': false })).not.toThrow()
  })

  it('JSONとして壊れている内容は、空の履歴として扱う', () => {
    expect(loadHistory(storageWith('{こわれた'))).toEqual({})
  })

  it('オブジェクトではない内容は、空の履歴として扱う', () => {
    expect(loadHistory(storageWith('[true, false]'))).toEqual({})
    expect(loadHistory(storageWith('"文字列"'))).toEqual({})
    expect(loadHistory(storageWith('null'))).toEqual({})
  })

  it('正誤が真偽値でない項目だけを取り除く', () => {
    const value = JSON.stringify({ '1': false, '2': 'x', '3': 1, '4': true })

    expect(loadHistory(storageWith(value))).toEqual({ '1': false, '4': true })
  })
})

describe('getDefaultStorage（標準のストレージ）', () => {
  it('ブラウザの localStorage を返す', () => {
    expect(getDefaultStorage()).toBe(localStorage)
  })

  it('localStorage にアクセスすると例外になる環境では、null を返す', () => {
    vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
      throw new Error('アクセスできません')
    })

    expect(getDefaultStorage()).toBeNull()
  })
})
