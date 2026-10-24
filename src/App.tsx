import { useState } from 'react'
import { ExamFlow } from './components/ExamFlow'
import { HomeScreen, type MockExamButton } from './components/HomeScreen'
import { QuizScreen } from './components/QuizScreen'
import { ResultScreen } from './components/ResultScreen'
import { QUESTIONS } from './data/questions'
import { canStartExam } from './domain/examSession'
import { countByField, pickByField } from './domain/fieldPractice'
import {
  countWeak,
  pickWeakQuestions,
  recordAnswer,
  recordResults,
  type History,
} from './domain/history'
import type { Field } from './domain/judgeExam'
import type { Question } from './domain/question'
import { groupPastExams, shortExamName } from './domain/pastExam'
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

// 模擬試験で出題する問題。過去問は回ごとに問番号の順、過去問がなければ全問をシャッフルする
type MockExam = MockExamButton & {
  questions: readonly Question[]
  keepOrder: boolean
}

type Mode =
  { type: 'quiz' } | { type: 'weak' } | { type: 'field'; field: Field }

type Props = {
  questions?: readonly Question[]
  random?: Random
  storage?: Storage | null
  now?: () => number
  // 新しい版が公開されているか。あるときだけ、トップ画面に更新の案内を出す
  updateAvailable?: boolean
  onUpdate?: () => void
}

function App({
  questions = QUESTIONS,
  random = Math.random,
  storage = getDefaultStorage(),
  now = Date.now,
  updateAvailable = false,
  onUpdate = () => {},
}: Props) {
  const [session, setSession] = useState<Session | null>(null)
  const [mode, setMode] = useState<Mode>({ type: 'quiz' })
  const [history, setHistory] = useState<History>(() => loadHistory(storage))
  const [mockExam, setMockExam] = useState<MockExam | null>(null)

  const pickSource = (target: Mode): readonly Question[] => {
    switch (target.type) {
      case 'weak':
        return pickWeakQuestions(questions, history)
      case 'field':
        return pickByField(questions, target.field)
      default:
        return questions
    }
  }

  const start = (nextMode: Mode) => {
    const source = pickSource(nextMode)
    if (source.length === 0) return
    setMode(nextMode)
    setSession(startSession(createQuiz(source, random)))
  }
  const backToHome = () => setSession(null)

  const pastExams = groupPastExams(questions)
  const mockExams: MockExam[] =
    pastExams.length > 0
      ? pastExams.map((exam) => ({
          key: exam.name,
          label: `模擬試験（${shortExamName(exam.name)}）`,
          enabled: canStartExam(exam.questions),
          questions: exam.questions,
          keepOrder: true,
        }))
      : [
          {
            key: 'all',
            label: '模擬試験を始める',
            enabled: canStartExam(questions),
            questions,
            keepOrder: false,
          },
        ]

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

  if (mockExam) {
    return (
      <ExamFlow
        questions={mockExam.questions}
        keepOrder={mockExam.keepOrder}
        random={random}
        now={now}
        onSubmit={(results) => {
          // 提出したときに、全問の正誤をまとめて記録する（未回答は不正解）
          const nextHistory = recordResults(history, results)
          setHistory(nextHistory)
          saveHistory(storage, nextHistory)
        }}
        onExit={() => setMockExam(null)}
      />
    )
  }

  if (session === null) {
    return (
      <HomeScreen
        updateAvailable={updateAvailable}
        onUpdate={onUpdate}
        mockExams={mockExams}
        onStartExam={(key) =>
          setMockExam(mockExams.find((exam) => exam.key === key) ?? null)
        }
        weakCount={countWeak(questions, history)}
        fieldCounts={countByField(questions)}
        onStart={() => start({ type: 'quiz' })}
        onStartWeak={() => start({ type: 'weak' })}
        onStartField={(field) => start({ type: 'field', field })}
      />
    )
  }

  if (isFinished(session)) {
    return (
      <ResultScreen
        results={getResults(session)}
        remainingWeak={
          mode.type === 'weak' ? countWeak(questions, history) : undefined
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
