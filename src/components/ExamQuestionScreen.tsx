import { useState } from 'react'
import { formatElapsed } from '../domain/elapsed'
import type { ExamSession } from '../domain/examSession'
import { ChoiceButton } from './ChoiceButton'
import { FieldLabel } from './FieldLabel'
import { QuestionBody } from './QuestionBody'
import { QuitDialog } from './QuitDialog'

type Props = {
  session: ExamSession
  elapsedMs: number
  onSelect: (index: number) => void
  onPrevious: () => void
  onNext: () => void
  onConfirm: () => void
  onQuit: () => void
}

export function ExamQuestionScreen({
  session,
  elapsedMs,
  onSelect,
  onPrevious,
  onNext,
  onConfirm,
  onQuit,
}: Props) {
  const [confirming, setConfirming] = useState(false)
  const question = session.questions[session.current]
  const total = session.questions.length
  const selected = session.answers[session.current]

  return (
    <main className="screen">
      <header className="quiz-header">
        <p>{`${session.current + 1} / ${total}問`}</p>
        <FieldLabel field={question.field} />
        <button type="button" onClick={() => setConfirming(true)}>
          中断する
        </button>
      </header>
      <p className="note">{`経過時間：${formatElapsed(elapsedMs)}`}</p>

      <QuestionBody key={question.id} question={question} />

      <div className="choices">
        {question.choices.map((choice, index) => (
          <ChoiceButton
            key={choice}
            question={question}
            index={index}
            pressed={selected === index}
            onClick={() => onSelect(index)}
          />
        ))}
      </div>

      <div className="exam-nav">
        <button
          type="button"
          disabled={session.current === 0}
          onClick={onPrevious}
        >
          前へ
        </button>
        <button
          type="button"
          disabled={session.current === total - 1}
          onClick={onNext}
        >
          次へ
        </button>
      </div>
      <button type="button" className="primary" onClick={onConfirm}>
        確認へ
      </button>

      {confirming && (
        <QuitDialog
          message="模擬試験を中断すると、ここまでの解答は記録されず破棄されます。トップに戻りますか？"
          onQuit={onQuit}
          onCancel={() => setConfirming(false)}
        />
      )}
    </main>
  )
}
