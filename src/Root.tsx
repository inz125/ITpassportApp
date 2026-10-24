import { useRef, useState } from 'react'
import { registerSW } from 'virtual:pwa-register'
import App from './App.tsx'

// 新しい版が公開されたかを確認し、見つかったら App に知らせる。切り替えは「更新する」を押したときだけ
export function Root() {
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const updateSW = useRef<((reloadPage?: boolean) => Promise<void>) | null>(
    null,
  )
  // 一度だけ登録する（StrictMode でも二重に登録しない）
  if (updateSW.current === null) {
    updateSW.current = registerSW({
      onNeedRefresh: () => setUpdateAvailable(true),
    })
  }

  return (
    <App
      updateAvailable={updateAvailable}
      onUpdate={() => void updateSW.current?.(true)}
    />
  )
}
