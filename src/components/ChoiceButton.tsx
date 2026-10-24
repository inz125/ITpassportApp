import { choiceLabel, type Question } from '../domain/question'

type Props = {
  question: Question
  index: number
  // 解答後の正誤の印（一問一答など）
  state?: 'correct' | 'wrong'
  // 選んでいる答え（模擬試験）
  pressed?: boolean
  disabled?: boolean
  onClick: () => void
}

// 選択肢の左に記号のバッジ、右に正誤の印を付ける。
// バッジと印は装飾なので、読み上げの名前（選択肢の文）には含めない
export function ChoiceButton({
  question,
  index,
  state,
  pressed,
  disabled,
  onClick,
}: Props) {
  return (
    <button
      type="button"
      className="choice"
      data-state={state}
      aria-pressed={pressed}
      disabled={disabled}
      onClick={onClick}
    >
      <span className="badge" aria-hidden="true">
        {choiceLabel(question, index)}
      </span>
      <span className="choice-text">{question.choices[index]}</span>
      {state && (
        <span className="mark" aria-hidden="true">
          {state === 'correct' ? '✓' : '✕'}
        </span>
      )}
    </button>
  )
}
