import { describe, expect, it } from 'vitest'
import { formatElapsed } from './elapsed'

describe('formatElapsed（経過時間の表示）', () => {
  it('「分:秒」を2桁ずつで表示する', () => {
    expect(formatElapsed(0)).toBe('00:00')
    expect(formatElapsed(5_000)).toBe('00:05')
    expect(formatElapsed(754_000)).toBe('12:34')
  })

  it('1秒未満は切り捨てる', () => {
    expect(formatElapsed(999)).toBe('00:00')
    expect(formatElapsed(59_999)).toBe('00:59')
  })

  it('60分を超えても、分のまま増えていく', () => {
    expect(formatElapsed(3_600_000)).toBe('60:00')
    expect(formatElapsed(4_503_000)).toBe('75:03')
  })

  it('負の値は 00:00 として扱う', () => {
    expect(formatElapsed(-1_000)).toBe('00:00')
  })
})
