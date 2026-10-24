import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from './App'
import type { History } from './domain/history'
import type { Field } from './domain/judgeExam'
import type { Question } from './domain/question'
import { HISTORY_STORAGE_KEY } from './storage/historyStorage'
import { choiceText } from './test/choice'

type User = ReturnType<typeof userEvent.setup>

const R08 = '令和8年度 ITパスポート試験 公開問題'
const R09 = '令和9年度 ITパスポート試験 公開問題'

const FIELDS: Field[] = ['strategy', 'management', 'technology']

// 過去問。id と問題文は「<回>-<問番号>」。number の順にフィールドが巡る
const past = (
  exam: string,
  number: number,
  field: Field = FIELDS[(number - 1) % 3],
): Question => {
  const id = `${exam === R08 ? 'r8' : 'r9'}-${number}`
  return {
    id,
    field,
    text: `問題${id}`,
    choices: [`${id}-正解`, `${id}-誤り1`, `${id}-誤り2`, `${id}-誤り3`],
    answerIndex: 0,
    explanation: `問題${id}の解説`,
    source: { exam, number },
  }
}

const original = (n: number): Question => ({
  id: `o${n}`,
  field: FIELDS[(n - 1) % 3],
  text: `問題o${n}`,
  choices: [`o${n}-正解`, `o${n}-誤り1`, `o${n}-誤り2`, `o${n}-誤り3`],
  answerIndex: 0,
  explanation: `問題o${n}の解説`,
})

// 令和8年度は、データ上は問番号がばらばらの順に入れておく（出題は問番号順になるはず）
const r08 = [past(R08, 3), past(R08, 1), past(R08, 2)]
const r09 = [past(R09, 1), past(R09, 2), past(R09, 3)]
const originals = [original(1), original(2), original(3)]

const setup = (questions: Question[]) => {
  const user = userEvent.setup()
  render(<App questions={questions} random={() => 0} />)
  return user
}

const click = (user: User, name: string | RegExp) =>
  user.click(screen.getByRole('button', { name }))

const heading = () => screen.getByRole('heading', { level: 2 }).textContent

// 解答はせずに、次へ進みながら問題文を順に集める
const collectTexts = async (user: User, count: number) => {
  const texts: string[] = []
  for (let i = 0; i < count; i++) {
    texts.push(heading()!)
    if (i < count - 1) await click(user, '次へ')
  }
  return texts
}

const MOCK_R08 = '模擬試験（令和8年度 公開問題）'
const MOCK_R09 = '模擬試験（令和9年度 公開問題）'

describe('トップ画面（過去問の模擬試験）', () => {
  it('過去問があるとき、回ごとの模擬試験のボタンが表示され、「模擬試験を始める」は表示されない', () => {
    setup([...originals, ...r08])

    expect(screen.getByRole('button', { name: MOCK_R08 })).toBeEnabled()
    expect(
      screen.queryByRole('button', { name: '模擬試験を始める' }),
    ).not.toBeInTheDocument()
  })

  it('過去問が複数の回にあるとき、回ごとにボタンが並ぶ', () => {
    setup([...r08, ...r09])

    expect(screen.getByRole('button', { name: MOCK_R08 })).toBeEnabled()
    expect(screen.getByRole('button', { name: MOCK_R09 })).toBeEnabled()
  })

  it('3つの分野すべてに問題がない回のボタンは、押せない', () => {
    // 令和9年度は、ストラテジとマネジメントだけ
    setup([...r08, past(R09, 1), past(R09, 2)])

    expect(screen.getByRole('button', { name: MOCK_R08 })).toBeEnabled()
    expect(screen.getByRole('button', { name: MOCK_R09 })).toBeDisabled()
  })

  it('過去問がないときは、これまでどおり「模擬試験を始める」が表示される', () => {
    setup(originals)

    expect(
      screen.getByRole('button', { name: '模擬試験を始める' }),
    ).toBeEnabled()
  })
})

