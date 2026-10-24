import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import App from './App'
import type { Field } from './domain/judgeExam'
import type { Question } from './domain/question'

const FIELDS: Field[] = ['strategy', 'management', 'technology']

// 3つの分野に1問ずつ。模擬試験も始められる
const questions: Question[] = FIELDS.map((field, index) => ({
  id: `q${index + 1}`,
  field,
  text: `問題q${index + 1}`,
  choices: ['正解', '誤り1', '誤り2', '誤り3'],
  answerIndex: 0,
  explanation: '解説',
}))

const NOTICE = '新しい版があります'

const setup = (props: { updateAvailable?: boolean; onUpdate?: () => void }) => {
  const user = userEvent.setup()
  render(<App questions={questions} random={() => 0} {...props} />)
  return user
}

describe('新しい版の更新の案内', () => {
  it('新しい版があるとき、トップに「新しい版があります」と「更新する」ボタンが表示される', () => {
    setup({ updateAvailable: true, onUpdate: () => {} })

    expect(screen.getByRole('status')).toHaveTextContent(NOTICE)
    expect(screen.getByRole('button', { name: '更新する' })).toBeEnabled()
  })

  it('「更新する」を押すと、更新の処理が呼ばれる', async () => {
    const onUpdate = vi.fn()
    const user = setup({ updateAvailable: true, onUpdate })

    await user.click(screen.getByRole('button', { name: '更新する' }))

    expect(onUpdate).toHaveBeenCalledTimes(1)
  })

  it('新しい版がないときは、何も表示しない', () => {
    setup({ updateAvailable: false, onUpdate: () => {} })

    expect(screen.queryByText(NOTICE)).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: '更新する' }),
    ).not.toBeInTheDocument()
  })

  it('更新に関する指定がなくても、トップは今までどおり表示される', () => {
    setup({})

    expect(
      screen.getByRole('button', { name: '一問一答を始める' }),
    ).toBeInTheDocument()
    expect(screen.queryByText(NOTICE)).not.toBeInTheDocument()
  })

  it('解答中は表示せず、トップに戻ると、また表示される', async () => {
    const user = setup({ updateAvailable: true, onUpdate: () => {} })

    await user.click(screen.getByRole('button', { name: '一問一答を始める' }))
    expect(screen.queryByText(NOTICE)).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '中断する' }))
    await user.click(
      within(screen.getByRole('alertdialog')).getByRole('button', {
        name: '中断する',
      }),
    )

    expect(screen.getByText(NOTICE)).toBeInTheDocument()
  })

  it('模擬試験の解答中は表示しない', async () => {
    const user = setup({ updateAvailable: true, onUpdate: () => {} })

    await user.click(screen.getByRole('button', { name: /^模擬試験/ }))

    expect(screen.queryByText(NOTICE)).not.toBeInTheDocument()
  })
})
