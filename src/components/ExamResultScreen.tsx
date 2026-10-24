import { useState } from 'react'
import { formatElapsed } from '../domain/elapsed'
import type { ExamGrade, ExamQuestionResult } from '../domain/examSession'
import { FIELDS } from '../domain/fieldPractice'
import { choiceLabel, FIELD_LABELS, formatSource } from '../domain/question'
import { Explanation } from './Explanation'

type Props = {
  grade: ExamGrade
  elapsedMs: number
  onRetry: () => void
  onHome: () => void
}

function ResultItem({ result }: { result: ExamQuestionResult }) {
  const [open, setOpen] = useState(false)
  const { question, selected, correct } = result
  const source = formatSource(question)

  return (
    <li>
      <button
        type="button"
        className="result-toggle"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <span role="img" aria-label={correct ? '正解' : '不正解'}>
          {correct ? '○' : '×'}
        </span>
        <span>{question.text}</span>
      </button>
      {open && (
        <div className="result-detail">
          <p>{`あなたの答え：${selected === null ? '未回答' : `${choiceLabel(question, selected)}　${question.choices[selected]}`}`}</p>
          <p>{`正しい答え：${choiceLabel(question, question.answerIndex)}　${question.choices[question.answerIndex]}`}</p>
          <Explanation question={question} />
          {source && <p className="note">{source}</p>}
        </div>
      )}
    </li>
  )
}

export function ExamResultScreen({ grade, elapsedMs, onRetry, onHome }: Props) {
  const { judgement, results } = grade

  return (
    <main className="screen">
      <h1>結果</h1>
      <p className={judgement.passed ? 'verdict pass' : 'verdict fail'}>
        {judgement.passed ? '合格' : '不合格'}
      </p>
      <p className="score">{`総合：${judgement.totalScore}点`}</p>
      {FIELDS.map((field) => (
        <p key={field} className="field-score" data-field={field}>
          {`${FIELD_LABELS[field]}：${judgement.fieldScores[field]}点`}
        </p>
      ))}
      <p>{`所要時間：${formatElapsed(elapsedMs)}`}</p>

      <ol className="results">
        {results.map((result) => (
          <ResultItem key={result.question.id} result={result} />
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
