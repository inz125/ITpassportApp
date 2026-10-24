import {
  isPastQuestion,
  ORIGINAL_CHOICE_LABELS,
  type Question,
} from './question'

export type Random = () => number

export const QUIZ_SIZE = 10

// Fisher-Yates。乱数を注入できるようにしてテストで固定する
export const shuffle = <T>(items: readonly T[], random: Random): T[] => {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

export const shuffleChoices = (
  question: Question,
  random: Random,
): Question => {
  if (question.fixedChoiceOrder) return question
  const order = shuffle(
    question.choices.map((_, index) => index),
    random,
  )
  return {
    ...question,
    choices: order.map((index) => question.choices[index]),
    answerIndex: order.indexOf(question.answerIndex),
    // 過去問は、元の記号を選択肢と一緒に動かす（解説の「アは〜」と合うように）
    ...(isPastQuestion(question) && {
      choiceLabels: order.map((index) => ORIGINAL_CHOICE_LABELS[index]),
    }),
  }
}

export const createQuiz = (
  pool: readonly Question[],
  random: Random,
  count: number = QUIZ_SIZE,
): Question[] =>
  shuffle(pool, random)
    .slice(0, count)
    .map((question) => shuffleChoices(question, random))

// 問題の順番はそのままで、選択肢だけを並び替える（過去問の模擬試験は問番号順に出題するため）
export const shuffleAllChoices = (
  questions: readonly Question[],
  random: Random,
): Question[] => questions.map((question) => shuffleChoices(question, random))
