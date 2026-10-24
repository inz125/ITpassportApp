import type { Question } from './question'

export type Session = {
  questions: readonly Question[]
  current: number
  selected: number | null
  answers: readonly number[]
}

export type QuestionResult = {
  question: Question
  correct: boolean
}

// 一問一答の結果。選んだ選択肢の位置も持つ（結果画面で誤答を見せるため）
export type AnsweredResult = QuestionResult & {
  selected: number
}

export const startSession = (questions: readonly Question[]): Session => ({
  questions,
  current: 0,
  selected: null,
  answers: [],
})

export const isFinished = (session: Session): boolean =>
  session.current >= session.questions.length

export const selectChoice = (session: Session, index: number): Session => {
  const question = session.questions[session.current]
  if (!question || session.selected !== null) return session
  if (index < 0 || index >= question.choices.length) return session
  return { ...session, selected: index }
}

export const isAnswerCorrect = (session: Session): boolean | null => {
  const question = session.questions[session.current]
  if (!question || session.selected === null) return null
  return session.selected === question.answerIndex
}

export const goNext = (session: Session): Session => {
  if (isFinished(session) || session.selected === null) return session
  return {
    ...session,
    current: session.current + 1,
    selected: null,
    answers: [...session.answers, session.selected],
  }
}

export const getResults = (session: Session): AnsweredResult[] =>
  session.answers.map((answer, index) => ({
    question: session.questions[index],
    correct: answer === session.questions[index].answerIndex,
    selected: answer,
  }))

export const countCorrect = (results: readonly QuestionResult[]): number =>
  results.filter((result) => result.correct).length
