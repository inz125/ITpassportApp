import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from './App'
import type { History } from './domain/history'
import type { Question } from './domain/question'
import { HISTORY_STORAGE_KEY } from './storage/historyStorage'

type User = ReturnType<typeof userEvent.setup>
type Kind = '正解' | '誤り1'

// 選択肢の文言から正解・不正解を判別できる問題集（id は '1', '2', ...）
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

const saveHistoryDirectly = (history: History) =>
  localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history))

const storedHistory = (): History =>
  JSON.parse(localStorage.getItem(HISTORY_STORAGE_KEY) ?? '{}')

const setup = (
  options: { history?: History; size?: number; storage?: Storage | null } = {},
) => {
  if (options.history) saveHistoryDirectly(options.history)
  const user = userEvent.setup()
  const view = render(
    <App
      questions={makePool(options.size ?? 3)}
      random={() => 0}
      {...(options.storage !== undefined && { storage: options.storage })}
    />,
  )
  return { user, ...view }
}

const startQuiz = (user: User) =>
  user.click(screen.getByRole('button', { name: '一問一答を始める' }))

const startWeak = (user: User) =>
  user.click(screen.getByRole('button', { name: /^苦手を復習する/ }))

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

const brokenStorage = {
  getItem: () => {
    throw new Error('アクセスできません')
  },
  setItem: () => {
    throw new Error('保存できません')
  },
} as unknown as Storage

describe('トップ画面（苦手復習）', () => {
  it('苦手があるとき、「苦手を復習する（N問）」ボタンが押せる状態で表示される', () => {
    setup({ history: { '1': false, '2': false, '3': true } })

    expect(
      screen.getByRole('button', { name: '苦手を復習する（2問）' }),
    ).toBeEnabled()
    expect(screen.queryByText('苦手な問題はありません')).not.toBeInTheDocument()
  })

  it('苦手が0問のとき、ボタンは押せず「苦手な問題はありません」と表示される', () => {
    setup()

    expect(
      screen.getByRole('button', { name: '苦手を復習する（0問）' }),
    ).toBeDisabled()
    expect(screen.getByText('苦手な問題はありません')).toBeInTheDocument()
  })

  it('問題集にない問題の履歴は、苦手の数に入らない', () => {
    setup({ history: { '1': false, 'deleted-question': false } })

    expect(
      screen.getByRole('button', { name: '苦手を復習する（1問）' }),
    ).toBeInTheDocument()
  })
})

describe('履歴の記録', () => {
  it('一問一答で解答するたびに、その問題の正誤が保存される', async () => {
    const { user } = setup()
    await startQuiz(user)

    const first = currentId()
    await choose(user, '誤り1')
    expect(storedHistory()).toEqual({ [first]: false })

    await user.click(screen.getByRole('button', { name: '次の問題へ' }))
    const second = currentId()
    await choose(user, '正解')
    expect(storedHistory()).toEqual({ [first]: false, [second]: true })
  })

  it('苦手復習で解答するたびにも、正誤が保存され、最新の結果に置き換わる', async () => {
    const { user } = setup({ history: { '1': false } })
    await startWeak(user)

    await choose(user, '正解')

    expect(storedHistory()).toEqual({ '1': true })
  })

  it('途中で中断しても、解いた分の履歴は残る', async () => {
    const { user } = setup()
    await startQuiz(user)
    const id = currentId()
    await choose(user, '誤り1')

    await user.click(screen.getByRole('button', { name: '中断する' }))
    await user.click(
      within(screen.getByRole('alertdialog')).getByRole('button', {
        name: '中断する',
      }),
    )

    expect(storedHistory()).toEqual({ [id]: false })
    expect(
      screen.getByRole('button', { name: '苦手を復習する（1問）' }),
    ).toBeEnabled()
  })

  it('アプリを開き直しても、保存した履歴が残る', async () => {
    const first = setup()
    await startQuiz(first.user)
    await choose(first.user, '誤り1')
    first.unmount()

    setup()

    expect(
      screen.getByRole('button', { name: '苦手を復習する（1問）' }),
    ).toBeEnabled()
  })

  it('保存先が使えない環境でも、解答を最後まで続けられる', async () => {
    const { user } = setup({ storage: brokenStorage })
    await startQuiz(user)

    await answerAll(user, ['正解', '誤り1', '正解'])

    expect(screen.getByText('3問中2問正解')).toBeInTheDocument()
  })

  it('保存先がまったくない環境でも、トップが表示される', () => {
    setup({ storage: null })

    expect(
      screen.getByRole('button', { name: '苦手を復習する（0問）' }),
    ).toBeDisabled()
  })

  it('保存内容が壊れていても、履歴が空としてアプリが使える', async () => {
    localStorage.setItem(HISTORY_STORAGE_KEY, '{こわれた')
    const { user } = setup()

    expect(
      screen.getByRole('button', { name: '苦手を復習する（0問）' }),
    ).toBeDisabled()
    await startQuiz(user)
    expect(screen.getByText('1 / 3問')).toBeInTheDocument()
  })
})

