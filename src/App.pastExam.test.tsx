import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from './App'
import type { Question } from './domain/question'
import { choiceText } from './test/choice'

type User = ReturnType<typeof userEvent.setup>

const EXAM = '令和8年度 ITパスポート試験 公開問題'
const APP_EXPLANATION_NOTE =
  '解説はこのアプリ独自のもので、IPA によるものではありません'

// 出典・事例文・図を持つ過去問（ストラテジ）
const past: Question = {
  id: 'p1',
  field: 'strategy',
  text: '問題p1',
  choices: ['p1-正解', 'p1-誤り1', 'p1-誤り2', 'p1-誤り3'],
  answerIndex: 0,
  explanation: '問題p1の解説',
  source: { exam: EXAM, number: 12 },
  passage: '事例文の本文',
  figure: { src: '/figures/q012.png', alt: '投資戦略ごとの利益の表' },
}

// 選択肢が図になっていて並び替えない過去問（マネジメント）
const fixed: Question = {
  id: 'p2',
  field: 'management',
  text: '問題p2',
  choices: ['ア', 'イ', 'ウ', 'エ'],
  answerIndex: 2,
  explanation: '問題p2の解説',
  source: { exam: EXAM, number: 50 },
  fixedChoiceOrder: true,
  figure: { src: '/figures/q050.png', alt: '選択肢アからエの図' },
}

// オリジナル問題（テクノロジ）
const original: Question = {
  id: 'o1',
  field: 'technology',
  text: '問題o1',
  choices: ['o1-正解', 'o1-誤り1', 'o1-誤り2', 'o1-誤り3'],
  answerIndex: 0,
  explanation: '問題o1の解説',
}

const setup = (questions: Question[]) => {
  const user = userEvent.setup()
  render(<App questions={questions} random={() => 0} />)
  return user
}

const click = (user: User, name: string | RegExp) =>
  user.click(screen.getByRole('button', { name }))

describe('一問一答での過去問の表示', () => {
  it('問題文の下に、選択肢の順序を変更した旨を含む出典が表示される', async () => {
    const user = setup([past])

    await click(user, '一問一答を始める')

    expect(
      screen.getByText(`出典：${EXAM} 問12（選択肢の順序を変更）`),
    ).toBeInTheDocument()
  })

  it('並び替えない問題は、選択肢が元の順のままで、出典に変更の旨は付かない', async () => {
    const user = setup([fixed])

    await click(user, '一問一答を始める')

    const choices = screen
      .getAllByRole('button')
      .map(choiceText)
      .filter((name) => ['ア', 'イ', 'ウ', 'エ'].includes(name!))
    expect(choices).toEqual(['ア', 'イ', 'ウ', 'エ'])
    expect(screen.getByText(`出典：${EXAM} 問50`)).toBeInTheDocument()
  })

  it('オリジナル問題には出典が表示されない', async () => {
    const user = setup([original])

    await click(user, '一問一答を始める')

    expect(screen.queryByText(/^出典：/)).not.toBeInTheDocument()
  })

  it('図がある問題では、代替テキストつきの図が表示される', async () => {
    const user = setup([past])

    await click(user, '一問一答を始める')

    expect(
      screen.getByRole('img', { name: '投資戦略ごとの利益の表' }),
    ).toHaveAttribute('src', '/figures/q012.png')
  })

  it('事例文がある問題では、折りたためる事例文が開いた状態で表示される', async () => {
    const user = setup([past])

    await click(user, '一問一答を始める')

    const details = screen.getByText('事例文').closest('details')
    expect(details).toHaveAttribute('open')
    expect(within(details!).getByText('事例文の本文')).toBeInTheDocument()
  })

  it('過去問の解説には、アプリ独自の解説である旨が表示される', async () => {
    const user = setup([past])
    await click(user, '一問一答を始める')

    await click(user, 'p1-正解')

    expect(screen.getByText('問題p1の解説')).toBeInTheDocument()
    expect(screen.getByText(APP_EXPLANATION_NOTE)).toBeInTheDocument()
  })

  it('オリジナル問題の解説には、アプリ独自の解説である旨は表示されない', async () => {
    const user = setup([original])
    await click(user, '一問一答を始める')

    await click(user, 'o1-正解')

    expect(screen.getByText('問題o1の解説')).toBeInTheDocument()
    expect(screen.queryByText(APP_EXPLANATION_NOTE)).not.toBeInTheDocument()
  })
})

describe('分野別演習での過去問の表示', () => {
  it('分野別演習でも、出典・図・事例文が表示される', async () => {
    const user = setup([past, original])

    await click(user, 'ストラテジで練習')

    expect(
      screen.getByText(`出典：${EXAM} 問12（選択肢の順序を変更）`),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('img', { name: '投資戦略ごとの利益の表' }),
    ).toBeInTheDocument()
    expect(screen.getByText('事例文の本文')).toBeInTheDocument()
  })
})

describe('過去問の模擬試験での表示', () => {
  // 技術分野の過去問（模擬試験は、3つの分野すべてに問題がある回だけ始められる）
  const pastTech: Question = {
    id: 'p3',
    field: 'technology',
    text: '問題p3',
    choices: ['p3-正解', 'p3-誤り1', 'p3-誤り2', 'p3-誤り3'],
    answerIndex: 0,
    explanation: '問題p3の解説',
    source: { exam: EXAM, number: 70 },
  }
  // 過去問の模擬試験は問番号順に出題され、オリジナル問題は含まれない（問12 → 問50 → 問70）
  const pool = [fixed, pastTech, past, original]
  const MOCK_EXAM = '模擬試験（令和8年度 公開問題）'

  it('解答中の画面に、出典・図・事例文が表示される', async () => {
    const user = setup(pool)
    await click(user, MOCK_EXAM)

    expect(
      screen.getByText(`出典：${EXAM} 問12（選択肢の順序を変更）`),
    ).toBeInTheDocument()
    expect(screen.getByText('事例文の本文')).toBeInTheDocument()

    await click(user, '次へ')

    expect(screen.getByText(`出典：${EXAM} 問50`)).toBeInTheDocument()
    expect(
      screen.getByRole('img', { name: '選択肢アからエの図' }),
    ).toBeInTheDocument()
  })

  it('結果画面で過去問を開くと、出典とアプリ独自の解説である旨が表示される', async () => {
    const user = setup(pool)
    await click(user, MOCK_EXAM)
    await click(user, '確認へ')
    await click(user, '提出する')

    const items = within(screen.getByRole('list')).getAllByRole('listitem')
    expect(items).toHaveLength(3)
    await user.click(within(items[0]).getByRole('button'))

    expect(
      within(items[0]).getByText(`出典：${EXAM} 問12（選択肢の順序を変更）`),
    ).toBeInTheDocument()
    expect(within(items[0]).getByText(APP_EXPLANATION_NOTE)).toBeInTheDocument()
  })
})
