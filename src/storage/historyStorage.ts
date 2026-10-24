import type { History } from '../domain/history'

// 保存形式を変えるときは、末尾のバージョンを上げる
export const HISTORY_STORAGE_KEY = 'itpassport-app:history:v1'

type ReadableStorage = Pick<Storage, 'getItem'>
type WritableStorage = Pick<Storage, 'setItem'>

// プライベートブラウズなどでは、localStorage へのアクセス自体が例外になることがある
export const getDefaultStorage = (): Storage | null => {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

export const loadHistory = (storage: ReadableStorage | null): History => {
  try {
    const raw = storage?.getItem(HISTORY_STORAGE_KEY)
    if (!raw) return {}
    const parsed: unknown = JSON.parse(raw)
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      return {}
    }
    return Object.fromEntries(
      Object.entries(parsed).filter(
        ([, correct]) => typeof correct === 'boolean',
      ),
    )
  } catch {
    return {}
  }
}

export const saveHistory = (
  storage: WritableStorage | null,
  history: History,
): void => {
  try {
    storage?.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history))
  } catch {
    // 保存できなくても学習は続けられるようにする（履歴は残らない）
  }
}
