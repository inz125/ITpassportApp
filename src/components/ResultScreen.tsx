import { countCorrect, type AnsweredResult } from '../domain/quizSession'
import { ResultDetail } from './ResultDetail'

type Props = {
  results: readonly AnsweredResult[]
  // 苦手復習の結果画面でだけ渡す（一問一答では表示しない）
  remainingWeak?: number
  onRetry: () => void
  onHome: () => void
}

export function ResultScreen({
  results,
  remainingWeak,
  onRetry,
  onHome,
}: Props) {
  return (
    <main className="screen">
      <h1>結果</h1>
      <p className="score">{`${results.length}問中${countCorrect(results)}問正解`}</p>
      {remainingWeak !== undefined && <p>{`残りの苦手：${remainingWeak}問`}</p>}

      <ol className="results">
        {results.map(({ question, correct, selected }) => (
          <li key={question.id}>
            <div className="result-summary">
              <span role="img" aria-label={correct ? '正解' : '不正解'}>
                {correct ? '○' : '×'}
              </span>
              <span>{question.text}</span>
            </div>
            {!correct && (
              <ResultDetail question={question} selected={selected} />
            )}
          </li>
        ))}
      </ol>

      <button
        type="button"
        className="primary"
        disabled={remainingWeak === 0}
        onClick={onRetry}
      >
        もう一度
      </button>
      <button type="button" onClick={onHome}>
        トップへ
      </button>
    </main>
  )
}
