import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(() => {
  cleanup()
  // 履歴は localStorage に残るため、テスト間で持ち越さない
  localStorage.clear()
})