describe('苦手復習の出題', () => {
  it('苦手の問題だけが出題される', async () => {
    const { user } = setup({ history: { '2': false, '3': true } })

    await startWeak(user)

    expect(screen.getByText('1 / 1問')).toBeInTheDocument()
    expect(currentId()).toBe('2')
  })

  it('苦手が10問未満のときは、あるだけの問題が出題される', async () => {
    const { user } = setup({ history: { '1': false, '2': false } })

    await startWeak(user)

    expect(screen.getByText('1 / 2問')).toBeInTheDocument()
  })

  it('苦手が10問を超えるときは、10問が出題される', async () => {
    const history = Object.fromEntries(
      makePool(12).map((question) => [question.id, false]),
    )
    const { user } = setup({ size: 12, history })

    await startWeak(user)

    expect(screen.getByText('1 / 10問')).toBeInTheDocument()
  })

  it('解答中の画面と操作は、一問一答と同じである', async () => {
    const { user } = setup({ history: { '1': false } })

    await startWeak(user)

    expect(screen.getByText('ストラテジ')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /^1-/ })).toHaveLength(4)
    // 1問だけなので最初から最後の問題。解答前は押せず、解答後に押せる
    expect(screen.getByRole('button', { name: '結果を見る' })).toBeDisabled()
    await choose(user, '誤り1')
    expect(screen.getByRole('status').textContent).toBe('不正解')
    expect(screen.getByRole('button', { name: '結果を見る' })).toBeEnabled()
    expect(screen.getByRole('button', { name: '中断する' })).toBeInTheDocument()
  })
})

describe('苦手復習の結果画面', () => {
  const weak2: History = { '1': false, '2': false }

  it('正解数・問題ごとの○×に加えて、「残りの苦手：N問」が表示される', async () => {
    const { user } = setup({ history: weak2 })
    await startWeak(user)

    const [first, second] = await answerAll(user, ['正解', '誤り1'])

    expect(screen.getByText('2問中1問正解')).toBeInTheDocument()
    const items = within(screen.getByRole('list')).getAllByRole('listitem')
    expect(items[0]).toHaveTextContent(`○問題${first}`)
    expect(items[1]).toHaveTextContent(`×問題${second}`)
    expect(screen.getByText('残りの苦手：1問')).toBeInTheDocument()
  })

  it('「もう一度」を押すと、残っている苦手から出題される', async () => {
    const { user } = setup({ history: weak2 })
    await startWeak(user)
    const [, stillWeak] = await answerAll(user, ['正解', '誤り1'])

    await user.click(screen.getByRole('button', { name: 'もう一度' }))

    expect(screen.getByText('1 / 1問')).toBeInTheDocument()
    expect(currentId()).toBe(stillWeak)
  })

  it('苦手を全問正解して残りが0問になると、「もう一度」は押せない', async () => {
    const { user } = setup({ history: weak2 })
    await startWeak(user)

    await answerAll(user, ['正解', '正解'])

    expect(screen.getByText('残りの苦手：0問')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'もう一度' })).toBeDisabled()
  })

  it('「トップへ」を押すとトップに戻り、苦手の数が更新されている', async () => {
    const { user } = setup({ history: weak2 })
    await startWeak(user)
    await answerAll(user, ['正解', '誤り1'])

    await user.click(screen.getByRole('button', { name: 'トップへ' }))

    expect(
      screen.getByRole('button', { name: '苦手を復習する（1問）' }),
    ).toBeEnabled()
  })

  it('一問一答の結果画面には、「残りの苦手」を表示しない', async () => {
    const { user } = setup()
    await startQuiz(user)

    await answerAll(user, ['正解', '誤り1', '正解'])

    expect(screen.getByText('3問中2問正解')).toBeInTheDocument()
    expect(screen.queryByText(/残りの苦手/)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'もう一度' })).toBeEnabled()
  })
})

describe('問題集が空のとき', () => {
  it('「一問一答を始める」を押しても、何も始まらない', async () => {
    const { user } = setup({ size: 0 })

    await startQuiz(user)

    expect(
      screen.getByRole('button', { name: '一問一答を始める' }),
    ).toBeInTheDocument()
    expect(screen.queryByText(/問$/)).not.toBeInTheDocument()
  })
})
