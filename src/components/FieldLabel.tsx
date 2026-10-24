import type { Field } from '../domain/judgeExam'
import { FIELD_LABELS } from '../domain/question'

type Props = {
  field: Field
}

// 分野名を、分野ごとの色のラベルで表示する（色は data-field を使って CSS で決める）
export function FieldLabel({ field }: Props) {
  return (
    <span className="field-label" data-field={field}>
      {FIELD_LABELS[field]}
    </span>
  )
}
