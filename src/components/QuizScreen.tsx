import { useState } from 'react'
import { isAnswerCorrect, type Session } from '../domain/quizSession'
import { ChoiceButton } from './ChoiceButton'
import { Explanation } from './Explanation'
import { FieldLabel } from './FieldLabel'
import { QuestionBody } from './QuestionBody'
import { QuitDialog } from './QuitDialog'

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
        <FieldLabel field={question.field} />
        <button type="button" onClick={() => setConfirming(true)}>
          中断する
        </button>
      </header>

      <QuestionBody key={question.id} question={question} />

      <div className="choices">
        {question.choices.map((choice, index) => {
          const state = !answered
            ? undefined
            : index === question.answerIndex
              ? 'correct'
              : index === session.selected
                ? 'wrong'
                : undefined
          return (
            <ChoiceButton
              key={choice}
              question={question}
              index={index}
              state={state}
              disabled={answered}
              onClick={() => onSelect(index)}
            />
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
          <Explanation question={question} />
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
        <QuitDialog
          message="解答を中断してトップに戻りますか？"
          onQuit={onQuit}
          onCancel={() => setConfirming(false)}
        />
      )}
    </main>
  )
}
