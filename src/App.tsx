import { useState } from 'react'
import { HomeScreen } from './components/HomeScreen'
import { QuizScreen } from './components/QuizScreen'
import { ResultScreen } from './components/ResultScreen'
import { QUESTIONS } from './data/questions'
import {
  countWeak,
  pickWeakQuestions,
  recordAnswer,
  type History,
} from './domain/history'
import type { Question } from './domain/question'
import { createQuiz, type Random } from './domain/quiz'
import {
  getResults,
  goNext,
  isAnswerCorrect,
  isFinished,
  selectChoice,
  startSession,
  type Session,
} from './domain/quizSession'
import {
  getDefaultStorage,
  loadHistory,
  saveHistory,
} from './storage/historyStorage'

type Mode = 'quiz' | 'weak'

type Props = {
  questions?: readonly Question[]
  random?: Random
  storage?: Storage | null
}

function App({
  questions = QUESTIONS,
  random = Math.random,
  storage = getDefaultStorage(),
}: Props) {
  const [session, setSession] = useState<Session | null>(null)
  const [mode, setMode] = useState<Mode>('quiz')
  const [history, setHistory] = useState<History>(() => loadHistory(storage))

  const start = (nextMode: Mode) => {
    const source =
      nextMode === 'weak' ? pickWeakQuestions(questions, history) : questions
    if (source.length === 0) return
    setMode(nextMode)
    setSession(startSession(createQuiz(source, random)))
  }
  const backToHome = () => setSession(null)

  const select = (current: Session, index: number) => {
    const answered = selectChoice(current, index)
    if (answered === current) return
    // 解答した瞬間に記録する（途中で中断しても解いた分は残る）
    const nextHistory = recordAnswer(
      history,
      current.questions[current.current].id,
      isAnswerCorrect(answered) === true,
    )
    setHistory(nextHistory)
    saveHistory(storage, nextHistory)
    setSession(answered)
  }

  if (session === null) {
    return (
      <HomeScreen
        weakCount={countWeak(questions, history)}
        onStart={() => start('quiz')}
        onStartWeak={() => start('weak')}
      />
    )
  }

  if (isFinished(session)) {
    return (
      <ResultScreen
        results={getResults(session)}
        remainingWeak={
          mode === 'weak' ? countWeak(questions, history) : undefined
        }
        onRetry={() => start(mode)}
        onHome={backToHome}
      />
    )
  }

  return (
    <QuizScreen
      session={session}
      onSelect={(index) => select(session, index)}
      onNext={() => setSession(goNext(session))}
      onQuit={backToHome}
    />
  )
}

export default App
