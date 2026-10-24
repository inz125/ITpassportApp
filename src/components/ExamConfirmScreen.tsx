import { formatElapsed } from '../domain/elapsed'
import { getUnanswered, type ExamSession } from '../domain/examSession'

type Props = {
  session: ExamSession
  elapsedMs: number
  onJump: (index: number) => void
  onBack: () => void
  onSubmit: () => void
}

export function ExamConfirmScreen({
  session,
  elapsedMs,
  onJump,
  onBack,
  onSubmit,
}: Props) {
  const unanswered = getUnanswered(session)

  return (
    <main className="screen">
      <h1>提出前の確認</h1>
      <p className="note">{`経過時間：${formatElapsed(elapsedMs)}`}</p>

      {unanswered.length === 0 ? (
        <p>すべての問題に解答済みです</p>
      ) : (
        <>
          <p>{`未回答が${unanswered.length}問あります`}</p>
          <div className="choices">
            {unanswered.map((index) => (
              <button key={index} type="button" onClick={() => onJump(index)}>
                {`${index + 1}問目`}
              </button>
            ))}
          </div>
          <p className="note">
            未回答のまま提出すると、不正解として採点されます。
          </p>
        </>
      )}

      <button type="button" onClick={onBack}>
        解答に戻る
      </button>
      <button type="button" className="primary" onClick={onSubmit}>
        提出する
      </button>
    </main>
  )
}
