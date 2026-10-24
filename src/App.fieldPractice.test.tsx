import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from './App'
import type { History } from './domain/history'
import type { Question } from './domain/question'
import { HISTORY_STORAGE_KEY } from './storage/historyStorage'

type User = ReturnType<typeof userEvent.setup>
type Kind = '正解' | '誤り1'

// 分野が id の順に「ストラテジ → マネジメント → テクノロジ」と巡る問題集
// size 6 のとき、ストラテジ: 1,4 / マネジメント: 2,5 / テクノロジ: 3,6
const makePool = (size: number): Question[] =>
  Array.from({ length: size }, (_, index) => {
    const id = String(index + 1)
    return {
      id,
      field: (['strategy', 'management', 'technology'] as const)[index % 3],
      text: `問題${id}`,
      choices: [`${id}-正解`, `${id}-誤り1`, `${id}-誤り2`, `${id}-誤り3`],
      answerIndex: 0,
      explanation: `問題${id}の解説`,
    }
  })

const storedHistory = (): History =>
  JSON.parse(localStorage.getItem(HISTORY_STORAGE_KEY) ?? '{}')

const setup = (size = 6) => {
  const user = userEvent.setup()
  render(<App questions={makePool(size)} random={() => 0} />)
  return user
}

const startField = (user: User, label: string) =>
  user.click(screen.getByRole('button', { name: `${label}で練習` }))

// 画面に表示されている問題の id（問題文「問題1」→ "1"）
const currentId = () =>
  screen.getByRole('heading', { level: 2 }).textContent!.replace('問題', '')

const choose = (user: User, kind: Kind) =>
  user.click(screen.getByRole('button', { name: `${currentId()}-${kind}` }))

// 順に解答して結果画面まで進み、解いた問題の id を返す
const answerAll = async (user: User, kinds: Kind[]) => {
  const ids: string[] = []
  for (const [index, kind] of kinds.entries()) {
    ids.push(currentId())
    await choose(user, kind)
    const isLast = index === kinds.length - 1
    await user.click(
      screen.getByRole('button', {
        name: isLast ? '結果を見る' : '次の問題へ',
      }),
    )
  }
  return ids
}

describe('トップ画面（分野別演習）', () => {
  it('3つの分野のボタンが押せる状態で表示される', () => {
    setup()

    for (const label of ['ストラテジ', 'マネジメント', 'テクノロジ']) {
      expect(
        screen.getByRole('button', { name: `${label}で練習` }),
      ).toBeEnabled()
    }
  })

  it('問題集にその分野の問題がないとき、その分野のボタンは押せない', () => {
    // 2問: ストラテジ(1) とマネジメント(2) だけ
    setup(2)

    expect(
      screen.getByRole('button', { name: 'ストラテジで練習' }),
    ).toBeEnabled()
    expect(
      screen.getByRole('button', { name: 'マネジメントで練習' }),
    ).toBeEnabled()
    expect(
      screen.getByRole('button', { name: 'テクノロジで練習' }),
    ).toBeDisabled()
  })
})

describe('分野別演習の出題', () => {
  it('選んだ分野の問題だけが出題される', async () => {
    const user = setup()

    await startField(user, 'マネジメント')
    expect(screen.getByText('1 / 2問')).toBeInTheDocument()
    const ids = await answerAll(user, ['正解', '正解'])

    expect([...ids].sort()).toEqual(['2', '5'])
  })

  it('その分野の問題が10問を超えるときは、10問が出題される', async () => {
    // 36問 = 各分野12問
    const user = setup(36)

    await startField(user, 'ストラテジ')

    expect(screen.getByText('1 / 10問')).toBeInTheDocument()
  })

  it('その分野の問題が10問未満のときは、あるだけの問題が出題される', async () => {
    const user = setup(7)

    // 7問: ストラテジ 1,4,7 / マネジメント 2,5 / テクノロジ 3,6
    await startField(user, 'ストラテジ')

    expect(screen.getByText('1 / 3問')).toBeInTheDocument()
  })

  it('解答中の画面と操作は、一問一答・苦手復習と同じである', async () => {
    const user = setup()

    await startField(user, 'テクノロジ')

    expect(screen.getByText('テクノロジ')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /^[36]-/ })).toHaveLength(4)
    expect(screen.getByRole('button', { name: '次の問題へ' })).toBeDisabled()
    await choose(user, '誤り1')
    expect(screen.getByRole('status').textContent).toBe('不正解')
    expect(screen.getByRole('button', { name: '次の問題へ' })).toBeEnabled()
    expect(screen.getByRole('button', { name: '中断する' })).toBeInTheDocument()
  })
})

describe('分野別演習の履歴', () => {
  it('解答するたびに正誤が保存され、間違えた問題は苦手の対象になる', async () => {
    const user = setup()
    await startField(user, 'テクノロジ')
    const mistaken = currentId()

    await choose(user, '誤り1')
    expect(storedHistory()).toEqual({ [mistaken]: false })

    await user.click(screen.getByRole('button', { name: '中断する' }))
    await user.click(
      within(screen.getByRole('alertdialog')).getByRole('button', {
        name: '中断する',
      }),
    )
    expect(
      screen.getByRole('button', { name: '苦手を復習する（1問）' }),
    ).toBeEnabled()
  })
})

describe('分野別演習の結果画面', () => {
  it('正解数と問題ごとの○×が表示され、「残りの苦手」は表示されない', async () => {
    const user = setup()
    await startField(user, 'ストラテジ')

    const [first, second] = await answerAll(user, ['正解', '誤り1'])

    expect(screen.getByText('2問中1問正解')).toBeInTheDocument()
    const items = within(screen.getByRole('list')).getAllByRole('listitem')
    expect(items[0]).toHaveTextContent(`○問題${first}`)
    expect(items[1]).toHaveTextContent(`×問題${second}`)
    expect(screen.queryByText(/残りの苦手/)).not.toBeInTheDocument()
  })

  it('「もう一度」を押すと、同じ分野から新たに出題される', async () => {
    const user = setup()
    await startField(user, 'マネジメント')
    await answerAll(user, ['正解', '正解'])

    await user.click(screen.getByRole('button', { name: 'もう一度' }))

    expect(screen.getByText('1 / 2問')).toBeInTheDocument()
    expect(['2', '5']).toContain(currentId())
  })

  it('「トップへ」を押すとトップに戻る', async () => {
    const user = setup()
    await startField(user, 'ストラテジ')
    await answerAll(user, ['正解', '正解'])

    await user.click(screen.getByRole('button', { name: 'トップへ' }))

    expect(
      screen.getByRole('button', { name: 'ストラテジで練習' }),
    ).toBeInTheDocument()
  })
})
