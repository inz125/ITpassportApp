import { useState } from 'react'
import { HomeScreen } from './components/HomeScreen'
import { QuizScreen } from './components/QuizScreen'
import { ResultScreen } from './components/ResultScreen'
import { QUESTIONS } from './data/questions'
import type { Question } from './domain/question'
import { createQuiz, type Random } from './domain/quiz'
import {
  getResults,
  goNext,
  isFinished,
  selectChoice,
  startSession,
  type Session,
} from './domain/quizSession'

type Props = {
  questions?: readonly Question[]
  random?: Random
}

function App({ questions = QUESTIONS, random = Math.random }: Props) {
  const [session, setSession] = useState<Session | null>(null)

  const start = () => setSession(startSession(createQuiz(questions, random)))
  const backToHome = () => setSession(null)

  if (session === null) {
    return <HomeScreen onStart={start} />
  }

  if (isFinished(session)) {
    return (
      <ResultScreen
        results={getResults(session)}
        onRetry={start}
        onHome={backToHome}
      />
    )
  }

  return (
    <QuizScreen
      session={session}
      onSelect={(index) => setSession(selectChoice(session, index))}
      onNext={() => setSession(goNext(session))}
      onQuit={backToHome}
    />
  )
}

export default App
