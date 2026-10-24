import { useEffect, useState } from 'react'
import {
  answerQuestion,
  goNextQuestion,
  goPreviousQuestion,
  goToQuestion,
  gradeExam,
  startExam,
  type ExamGrade,
  type ExamQuestionResult,
} from '../domain/examSession'
import type { Question } from '../domain/question'
import { createQuiz, shuffleAllChoices, type Random } from '../domain/quiz'
import { ExamConfirmScreen } from './ExamConfirmScreen'
import { ExamQuestionScreen } from './ExamQuestionScreen'
import { ExamResultScreen } from './ExamResultScreen'

type Props = {
  questions: readonly Question[]
  // 過去問は問番号の順に出題する。false のときは問題の順番もシャッフルする
  keepOrder: boolean
  random: Random
  now: () => number
  // 提出したときに、採点結果を渡す（履歴への記録は呼び出し側）
  onSubmit: (results: readonly ExamQuestionResult[]) => void
  onExit: () => void
}

type Phase = 'answering' | 'confirming' | 'result'

const newExam = (
  questions: readonly Question[],
  keepOrder: boolean,
  random: Random,
) =>
  startExam(
    keepOrder
      ? shuffleAllChoices(questions, random)
      : createQuiz(questions, random, questions.length),
  )

export function ExamFlow({
  questions,
  keepOrder,
  random,
  now,
  onSubmit,
  onExit,
}: Props) {
  const [session, setSession] = useState(() =>
    newExam(questions, keepOrder, random),
  )
  const [phase, setPhase] = useState<Phase>('answering')
  const [startedAt, setStartedAt] = useState(now)
  const [current, setCurrent] = useState(now)
  const [finished, setFinished] = useState<{
    grade: ExamGrade
    elapsedMs: number
  } | null>(null)

  // 提出するまでは、1秒ごとに経過時間を更新する
  useEffect(() => {
    if (phase === 'result') return
    const timer = setInterval(() => setCurrent(now()), 1000)
    return () => clearInterval(timer)
  }, [phase, now])

  const submit = () => {
    const grade = gradeExam(session)
    setFinished({ grade, elapsedMs: now() - startedAt })
    setPhase('result')
    onSubmit(grade.results)
  }

  const restart = () => {
    const time = now()
    setSession(newExam(questions, keepOrder, random))
    setStartedAt(time)
    setCurrent(time)
    setFinished(null)
    setPhase('answering')
  }

  if (phase === 'result' && finished) {
    return (
      <ExamResultScreen
        grade={finished.grade}
        elapsedMs={finished.elapsedMs}
        onRetry={restart}
        onHome={onExit}
      />
    )
  }

  if (phase === 'confirming') {
    return (
      <ExamConfirmScreen
        session={session}
        elapsedMs={current - startedAt}
        onJump={(index) => {
          setSession(goToQuestion(session, index))
          setPhase('answering')
        }}
        onBack={() => setPhase('answering')}
        onSubmit={submit}
      />
    )
  }

  return (
    <ExamQuestionScreen
      session={session}
      elapsedMs={current - startedAt}
      onSelect={(index) => setSession(answerQuestion(session, index))}
      onPrevious={() => setSession(goPreviousQuestion(session))}
      onNext={() => setSession(goNextQuestion(session))}
      onConfirm={() => setPhase('confirming')}
      onQuit={onExit}
    />
  )
}
