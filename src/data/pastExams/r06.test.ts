import { describe, expect, it } from 'vitest'
import type { Field } from '../../domain/judgeExam'
import { QUESTIONS } from '../questions'
import { R06_QUESTIONS } from './r06'

// 令和6年度 ITパスポート試験 公開問題 解答例（IPA）の問1〜問100の正解。
// 問題データとは別に、解答例の表から書き写したもの
const ANSWER_KEY = [
  'エイウイイエイウアイイアエアウイエウウイウウアウア', // 問1〜25
  'アイアイエエイエエエアエイエアイイイアエエウイアエ', // 問26〜50
  'エアウウウイウエイイアエアイウエウウイウイウエエエ', // 問51〜75
  'ウウアエアエイエエエウエアウアエウイアイウイイウイ', // 問76〜100
].join('')

const KANA = ['ア', 'イ', 'ウ', 'エ']

// 問題冊子の区分（問1〜35 ストラテジ系、問36〜55 マネジメント系、問56〜100 テクノロジ系）
const fieldOf = (number: number): Field =>
  number <= 35 ? 'strategy' : number <= 55 ? 'management' : 'technology'

describe('令和6年度 ITパスポート試験 公開問題', () => {
  it('解答例は100問分ある', () => {
    expect(ANSWER_KEY).toHaveLength(100)
  })

  it('問1〜問100がそろっている', () => {
    const numbers = R06_QUESTIONS.map((q) => q.source!.number)

    expect(numbers).toEqual(Array.from({ length: 100 }, (_, i) => i + 1))
  })

  it('正解は、IPA の解答例と一致する', () => {
    for (const question of R06_QUESTIONS) {
      const number = question.source!.number
      expect(KANA[question.answerIndex], `問${number}`).toBe(
        ANSWER_KEY[number - 1],
      )
    }
  })

  it('分野は、問題冊子の区分に従っている', () => {
    for (const question of R06_QUESTIONS) {
      const number = question.source!.number
      expect(question.field, `問${number}`).toBe(fieldOf(number))
    }
  })

  it('出典の試験名は「令和6年度 ITパスポート試験 公開問題」である', () => {
    for (const question of R06_QUESTIONS) {
      expect(question.source!.exam).toBe('令和6年度 ITパスポート試験 公開問題')
    }
  })

  it('解説は、選択肢の並びが変わっても読めるよう、ア〜エの記号を使わない', () => {
    for (const question of R06_QUESTIONS) {
      const number = question.source!.number
      expect(question.explanation, `問${number}`).not.toMatch(
        /(^|[^ァ-ヶー])[アイウエ]([はがとをのにでも，、）]|$)/,
      )
    }
  })

  it('アプリで出題する問題に含まれている', () => {
    for (const question of R06_QUESTIONS) {
      expect(QUESTIONS).toContain(question)
    }
  })
})
