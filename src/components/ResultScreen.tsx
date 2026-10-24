import { countCorrect, type QuestionResult } from '../domain/quizSession'

type Props = {
  results: readonly QuestionResult[]
  onRetry: () => void
  onHome: () => void
}

export function ResultScreen({ results, onRetry, onHome }: Props) {
  return (
    <main className="screen">
      <h1>結果</h1>
      <p className="score">{`${results.length}問中${countCorrect(results)}問正解`}</p>

      <ol className="results">
        {results.map(({ question, correct }) => (
          <li key={question.id}>
            <span role="img" aria-label={correct ? '正解' : '不正解'}>
              {correct ? '○' : '×'}
            </span>
            <span>{question.text}</span>
          </li>
        ))}
      </ol>

      <button type="button" className="primary" onClick={onRetry}>
        もう一度
      </button>
      <button type="button" onClick={onHome}>
        トップへ
      </button>
    </main>
  )
}
