import { choiceLabel, formatSource, type Question } from '../domain/question'
import { Explanation } from './Explanation'

type Props = {
  question: Question
  // 選んだ選択肢の位置。未回答は null
  selected: number | null
}

// 結果画面で、問題ごとに「あなたの答え」「正しい答え」「解説」「出典」を見せる
export function ResultDetail({ question, selected }: Props) {
  const source = formatSource(question)

  return (
    <div className="result-detail">
      <p>{`あなたの答え：${selected === null ? '未回答' : `${choiceLabel(selected)}　${question.choices[selected]}`}`}</p>
      <p>{`正しい答え：${choiceLabel(question.answerIndex)}　${question.choices[question.answerIndex]}`}</p>
      <Explanation question={question} />
      {source && <p className="note">{source}</p>}
    </div>
  )
}
