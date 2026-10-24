import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import type { History } from './domain/history'
import type { Question } from './domain/question'
import { HISTORY_STORAGE_KEY } from './storage/historyStorage'

type User = ReturnType<typeof userEvent.setup>
type Kind = '正解' | '誤り1'
// 未回答にする問題は null
type Plan = Kind | null

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

const setup = (
  size = 6,
  now?: () => number,
  advanceTimers?: (ms: number) => void,
) => {
  const user = userEvent.setup(advanceTimers ? { advanceTimers } : undefined)
  render(
    <App questions={makePool(size)} random={() => 0} {...(now && { now })} />,
  )
  return user
}

const click = (user: User, name: string | RegExp) =>
  user.click(screen.getByRole('button', { name }))

const startExam = (user: User) => click(user, '模擬試験を始める')

// 画面に表示されている問題の id（問題文「問題1」→ "1"）
const currentId = () =>
  screen.getByRole('heading', { level: 2 }).textContent!.replace('問題', '')

const choose = (user: User, kind: Kind) =>
  user.click(screen.getByRole('button', { name: `${currentId()}-${kind}` }))

// 順番に（答えない問題は飛ばして）解き、確認画面まで進む。出題順の id を返す
const solve = async (user: User, plan: Plan[]) => {
  const ids: string[] = []
  for (const [index, kind] of plan.entries()) {
    ids.push(currentId())
    if (kind) await choose(user, kind)
    if (index < plan.length - 1) await click(user, '次へ')
  }
  await click(user, '確認へ')
  return ids
}

const solveAndSubmit = async (user: User, plan: Plan[]) => {
  const ids = await solve(user, plan)
  await click(user, '提出する')
  return ids
}

const quit = async (user: User) => {
  await click(user, '中断する')
  await user.click(
    within(screen.getByRole('alertdialog')).getByRole('button', {
      name: '中断する',
    }),
  )
}

describe('トップ画面（模擬試験）', () => {
  it('「模擬試験を始める」ボタンが押せる状態で表示される', () => {
    setup()

    expect(
      screen.getByRole('button', { name: '模擬試験を始める' }),
    ).toBeEnabled()
  })

  it('いずれかの分野の問題がないとき、ボタンは押せない', () => {
    // 2問: ストラテジ(1) とマネジメント(2) だけ
    setup(2)

    expect(
      screen.getByRole('button', { name: '模擬試験を始める' }),
    ).toBeDisabled()
  })
})

describe('模擬試験の出題', () => {
  it('問題集の全問が出題される（10問を超えても絞らない）', async () => {
    const user = setup(12)

    await startExam(user)

    expect(screen.getByText('1 / 12問')).toBeInTheDocument()
  })

  it('問題の順番がシャッフルされる', async () => {
    const user = setup()

    await startExam(user)

    // 乱数が常に0だと先頭の問題が末尾に回るので、最初は2問目の問題になる
    expect(currentId()).toBe('2')
  })

  it('選択肢の並びもシャッフルされる', async () => {
    const user = setup()

    await startExam(user)

    const names = screen
      .getAllByRole('button', { name: /^2-/ })
      .map((button) => button.textContent)
    expect(names).toEqual(['2-誤り1', '2-誤り2', '2-誤り3', '2-正解'])
  })
})

