import { describe, expect, it } from 'vitest'
import type { Field } from './judgeExam'
import { groupPastExams, shortExamName } from './pastExam'
import type { Question } from './question'

const EXAM_R08 = '令和8年度 ITパスポート試験 公開問題'
const EXAM_R09 = '令和9年度 ITパスポート試験 公開問題'

const past = (
  exam: string,
  number: number,
  field: Field = 'strategy',
): Question => ({
  id: `${exam}-${number}`,
  field,
  text: `問題${number}`,
  choices: ['A', 'B', 'C', 'D'],
  answerIndex: 0,
  explanation: '解説',
  source: { exam, number },
})

const original: Question = {
  id: 'o1',
  field: 'strategy',
  text: 'オリジナル',
  choices: ['A', 'B', 'C', 'D'],
  answerIndex: 0,
  explanation: '解説',
}

describe('groupPastExams（過去問を回ごとにまとめる）', () => {
  it('過去問を、試験名ごとにまとめる', () => {
    const exams = groupPastExams([
      past(EXAM_R08, 1),
      past(EXAM_R09, 1),
      past(EXAM_R08, 2),
    ])

    expect(exams.map((exam) => exam.name)).toEqual([EXAM_R08, EXAM_R09])
    expect(exams[0].questions).toHaveLength(2)
    expect(exams[1].questions).toHaveLength(1)
  })

  it('各回の問題は、問番号の順に並ぶ', () => {
    const [exam] = groupPastExams([
      past(EXAM_R08, 3),
      past(EXAM_R08, 1),
      past(EXAM_R08, 2),
    ])

    expect(exam.questions.map((q) => q.source!.number)).toEqual([1, 2, 3])
  })

  it('オリジナル問題は含まれない', () => {
    const exams = groupPastExams([original, past(EXAM_R08, 1)])

    expect(exams).toHaveLength(1)
    expect(exams[0].questions.map((q) => q.id)).toEqual([`${EXAM_R08}-1`])
  })

  it('過去問がなければ、空になる', () => {
    expect(groupPastExams([original])).toEqual([])
  })

  it('回が現れた順に並ぶ', () => {
    const exams = groupPastExams([past(EXAM_R09, 1), past(EXAM_R08, 1)])

    expect(exams.map((exam) => exam.name)).toEqual([EXAM_R09, EXAM_R08])
  })
})

describe('shortExamName（画面に出す短い名前）', () => {
  it('「ITパスポート試験」を省いて、年度と公開問題だけにする', () => {
    expect(shortExamName(EXAM_R08)).toBe('令和8年度 公開問題')
  })

  it('「ITパスポート試験」を含まない名前は、そのまま返す', () => {
    expect(shortExamName('別の試験')).toBe('別の試験')
  })
})
