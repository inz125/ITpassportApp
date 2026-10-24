import { FIELDS } from '../domain/fieldPractice'
import type { Field } from '../domain/judgeExam'
import { FIELD_LABELS } from '../domain/question'

// トップに並べる模擬試験のボタン（過去問は回ごと、過去問がなければ1つ）
export type MockExamButton = {
  key: string
  label: string
  enabled: boolean
}

type Props = {
  mockExams: readonly MockExamButton[]
  weakCount: number
  fieldCounts: Record<Field, number>
  onStart: () => void
  onStartExam: (key: string) => void
  onStartWeak: () => void
  onStartField: (field: Field) => void
}

export function HomeScreen({
  mockExams,
  weakCount,
  fieldCounts,
  onStart,
  onStartExam,
  onStartWeak,
  onStartField,
}: Props) {
  return (
    <main className="screen">
      <h1>ITパスポート学習</h1>
      <button type="button" className="primary" onClick={onStart}>
        一問一答を始める
      </button>
      {mockExams.map((exam) => (
        <button
          key={exam.key}
          type="button"
          disabled={!exam.enabled}
          onClick={() => onStartExam(exam.key)}
        >
          {exam.label}
        </button>
      ))}
      <button type="button" disabled={weakCount === 0} onClick={onStartWeak}>
        {`苦手を復習する（${weakCount}問）`}
      </button>
      {weakCount === 0 && <p className="note">苦手な問題はありません</p>}

      <h2>分野別演習</h2>
      {FIELDS.map((field) => (
        <button
          key={field}
          type="button"
          className="field-button"
          data-field={field}
          disabled={fieldCounts[field] === 0}
          onClick={() => onStartField(field)}
        >
          {`${FIELD_LABELS[field]}で練習`}
        </button>
      ))}
    </main>
  )
}
