import { FIELDS, countByField } from './fieldPractice'
import { judgeExam, type ExamJudgement, type Field } from './judgeExam'
import type { Question } from './question'
import type { QuestionResult } from './quizSession'

export type ExamSession = {
  questions: readonly Question[]
  current: number
  // 問題ごとに選んだ選択肢の位置。未回答は null
  answers: readonly (number | null)[]
}

export type ExamQuestionResult = QuestionResult & {
  selected: number | null
}

export type ExamGrade = {
  results: ExamQuestionResult[]
  judgement: ExamJudgement
}

export const startExam = (questions: readonly Question[]): ExamSession => ({
  questions,
  current: 0,
  answers: questions.map(() => null),
})

export const answerQuestion = (
  session: ExamSession,
  choiceIndex: number,
): ExamSession => {
  const question = session.questions[session.current]
  if (!question) return session
  if (choiceIndex < 0 || choiceIndex >= question.choices.length) return session
  return {
    ...session,
    answers: session.answers.map((answer, index) =>
      index === session.current ? choiceIndex : answer,
    ),
  }
}

export const goToQuestion = (
  session: ExamSession,
  index: number,
): ExamSession =>
  index < 0 || index >= session.questions.length
    ? session
    : { ...session, current: index }

export const goNextQuestion = (session: ExamSession): ExamSession =>
  goToQuestion(
    session,
    Math.min(session.current + 1, session.questions.length - 1),
  )

export const goPreviousQuestion = (session: ExamSession): ExamSession =>
  goToQuestion(session, Math.max(session.current - 1, 0))

export const getUnanswered = (session: ExamSession): number[] =>
  session.answers.flatMap((answer, index) => (answer === null ? [index] : []))

// 判定は分野ごとの問題数が必要なので、どの分野にも問題があるときだけ始められる
export const canStartExam = (questions: readonly Question[]): boolean => {
  const counts = countByField(questions)
  return FIELDS.every((field) => counts[field] > 0)
}

// 未回答は不正解として、全問を分母に含めて採点する
export const gradeExam = (session: ExamSession): ExamGrade => {
  const results = session.questions.map((question, index) => {
    const selected = session.answers[index]
    return { question, selected, correct: selected === question.answerIndex }
  })

  const tally = (field: Field) => {
    const inField = results.filter((result) => result.question.field === field)
    return {
      correct: inField.filter((result) => result.correct).length,
      total: inField.length,
    }
  }

  return {
    results,
    judgement: judgeExam({
      strategy: tally('strategy'),
      management: tally('management'),
      technology: tally('technology'),
    }),
  }
}
