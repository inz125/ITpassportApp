type Props = {
  message: string
  onQuit: () => void
  onCancel: () => void
}

export function QuitDialog({ message, onQuit, onCancel }: Props) {
  return (
    <div className="overlay">
      <div role="alertdialog" aria-modal="true" aria-label="中断の確認">
        <p>{message}</p>
        <button type="button" onClick={onQuit}>
          中断する
        </button>
        <button type="button" className="primary" onClick={onCancel}>
          続ける
        </button>
      </div>
    </div>
  )
}