describe('過去問の模擬試験の出題', () => {
  it('選んだ回の問題だけが出題される（オリジナル問題や別の回は含まれない）', async () => {
    const user = setup([...originals, ...r08, ...r09])

    await click(user, MOCK_R08)

    expect(screen.getByText('1 / 3問')).toBeInTheDocument()
    const texts = await collectTexts(user, 3)
    expect(texts.every((text) => text.startsWith('問題r8-'))).toBe(true)
  })

  it('別の回を選ぶと、その回の問題だけが出題される', async () => {
    const user = setup([...r08, ...r09])

    await click(user, MOCK_R09)

    const texts = await collectTexts(user, 3)
    expect(texts.every((text) => text.startsWith('問題r9-'))).toBe(true)
  })

  it('問番号の順に出題される', async () => {
    const user = setup(r08)

    await click(user, MOCK_R08)

    expect(await collectTexts(user, 3)).toEqual([
      '問題r8-1',
      '問題r8-2',
      '問題r8-3',
    ])
  })

  it('選択肢の並びは、出題のたびにシャッフルされる', async () => {
    const user = setup(r08)

    await click(user, MOCK_R08)

    // 乱数が常に0だと、選択肢の先頭（正解）が末尾に回る
    const names = screen
      .getAllByRole('button', { name: /^r8-1-/ })
      .map(choiceText)
    expect(names).toEqual([
      'r8-1-誤り1',
      'r8-1-誤り2',
      'r8-1-誤り3',
      'r8-1-正解',
    ])
  })

  it('選択肢を並び替えない問題は、元の順のまま出題される', async () => {
    const fixed = { ...past(R08, 1), fixedChoiceOrder: true }
    const user = setup([fixed, past(R08, 2), past(R08, 3)])

    await click(user, MOCK_R08)

    const names = screen
      .getAllByRole('button', { name: /^r8-1-/ })
      .map(choiceText)
    expect(names).toEqual([
      'r8-1-正解',
      'r8-1-誤り1',
      'r8-1-誤り2',
      'r8-1-誤り3',
    ])
  })
})

describe('過去問の模擬試験の結果と履歴', () => {
  const submitAll = async (user: User) => {
    await click(user, '確認へ')
    await click(user, '提出する')
  }

  it('結果画面の合否・点数・問題一覧は、選んだ回の問題で出る', async () => {
    const user = setup([...originals, ...r08])

    await click(user, MOCK_R08)
    // 全問正解（問題ごとに、先頭の選択肢が正解のため並び替え後は末尾）
    for (let i = 0; i < 3; i++) {
      await click(user, new RegExp(`^r8-${i + 1}-正解$`))
      if (i < 2) await click(user, '次へ')
    }
    await submitAll(user)

    expect(screen.getByText('合格')).toBeInTheDocument()
    expect(screen.getByText('総合：1000点')).toBeInTheDocument()
    expect(
      within(screen.getByRole('list')).getAllByRole('listitem'),
    ).toHaveLength(3)
  })

  it('提出すると、選んだ回の問題の正誤だけが履歴に記録される', async () => {
    const user = setup([...originals, ...r08, ...r09])

    await click(user, MOCK_R08)
    await submitAll(user)

    const history: History = JSON.parse(
      localStorage.getItem(HISTORY_STORAGE_KEY) ?? '{}',
    )
    expect(Object.keys(history).sort()).toEqual(['r8-1', 'r8-2', 'r8-3'])
  })

  it('「もう一度」を押すと、同じ回が最初の問題から始まる', async () => {
    const user = setup([...r08, ...r09])
    await click(user, MOCK_R08)
    await click(user, '次へ')
    await submitAll(user)

    await click(user, 'もう一度')

    expect(screen.getByText('1 / 3問')).toBeInTheDocument()
    expect(heading()).toBe('問題r8-1')
  })

  it('「トップへ」を押すと、回ごとのボタンがあるトップに戻る', async () => {
    const user = setup([...r08, ...r09])
    await click(user, MOCK_R08)
    await submitAll(user)

    await click(user, 'トップへ')

    expect(screen.getByRole('button', { name: MOCK_R09 })).toBeInTheDocument()
  })
})

describe('過去問がない場合の模擬試験', () => {
  it('これまでどおり、全問が出題され、結果画面ではオリジナル問題に出典が出ない', async () => {
    const user = setup(originals)

    await click(user, '模擬試験を始める')
    expect(screen.getByText('1 / 3問')).toBeInTheDocument()
    await click(user, '確認へ')
    await click(user, '提出する')
    const first = within(screen.getByRole('list')).getAllByRole('listitem')[0]
    await user.click(within(first).getByRole('button'))

    expect(within(first).queryByText(/^出典：/)).not.toBeInTheDocument()
    expect(
      within(first).queryByText(/IPA によるものではありません/),
    ).not.toBeInTheDocument()
  })
})
