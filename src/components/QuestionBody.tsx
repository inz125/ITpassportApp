import { formatSource, type Question } from '../domain/question'

type Props = {
  question: Question
}

// 問題文の部分（事例文・問題文・図・出典）。一問一答・模擬試験で共通
export function QuestionBody({ question }: Props) {
  const source = formatSource(question)

  return (
    <div className="question-body card" data-card="question">
      {question.passage && (
        <details className="passage" open>
          <summary>事例文</summary>
          <p>{question.passage}</p>
        </details>
      )}
      <h2>{question.text}</h2>
      {question.figure && (
        <img
          className="figure"
          src={question.figure.src}
          alt={question.figure.alt}
        />
      )}
      {source && <p className="note">{source}</p>}
    </div>
  )
}
