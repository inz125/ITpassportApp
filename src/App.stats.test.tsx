import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from './App'
import type { History } from './domain/history'
import type { Question } from './domain/question'
import { HISTORY_STORAGE_KEY } from './storage/historyStorage'

type User = ReturnType<typeof userEvent.setup>

// 3つの分野に1問ずつ（模擬試験が始められる最小の問題集）
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

const setup = (options: { size?: number; history?: History } = {}) => {
  if (options.history) {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(options.history))
  }
  const user = userEvent.setup()
  render(
    <App
      questions={makePool(options.size ?? 3)}
      random={() => 0}
      now={() => Date.UTC(2026, 9, 24, 12)}
    />,
  )
  return user
}

const openStats = (user: User) =>
  user.click(screen.getByRole('button', { name: '学習の記録' }))

// 模擬試験（3問）を最後まで解いて、すべて正解で提出する
const submitAllCorrect = async (user: User) => {
  await user.click(screen.getByRole('button', { name: '模擬試験を始める' }))
  for (let index = 0; index < 3; index++) {
    const id = screen
      .getByRole('heading', { level: 2 })
      .textContent!.replace('問題', '')
    await user.click(screen.getByRole('button', { name: `${id}-正解` }))
    if (index < 2)
      await user.click(screen.getByRole('button', { name: '次へ' }))
  }
  await user.click(screen.getByRole('button', { name: '確認へ' }))
  await user.click(screen.getByRole('button', { name: '提出する' }))
  await user.click(screen.getByRole('button', { name: 'トップへ' }))
}

describe('トップ画面から学習の記録を開く', () => {
  it('トップに「学習の記録」ボタンがあり、押すと記録の画面になる', async () => {
    const user = setup()

    await openStats(user)

    expect(
      screen.getByRole('heading', { level: 1, name: '学習の記録' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 2, name: '分野別の正解率' }),
    ).toBeInTheDocument()
  })

  it('「戻る」を押すと、トップに戻る', async () => {
    const user = setup()
    await openStats(user)

    await user.click(screen.getByRole('button', { name: '戻る' }))

    expect(
      screen.getByRole('button', { name: '一問一答を始める' }),
    ).toBeInTheDocument()
  })
})

describe('分野別の正解率', () => {
  it('解いていない分野は「まだ解いていません」と表示される', async () => {
    const user = setup()

    await openStats(user)

    const item = screen.getByText('ストラテジ').closest('li')!
    expect(item).toHaveTextContent('まだ解いていません（全1問）')
  })

  it('解いた問題の直近の結果から、解いた数・正解数・正解率を表示する', async () => {
    // ストラテジは問題1（正解）と問題4（不正解）の2問。問題4は問題集にないので、ここでは1問だけ
    const user = setup({ size: 3, history: { '1': true, deleted: false } })

    await openStats(user)

    const item = screen.getByText('ストラテジ').closest('li')!
    expect(item).toHaveTextContent('1問解いた（全1問）・正解1問（100%）')
  })
})

describe('分野別の正解率の横棒グラフ', () => {
  it('解いた分野は、正解率の長さの棒が出る', async () => {
    // ストラテジ（問題1）は正解 → 100%
    const user = setup({ history: { '1': true } })

    await openStats(user)

    const bar = screen.getByRole('img', { name: 'ストラテジの正解率 100%' })
    expect(bar.querySelector('.rate-bar-fill')).toHaveStyle({ width: '100%' })
  })

  it('正解と不正解が混じるときは、正解率に合わせた長さになる', async () => {
    // テクノロジを2問にして、1問正解・1問不正解 → 50%
    const user = setup({
      size: 6,
      history: { '3': true, '6': false },
    })

    await openStats(user)

    const bar = screen.getByRole('img', { name: 'テクノロジの正解率 50%' })
    expect(bar.querySelector('.rate-bar-fill')).toHaveStyle({ width: '50%' })
  })

  it('解いていない分野は、棒が空で、読み上げでも解いていないと分かる', async () => {
    const user = setup()

    await openStats(user)

    const bar = screen.getByRole('img', {
      name: 'マネジメントはまだ解いていません',
    })
    expect(bar.querySelector('.rate-bar-fill')).toHaveStyle({ width: '0%' })
  })

  it('棒のそばに、解いた数と正解率の文字も残る', async () => {
    const user = setup({ history: { '1': true } })

    await openStats(user)

    const item = screen.getByText('ストラテジ').closest('li')!
    expect(item).toHaveTextContent('1問解いた（全1問）・正解1問（100%）')
  })
})

describe('模擬試験の成績', () => {
  it('記録がないときは「模擬試験の記録はまだありません」と表示する', async () => {
    const user = setup()

    await openStats(user)

    expect(
      screen.getByText('模擬試験の記録はまだありません'),
    ).toBeInTheDocument()
  })

  it('提出した模擬試験の成績が、一覧に出る', async () => {
    const user = setup()
    await submitAllCorrect(user)

    await openStats(user)

    const list = within(screen.getByRole('list', { name: '模擬試験の成績' }))
    expect(list.getByText(/総合 1000点/)).toBeInTheDocument()
    expect(list.getByText(/合格/)).toBeInTheDocument()
  })

  it('中断した模擬試験は、記録に残らない', async () => {
    const user = setup()
    await user.click(screen.getByRole('button', { name: '模擬試験を始める' }))
    await user.click(screen.getByRole('button', { name: '中断する' }))
    await user.click(
      within(screen.getByRole('alertdialog')).getByRole('button', {
        name: '中断する',
      }),
    )

    await openStats(user)

    expect(
      screen.getByText('模擬試験の記録はまだありません'),
    ).toBeInTheDocument()
  })

  it('成績の推移のグラフに、合格ライン（600点）が示される', async () => {
    const user = setup()
    await submitAllCorrect(user)

    await openStats(user)

    expect(
      screen.getByRole('img', { name: '総合点の推移（合格ライン600点）' }),
    ).toBeInTheDocument()
  })
})
