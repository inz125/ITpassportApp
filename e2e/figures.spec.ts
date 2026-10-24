import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { expect, test } from '@playwright/test'
import { QUESTIONS } from '../src/data/questions'

// 問題データが参照している図の画像ファイルが、すべて存在することを確かめる（ブラウザは使わない）
test('問題データが参照している図の画像ファイルが、すべて存在する', () => {
  const figures = QUESTIONS.flatMap((q) => (q.figure ? [q.figure.src] : []))

  expect(figures.length).toBeGreaterThan(0)
  for (const src of figures) {
    expect(existsSync(fileURLToPath(src)), src).toBe(true)
  }
})
