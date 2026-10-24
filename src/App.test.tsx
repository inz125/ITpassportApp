import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from './App'
import type { Question } from './domain/question'

// 選択肢の文言から正解・不正解を判別できるようにした3問の問題集
const pool: Question[] = (['1', '2', '3'] as const).map((id, index) => ({
  id,
  field: (['strategy', 'management', 'technology'] as const)[index],
  text: `問題${id}`,
  choices: [`${id}-正解`, `${id}-誤り1`, `${id}-誤り2`, `${id}-誤り3`],
  answerIndex: 0,
  explanation: `問題${id}の解説`,
}))

const setup = () => {
  const user = userEvent.setup()
  render(<App questions={pool} random={() => 0} />)
  return user
}

const start = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole('button', { name: '一問一答を始める' }))
}

// 画面に表示されている問題の id（問題文「問題1」→ "1"）
const currentId = () =>
  screen.getByRole('heading', { level: 2 }).textContent!.replace('問題', '')

const choose = async (
  user: ReturnType<typeof userEvent.setup>,
  kind: '正解' | '誤り1',
) => {
  await user.click(
    screen.getByRole('button', { name: `${currentId()}-${kind}` }),
  )
}

describe('トップ画面', () => {
  it('アプリのタイトルと「一問一答を始める」ボタンが表示される', () => {
    setup()

    expect(
      screen.getByRole('heading', { level: 1, name: 'ITパスポート学習' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: '一問一答を始める' }),
    ).toBeInTheDocument()
  })
})

describe('解答中の画面', () => {
  it('進捗・分野名・問題文・4つの選択肢が表示される', async () => {
    const user = setup()

    await start(user)

    expect(screen.getByText('1 / 3問')).toBeInTheDocument()
    const id = currentId()
    const field = pool.find((q) => q.id === id)!.field
    expect(
      screen.getByText(
        {
          strategy: 'ストラテジ',
          management: 'マネジメント',
          technology: 'テクノロジ',
        }[field],
      ),
    ).toBeInTheDocument()
    const choices = screen
      .getAllByRole('button')
      .filter((button) => button.textContent!.startsWith(`${id}-`))
    expect(choices).toHaveLength(4)
  })

  it('解答前は解説も正誤も表示されず、「次の問題へ」は押せない', async () => {
    const user = setup()

    await start(user)

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.queryByText(/の解説$/)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '次の問題へ' })).toBeDisabled()
  })
})

describe('解答後', () => {
  it('正解を選ぶと「正解」と解説が表示される', async () => {
    const user = setup()
    await start(user)
    const id = currentId()

    await choose(user, '正解')

    expect(screen.getByRole('status').textContent).toBe('正解')
    expect(screen.getByText(`問題${id}の解説`)).toBeInTheDocument()
  })

  it('不正解を選ぶと「不正解」と正しい選択肢、解説が表示される', async () => {
    const user = setup()
    await start(user)
    const id = currentId()

    await choose(user, '誤り1')

    expect(screen.getByRole('status').textContent).toBe('不正解')
    expect(screen.getByText(`正解は「${id}-正解」です`)).toBeInTheDocument()
    expect(screen.getByText(`問題${id}の解説`)).toBeInTheDocument()
  })

  it('解答が確定すると選択肢を変更できない', async () => {
    const user = setup()
    await start(user)
    const id = currentId()

    await choose(user, '誤り1')

    const choices = screen
      .getAllByRole('button')
      .filter((button) => button.textContent!.startsWith(`${id}-`))
    for (const choice of choices) {
      expect(choice).toBeDisabled()
    }
  })

  it('「次の問題へ」を押すと次の問題に進み、正誤表示が消える', async () => {
    const user = setup()
    await start(user)
    const firstId = currentId()
    await choose(user, '正解')

    await user.click(screen.getByRole('button', { name: '次の問題へ' }))

    expect(screen.getByText('2 / 3問')).toBeInTheDocument()
    expect(currentId()).not.toBe(firstId)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('最後の問題では「結果を見る」ボタンになる', async () => {
    const user = setup()
    await start(user)
    for (let i = 0; i < 2; i++) {
      await choose(user, '正解')
      await user.click(screen.getByRole('button', { name: '次の問題へ' }))
    }
    await choose(user, '正解')

    expect(screen.getByText('3 / 3問')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: '結果を見る' }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: '次の問題へ' }),
    ).not.toBeInTheDocument()
  })
})

describe('中断', () => {
  it('「中断する」を押すと確認ダイアログが表示される', async () => {
    const user = setup()
    await start(user)

    await user.click(screen.getByRole('button', { name: '中断する' }))

    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
  })

  it('確認で「中断する」を選ぶとトップに戻る', async () => {
    const user = setup()
    await start(user)
    await user.click(screen.getByRole('button', { name: '中断する' }))

    await user.click(
      within(screen.getByRole('alertdialog')).getByRole('button', {
        name: '中断する',
      }),
    )

    expect(
      screen.getByRole('button', { name: '一問一答を始める' }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  })

  it('確認で「続ける」を選ぶと解答中の画面に戻る', async () => {
    const user = setup()
    await start(user)
    await user.click(screen.getByRole('button', { name: '中断する' }))

    await user.click(screen.getByRole('button', { name: '続ける' }))

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(screen.getByText('1 / 3問')).toBeInTheDocument()
  })
})

describe('結果画面', () => {
  // 1問目: 正解 / 2問目: 不正解 / 3問目: 正解 で最後まで解く
  const solveAll = async (user: ReturnType<typeof userEvent.setup>) => {
    const texts: string[] = []
    await start(user)
    const plan: Array<'正解' | '誤り1'> = ['正解', '誤り1', '正解']
    for (const [index, kind] of plan.entries()) {
      texts.push(`問題${currentId()}`)
      await choose(user, kind)
      const isLast = index === plan.length - 1
      await user.click(
        screen.getByRole('button', {
          name: isLast ? '結果を見る' : '次の問題へ',
        }),
      )
    }
    return texts
  }

  it('「3問中2問正解」の形式で正解数が表示される', async () => {
    const user = setup()

    await solveAll(user)

    expect(screen.getByText('3問中2問正解')).toBeInTheDocument()
  })

  it('問題ごとの ○× と問題文が一覧で表示される', async () => {
    const user = setup()

    const texts = await solveAll(user)

    const items = within(screen.getByRole('list')).getAllByRole('listitem')
    expect(items).toHaveLength(3)
    expect(items[0]).toHaveTextContent(`○${texts[0]}`)
    expect(items[1]).toHaveTextContent(`×${texts[1]}`)
    expect(items[2]).toHaveTextContent(`○${texts[2]}`)
  })

  it('「もう一度」を押すと新しい問題で最初から始まる', async () => {
    const user = setup()
    await solveAll(user)

    await user.click(screen.getByRole('button', { name: 'もう一度' }))

    expect(screen.getByText('1 / 3問')).toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('「トップへ」を押すとトップに戻る', async () => {
    const user = setup()
    await solveAll(user)

    await user.click(screen.getByRole('button', { name: 'トップへ' }))

    expect(
      screen.getByRole('button', { name: '一問一答を始める' }),
    ).toBeInTheDocument()
  })
})
