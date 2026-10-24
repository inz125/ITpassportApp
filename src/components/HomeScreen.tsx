type Props = {
  weakCount: number
  onStart: () => void
  onStartWeak: () => void
}

export function HomeScreen({ weakCount, onStart, onStartWeak }: Props) {
  return (
    <main className="screen">
      <h1>ITパスポート学習</h1>
      <button type="button" className="primary" onClick={onStart}>
        一問一答を始める
      </button>
      <button type="button" disabled={weakCount === 0} onClick={onStartWeak}>
        {`苦手を復習する（${weakCount}問）`}
      </button>
      {weakCount === 0 && <p className="note">苦手な問題はありません</p>}
    </main>
  )
}
