import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from './App'
import type { Field } from './domain/judgeExam'
import type { Question } from './domain/question'

type User = ReturnType<typeof userEvent.setup>

const EXAM = '令和8年度 ITパスポート試験 公開問題'
const NOTE = '解説はこのアプリ独自のもので、IPA によるものではありません'

const makeQuestion = (
  id: string,
  field: Field,
  extra: Partial<Question> = {},
): Question => ({
  id,
  field,
  text: `問題${id}`,
  choices: [`${id}-正解`, `${id}-誤り1`, `${id}-誤り2`, `${id}-誤り3`],
  answerIndex: 0,
  explanation: `問題${id}の解説`,
  ...extra,
})

// オリジナル問題（テクノロジ）
const original = makeQuestion('o1', 'technology')
// 過去問（ストラテジ）。事例文つき
const past = makeQuestion('p1', 'strategy', {
  source: { exam: EXAM, number: 1 },
  passage: '事例文の本文',
})
// 並び替えない過去問（マネジメント）
const fixed = makeQuestion('p2', 'management', {
  source: { exam: EXAM, number: 2 },
  fixedChoiceOrder: true,
})

// テクノロジの過去問（模擬試験は、3つの分野すべてに問題がある回だけ始められる）
const pastTech = makeQuestion('p3', 'technology', {
  source: { exam: EXAM, number: 3 },
})

const setup = (questions: Question[]) => {
  const user = userEvent.setup()
  render(<App questions={questions} random={() => 0} />)
  return user
}

const click = (user: User, name: string | RegExp) =>
  user.click(screen.getByRole('button', { name }))

// 解答中の選択肢のボタンを、画面に表示された順に返す
const choiceButtons = (prefix: string) =>
  screen.getAllByRole('button', { name: new RegExp(`^${prefix}-`) })

const badgeOf = (button: HTMLElement) =>
  button.querySelector('.badge')!.textContent

describe('選択肢の記号のバッジ', () => {
  it('オリジナル問題は、表示された順に ア・イ・ウ・エ が付く', async () => {
    const user = setup([original])
    await click(user, '一問一答を始める')

    expect(choiceButtons('o1').map(badgeOf)).toEqual(['ア', 'イ', 'ウ', 'エ'])
  })

  it('過去問は、並び替えても元の記号が選択肢と一緒に動く', async () => {
    const user = setup([past])
    await click(user, '一問一答を始める')

    // 乱数が常に0だと、先頭（元のア＝正解）が末尾に回る
    const buttons = choiceButtons('p1')
    expect(buttons.map(badgeOf)).toEqual(['イ', 'ウ', 'エ', 'ア'])
    expect(
      within(screen.getByRole('button', { name: 'p1-正解' })).getByText('ア'),
    ).toBeInTheDocument()
  })

  it('並び替えない過去問は、元の順に ア・イ・ウ・エ が付く', async () => {
    const user = setup([fixed])
    await click(user, '一問一答を始める')

    expect(choiceButtons('p2').map(badgeOf)).toEqual(['ア', 'イ', 'ウ', 'エ'])
  })

  it('バッジは装飾なので、選択肢の読み上げの名前には含まれない', async () => {
    const user = setup([original])
    await click(user, '一問一答を始める')

    expect(screen.getByRole('button', { name: 'o1-正解' })).toBeInTheDocument()
    for (const button of choiceButtons('o1')) {
      expect(button.querySelector('.badge')).toHaveAttribute(
        'aria-hidden',
        'true',
      )
    }
  })

  it('模擬試験の解答中の画面にも、バッジが付く', async () => {
    const user = setup([original, past, fixed, pastTech])
    await click(user, /^模擬試験/)

    // 過去問の模擬試験は問番号順に出題されるので、最初は p1
    expect(choiceButtons('p1').map(badgeOf)).toEqual(['イ', 'ウ', 'エ', 'ア'])
  })

  it('模擬試験の結果画面では、あなたの答えと正しい答えに記号が付く', async () => {
    const user = setup([
      original,
      past,
      fixed,
      makeQuestion('p3', 'technology', {
        source: { exam: EXAM, number: 3 },
      }),
    ])
    await click(user, /^模擬試験/)
    // 1問目（p1）で、表示の先頭の選択肢（元のイ＝誤り1）を選ぶ
    await user.click(choiceButtons('p1')[0])
    await click(user, '確認へ')
    await click(user, '提出する')
    const first = within(screen.getByRole('list')).getAllByRole('listitem')[0]

    await user.click(within(first).getByRole('button'))

    expect(
      within(first).getByText('あなたの答え：イ p1-誤り1'),
    ).toBeInTheDocument()
    expect(
      within(first).getByText('正しい答え：ア p1-正解'),
    ).toBeInTheDocument()
  })
})