describe('解答中の画面', () => {
  it('進捗・分野名・問題文・4つの選択肢が表示される', async () => {
    const user = setup()

    await startExam(user)

    expect(screen.getByText('1 / 6問')).toBeInTheDocument()
    expect(screen.getByText('マネジメント')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 2, name: '問題2' }),
    ).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /^2-/ })).toHaveLength(4)
  })

  it('選択肢をタップしても、正誤や解説は表示されない', async () => {
    const user = setup()
    await startExam(user)

    await choose(user, '正解')

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.queryByText(/の解説$/)).not.toBeInTheDocument()
    expect(screen.queryByText(/正しい答え/)).not.toBeInTheDocument()
  })

  it('選んだ答えが分かる状態で表示される', async () => {
    const user = setup()
    await startExam(user)

    await choose(user, '誤り1')

    expect(screen.getByRole('button', { name: '2-誤り1' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('button', { name: '2-正解' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })

  it('別の選択肢をタップすると、答えを変更できる', async () => {
    const user = setup()
    await startExam(user)
    await choose(user, '誤り1')

    await choose(user, '正解')

    expect(screen.getByRole('button', { name: '2-正解' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('button', { name: '2-誤り1' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })

  it('「前へ」「次へ」で問題を行き来でき、選んだ答えは残る', async () => {
    const user = setup()
    await startExam(user)
    await choose(user, '誤り1')

    await click(user, '次へ')
    expect(screen.getByText('2 / 6問')).toBeInTheDocument()
    expect(currentId()).toBe('3')
    await click(user, '前へ')

    expect(screen.getByText('1 / 6問')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '2-誤り1' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('最初の問題では「前へ」、最後の問題では「次へ」が押せない', async () => {
    const user = setup(3)
    await startExam(user)
    expect(screen.getByRole('button', { name: '前へ' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '次へ' })).toBeEnabled()

    await click(user, '次へ')
    await click(user, '次へ')

    expect(screen.getByText('3 / 3問')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '次へ' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '前へ' })).toBeEnabled()
  })

  it('「確認へ」で提出前の確認画面に進める', async () => {
    const user = setup()
    await startExam(user)

    await click(user, '確認へ')

    expect(
      screen.getByRole('heading', { level: 1, name: '提出前の確認' }),
    ).toBeInTheDocument()
  })
})

describe('経過時間', () => {
  beforeEach(() => {
    // Testing Library が内部で使う setTimeout が止まらないよう、実時間でも少しずつ進める
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('「12:34」の形式で表示され、1秒ごとに進む', async () => {
    let time = 1_000_000
    const user = setup(6, () => time, vi.advanceTimersByTime)
    await startExam(user)
    expect(screen.getByText('経過時間：00:00')).toBeInTheDocument()

    time += 3_000
    act(() => {
      vi.advanceTimersByTime(1_000)
    })
    expect(screen.getByText('経過時間：00:03')).toBeInTheDocument()

    time += 751_000
    act(() => {
      vi.advanceTimersByTime(1_000)
    })
    expect(screen.getByText('経過時間：12:34')).toBeInTheDocument()
  })

  it('確認画面でも時間は進み続け、提出した時点で止まる', async () => {
    let time = 0
    const user = setup(6, () => time, vi.advanceTimersByTime)
    await startExam(user)
    await solve(user, ['正解', '正解', '正解', '正解', '正解', '正解'])

    time = 90_000
    await click(user, '提出する')

    expect(screen.getByText('所要時間：01:30')).toBeInTheDocument()
    time = 600_000
    act(() => {
      vi.advanceTimersByTime(5_000)
    })
    expect(screen.getByText('所要時間：01:30')).toBeInTheDocument()
  })
})

describe('提出前の確認画面', () => {
  it('未回答がないとき、「すべての問題に解答済みです」と表示される', async () => {
    const user = setup()
    await startExam(user)

    await solve(user, ['正解', '正解', '正解', '正解', '正解', '正解'])

    expect(screen.getByText('すべての問題に解答済みです')).toBeInTheDocument()
    expect(screen.queryByText(/未回答が/)).not.toBeInTheDocument()
  })

  it('未回答があるとき、「未回答がN問あります」と未回答の問題の一覧が表示される', async () => {
    const user = setup()
    await startExam(user)

    await solve(user, ['正解', '正解', null, '正解', '正解', null])

    expect(screen.getByText('未回答が2問あります')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '3問目' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '6問目' })).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: '1問目' }),
    ).not.toBeInTheDocument()
  })

  it('未回答の問題を選ぶと、その問題の画面に移動する', async () => {
    const user = setup()
    await startExam(user)
    const ids = await solve(user, [
      '正解',
      '正解',
      null,
      '正解',
      '正解',
      '正解',
    ])

    await click(user, '3問目')

    expect(screen.getByText('3 / 6問')).toBeInTheDocument()
    expect(currentId()).toBe(ids[2])
  })

  it('「解答に戻る」で解答中の画面に戻れる', async () => {
    const user = setup()
    await startExam(user)
    await solve(user, ['正解', '正解', '正解', '正解', '正解', '正解'])

    await click(user, '解答に戻る')

    expect(screen.getByText('6 / 6問')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '確認へ' })).toBeInTheDocument()
  })

  it('未回答があっても、「提出する」で提出できる', async () => {
    const user = setup()
    await startExam(user)
    await solve(user, [null, null, null, null, null, null])

    await click(user, '提出する')

    expect(
      screen.getByRole('heading', { level: 1, name: '結果' }),
    ).toBeInTheDocument()
  })
})

describe('結果画面', () => {
  const allCorrect: Plan[] = ['正解', '正解', '正解', '正解', '正解', '正解']
  const allWrong: Plan[] = [
    '誤り1',
    '誤り1',
    '誤り1',
    '誤り1',
    '誤り1',
    '誤り1',
  ]

  it('全問正解すると「合格」と、総合・分野別の点が表示される', async () => {
    const user = setup()
    await startExam(user)

    await solveAndSubmit(user, allCorrect)

    expect(screen.getByText('合格')).toBeInTheDocument()
    expect(screen.getByText('総合：1000点')).toBeInTheDocument()
    expect(screen.getByText('ストラテジ：1000点')).toBeInTheDocument()
    expect(screen.getByText('マネジメント：1000点')).toBeInTheDocument()
    expect(screen.getByText('テクノロジ：1000点')).toBeInTheDocument()
  })

  it('全問不正解だと「不合格」と表示される', async () => {
    const user = setup()
    await startExam(user)

    await solveAndSubmit(user, allWrong)

    expect(screen.getByText('不合格')).toBeInTheDocument()
    expect(screen.getByText('総合：0点')).toBeInTheDocument()
  })

  it('未回答は不正解として採点される', async () => {
    const user = setup()
    await startExam(user)

    // 6問中3問正解・3問未回答 → 500点で不合格
    await solveAndSubmit(user, ['正解', '正解', '正解', null, null, null])

    expect(screen.getByText('総合：500点')).toBeInTheDocument()
    expect(screen.getByText('不合格')).toBeInTheDocument()
  })

  it('問題ごとの○×と問題文が一覧で表示される', async () => {
    const user = setup()
    await startExam(user)

    const ids = await solveAndSubmit(user, [
      '正解',
      '誤り1',
      null,
      '正解',
      '正解',
      '正解',
    ])

    const items = within(screen.getByRole('list')).getAllByRole('listitem')
    expect(items).toHaveLength(6)
    expect(items[0]).toHaveTextContent(`○問題${ids[0]}`)
    expect(items[1]).toHaveTextContent(`×問題${ids[1]}`)
    expect(items[2]).toHaveTextContent(`×問題${ids[2]}`)
  })

  it('一覧の問題をタップすると、あなたの答え・正しい答え・解説が開く', async () => {
    const user = setup()
    await startExam(user)
    const ids = await solveAndSubmit(user, [
      '誤り1',
      '正解',
      '正解',
      '正解',
      '正解',
      '正解',
    ])
    const first = within(screen.getByRole('list')).getAllByRole('listitem')[0]
    expect(within(first).queryByText(/正しい答え/)).not.toBeInTheDocument()

    await user.click(within(first).getByRole('button'))

    expect(
      within(first).getByText(`あなたの答え：${ids[0]}-誤り1`),
    ).toBeInTheDocument()
    expect(
      within(first).getByText(`正しい答え：${ids[0]}-正解`),
    ).toBeInTheDocument()
    expect(within(first).getByText(`問題${ids[0]}の解説`)).toBeInTheDocument()
  })

  it('未回答の問題は、あなたの答えが「未回答」と表示される', async () => {
    const user = setup()
    await startExam(user)
    await solveAndSubmit(user, [null, '正解', '正解', '正解', '正解', '正解'])
    const first = within(screen.getByRole('list')).getAllByRole('listitem')[0]

    await user.click(within(first).getByRole('button'))

    expect(within(first).getByText('あなたの答え：未回答')).toBeInTheDocument()
  })

  it('「もう一度」を押すと、新しい模擬試験が最初から始まる', async () => {
    const user = setup()
    await startExam(user)
    await solveAndSubmit(user, allCorrect)

    await click(user, 'もう一度')

    expect(screen.getByText('1 / 6問')).toBeInTheDocument()
    for (const button of screen.getAllByRole('button', { name: /^\d-/ })) {
      expect(button).toHaveAttribute('aria-pressed', 'false')
    }
  })

  it('「トップへ」を押すとトップに戻る', async () => {
    const user = setup()
    await startExam(user)
    await solveAndSubmit(user, allCorrect)

    await click(user, 'トップへ')

    expect(
      screen.getByRole('button', { name: '模擬試験を始める' }),
    ).toBeInTheDocument()
  })
})

describe('模擬試験の履歴', () => {
  it('解答中は、苦手復習の履歴に記録されない', async () => {
    const user = setup()
    await startExam(user)

    await choose(user, '誤り1')
    await click(user, '次へ')
    await choose(user, '正解')
    await click(user, '確認へ')

    expect(storedHistory()).toEqual({})
  })

  it('提出したときに、全問の正誤がまとめて記録される（未回答は不正解）', async () => {
    const user = setup()
    await startExam(user)

    const ids = await solveAndSubmit(user, [
      '正解',
      '誤り1',
      null,
      '正解',
      '正解',
      '誤り1',
    ])

    expect(storedHistory()).toEqual({
      [ids[0]]: true,
      [ids[1]]: false,
      [ids[2]]: false,
      [ids[3]]: true,
      [ids[4]]: true,
      [ids[5]]: false,
    })
  })

  it('模擬試験で間違えた問題は、苦手復習の対象になる', async () => {
    const user = setup()
    await startExam(user)
    await solveAndSubmit(user, ['誤り1', '誤り1', null, '正解', '正解', '正解'])

    await click(user, 'トップへ')

    expect(
      screen.getByRole('button', { name: '苦手を復習する（3問）' }),
    ).toBeEnabled()
  })
})

describe('模擬試験の中断', () => {
  it('「中断する」を押すと、解答が破棄されることを伝える確認ダイアログが表示される', async () => {
    const user = setup()
    await startExam(user)

    await click(user, '中断する')

    expect(screen.getByRole('alertdialog')).toHaveTextContent('破棄')
  })

  it('確認で「中断する」を選ぶと、履歴に記録されずトップへ戻る', async () => {
    const user = setup()
    await startExam(user)
    await choose(user, '誤り1')

    await quit(user)

    expect(
      screen.getByRole('button', { name: '模擬試験を始める' }),
    ).toBeInTheDocument()
    expect(storedHistory()).toEqual({})
  })

  it('確認で「続ける」を選ぶと、解答中の画面に戻り、答えも残る', async () => {
    const user = setup()
    await startExam(user)
    await choose(user, '誤り1')
    await click(user, '中断する')

    await click(user, '続ける')

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '2-誤り1' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })
})
