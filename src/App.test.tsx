import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
  it('アプリのタイトルが表示される', () => {
    render(<App />)

    expect(
      screen.getByRole('heading', { level: 1, name: 'ITパスポート学習' }),
    ).toBeInTheDocument()
  })
})