describe('正解・不正解の目立たせ方', () => {
  it('不正解を選ぶと、選んだ選択肢は ✕、正解の選択肢は ✓ で表示される', async () => {
    const user = setup([original])
    await click(user, '一問一答を始める')

    await click(user, 'o1-誤り1')

    const wrong = screen.getByRole('button', { name: 'o1-誤り1' })
    const correct = screen.getByRole('button', { name: 'o1-正解' })
    expect(wrong).toHaveAttribute('data-state', 'wrong')
    expect(within(wrong).getByText('✕')).toHaveAttribute('aria-hidden', 'true')
    expect(correct).toHaveAttribute('data-state', 'correct')
    expect(within(correct).getByText('✓')).toHaveAttribute(
      'aria-hidden',
      'true',
    )
  })

  it('正解を選ぶと ✓ だけが表示され、✕ は表示されない', async () => {
    const user = setup([original])
    await click(user, '一問一答を始める')

    await click(user, 'o1-正解')

    expect(screen.getAllByText('✓')).toHaveLength(1)
    expect(screen.queryByText('✕')).not.toBeInTheDocument()
  })

  it('解答前は、どの選択肢にも正誤の印が付かない', async () => {
    const user = setup([original])
    await click(user, '一問一答を始める')

    expect(screen.queryByText('✓')).not.toBeInTheDocument()
    expect(screen.queryByText('✕')).not.toBeInTheDocument()
  })

  it('模擬試験の解答中は、正誤の印を表示しない', async () => {
    const user = setup([original, past, fixed, pastTech])
    await click(user, /^模擬試験/)

    await user.click(choiceButtons('p1')[0])

    expect(screen.queryByText('✓')).not.toBeInTheDocument()
    expect(screen.queryByText('✕')).not.toBeInTheDocument()
  })
})

describe('分野ごとの色', () => {
  it('解答中の画面の分野名に、分野の印が付く', async () => {
    const user = setup([past])
    await click(user, '一問一答を始める')

    expect(screen.getByText('ストラテジ')).toHaveAttribute(
      'data-field',
      'strategy',
    )
  })

  it('マネジメントとテクノロジも、それぞれの分野の印が付く', async () => {
    const user = setup([fixed])
    await click(user, '一問一答を始める')
    expect(screen.getByText('マネジメント')).toHaveAttribute(
      'data-field',
      'management',
    )
  })

  it('トップの分野別演習のボタンに、分野の印が付く', () => {
    setup([original, past, fixed])

    expect(
      screen.getByRole('button', { name: 'ストラテジで練習' }),
    ).toHaveAttribute('data-field', 'strategy')
    expect(
      screen.getByRole('button', { name: 'マネジメントで練習' }),
    ).toHaveAttribute('data-field', 'management')
    expect(
      screen.getByRole('button', { name: 'テクノロジで練習' }),
    ).toHaveAttribute('data-field', 'technology')
  })

  it('模擬試験の結果画面の分野別の点に、分野の印が付く', async () => {
    const user = setup([
      original,
      past,
      fixed,
      makeQuestion('p3', 'technology', {
        source: { exam: EXAM, number: 3 },
      }),
    ])
    await click(user, /^模擬試験/)
    await click(user, '確認へ')
    await click(user, '提出する')

    expect(screen.getByText('ストラテジ：0点')).toHaveAttribute(
      'data-field',
      'strategy',
    )
    expect(screen.getByText('マネジメント：0点')).toHaveAttribute(
      'data-field',
      'management',
    )
    expect(screen.getByText('テクノロジ：0点')).toHaveAttribute(
      'data-field',
      'technology',
    )
  })
})

describe('カードで区切る', () => {
  it('問題文・出典・事例文が、1つの問題のカードにまとまる', async () => {
    const user = setup([past])
    await click(user, '一問一答を始める')

    const card = screen
      .getByRole('heading', { level: 2 })
      .closest('[data-card="question"]')
    expect(card).not.toBeNull()
    expect(
      within(card as HTMLElement).getByText('事例文の本文'),
    ).toBeInTheDocument()
    expect(
      within(card as HTMLElement).getByText(
        `出典：${EXAM} 問1（選択肢の順序を変更）`,
      ),
    ).toBeInTheDocument()
  })

  it('解説が、問題のカードとは別の解説のカードにまとまる', async () => {
    const user = setup([past])
    await click(user, '一問一答を始める')
    await click(user, 'p1-正解')

    const card = screen
      .getByText('問題p1の解説')
      .closest('[data-card="explanation"]')
    expect(card).not.toBeNull()
    expect(within(card as HTMLElement).getByText(NOTE)).toBeInTheDocument()
    expect(card).not.toBe(
      screen
        .getByRole('heading', { level: 2 })
        .closest('[data-card="question"]'),
    )
  })
})
