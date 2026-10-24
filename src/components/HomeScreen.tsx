type Props = {
  onStart: () => void
}

export function HomeScreen({ onStart }: Props) {
  return (
    <main className="screen">
      <h1>ITパスポート学習</h1>
      <button type="button" className="primary" onClick={onStart}>
        一問一答を始める
      </button>
    </main>
  )
}
