import { describe, expect, it } from 'vitest'
import { createFigureResolver } from './figures'

describe('createFigureResolver（図の画像のパス）', () => {
  const resolve = createFigureResolver({
    './figures/r08/q003.png': '/assets/q003-abc.png',
  })

  it('図のファイル名から、配信される URL を返す', () => {
    expect(resolve('r08/q003.png')).toBe('/assets/q003-abc.png')
  })

  it('存在しない図を指定すると、ファイル名を含むエラーになる', () => {
    expect(() => resolve('r08/q999.png')).toThrow('r08/q999.png')
  })
})
