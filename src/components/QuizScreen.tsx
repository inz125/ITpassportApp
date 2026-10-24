import { useState } from 'react'
import { FIELD_LABELS } from '../domain/question'
import { isAnswerCorrect, type Session } from '../domain/quizSession'

type Props = {
  session: Session
  onSelect: (index: number) => void
  onNext: () => void
  onQuit: () => void
}

export function QuizScreen({ session, onSelect, onNext, onQuit }: Props) {
  const [confirming, setConfirming] = useState(false)
  const question = session.questions[session.current]
  const total = session.questions.length
  const answered = session.selected !== null
  const correct = isAnswerCorrect(session)
  const isLast = session.current === total - 1

  return (
    <main className="screen">
      <header className="quiz-header">
        <p>{`${session.current + 1} / ${total}問`}</p>
        <p className="field">{FIELD_LABELS[question.field]}</p>
        <button type="button" onClick={() => setConfirming(true)}>
          中断する
        </button>
      </header>

      <h2>{question.text}</h2>

      <div className="choices">
        {question.choices.map((choice, index) => {
          const state = !answered
            ? ''
            : index === question.answerIndex
              ? 'correct'
              : index === session.selected
                ? 'wrong'
                : ''
          return (
            <button
              key={choice}
              type="button"
              className={`choice ${state}`}
              disabled={answered}
              onClick={() => onSelect(index)}
            >
              {choice}
            </button>
          )
        })}
      </div>

      {answered && (
        <section className="feedback">
          <p role="status" className={correct ? 'ok' : 'ng'}>
            {correct ? '正解' : '不正解'}
          </p>
          {!correct && (
            <p>{`正解は「${question.choices[question.answerIndex]}」です`}</p>
          )}
          <p>{question.explanation}</p>
        </section>
      )}

      <button
        type="button"
        className="primary"
        disabled={!answered}
        onClick={onNext}
      >
        {isLast ? '結果を見る' : '次の問題へ'}
      </button>

      {confirming && (
        <div className="overlay">
          <div role="alertdialog" aria-modal="true" aria-label="中断の確認">
            <p>解答を中断してトップに戻りますか？</p>
            <button type="button" onClick={onQuit}>
              中断する
            </button>
            <button
              type="button"
              className="primary"
              onClick={() => setConfirming(false)}
            >
              続ける
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
