import { describe, expect, it } from 'vitest'
import type { Question } from './question'
import { createQuiz, shuffle, shuffleChoices } from './quiz'

const makeQuestion = (id: string): Question => ({
  id,
  field: 'strategy',
  text: `問題${id}`,
  choices: ['A', 'B', 'C', 'D'],
  answerIndex: 0,
  explanation: '解説',
})

const makePool = (size: number): Question[] =>
  Array.from({ length: size }, (_, i) => makeQuestion(String(i + 1)))

const always0 = () => 0

describe('shuffle（並び替え）', () => {
  it('元の配列を変更しない', () => {
    const items = ['a', 'b', 'c', 'd']

    shuffle(items, always0)

    expect(items).toEqual(['a', 'b', 'c', 'd'])
  })

  it('要素の集合は変わらない', () => {
    const result = shuffle([1, 2, 3, 4, 5], Math.random)

    expect([...result].sort()).toEqual([1, 2, 3, 4, 5])
  })

  it('乱数が常に0だと、先頭の要素が末尾に回る', () => {
    expect(shuffle(['a', 'b', 'c', 'd'], always0)).toEqual(['b', 'c', 'd', 'a'])
  })
})

describe('shuffleChoices（選択肢のシャッフル）', () => {
  it('並び替えても、正解の選択肢の文言は変わらない', () => {
    const shuffled = shuffleChoices(makeQuestion('1'), always0)

    expect(shuffled.choices).toEqual(['B', 'C', 'D', 'A'])
    expect(shuffled.choices[shuffled.answerIndex]).toBe('A')
  })

  it('選択肢の集合は変わらず、問題文や解説はそのまま引き継がれる', () => {
    const original = makeQuestion('1')

    const shuffled = shuffleChoices(original, Math.random)

    expect([...shuffled.choices].sort()).toEqual(['A', 'B', 'C', 'D'])
    expect(shuffled.text).toBe(original.text)
    expect(shuffled.explanation).toBe(original.explanation)
  })
})

describe('shuffleChoices（並び替えない問題）', () => {
  it('選択肢を並び替えない問題は、元の順のまま出題される', () => {
    const fixed = { ...makeQuestion('1'), fixedChoiceOrder: true }

    const result = shuffleChoices(fixed, always0)

    expect(result.choices).toEqual(['A', 'B', 'C', 'D'])
    expect(result.answerIndex).toBe(0)
  })

  it('出題しても、並び替えない問題の選択肢は元の順のまま', () => {
    const pool = [{ ...makeQuestion('1'), fixedChoiceOrder: true }]

    const [question] = createQuiz(pool, always0)

    expect(question.choices).toEqual(['A', 'B', 'C', 'D'])
  })
})

describe('createQuiz（出題）', () => {
  it('問題集から10問を重複なく選ぶ', () => {
    const quiz = createQuiz(makePool(20), Math.random)

    expect(quiz).toHaveLength(10)
    expect(new Set(quiz.map((q) => q.id)).size).toBe(10)
  })

  it('問題数を指定できる', () => {
    expect(createQuiz(makePool(20), Math.random, 5)).toHaveLength(5)
  })

  it('問題集が出題数に満たない場合は、あるだけの問題を出題する', () => {
    expect(createQuiz(makePool(3), Math.random)).toHaveLength(3)
  })

  it('乱数に応じて出題順が変わる', () => {
    const quiz = createQuiz(makePool(5), always0, 5)

    expect(quiz.map((q) => q.id)).toEqual(['2', '3', '4', '5', '1'])
  })

  it('出題される各問題の選択肢もシャッフルされる', () => {
    const [first] = createQuiz(makePool(5), always0, 1)

    expect(first.choices).toEqual(['B', 'C', 'D', 'A'])
    expect(first.answerIndex).toBe(3)
  })
})
