import type { ExamRecord } from '../domain/examRecords'
import { recentExamRecords } from '../domain/examRecords'
import { formatElapsed } from '../domain/elapsed'
import { FIELDS } from '../domain/fieldPractice'
import { FIELD_LABELS } from '../domain/question'
import type { FieldProgress } from '../domain/stats'
import { FieldLabel } from './FieldLabel'

type Props = {
  progress: readonly FieldProgress[]
  records: readonly ExamRecord[]
  onBack: () => void
}

const PASSING_SCORE = 600

const describeProgress = ({ answered, total, correct, rate }: FieldProgress) =>
  answered === 0
    ? `まだ解いていません（全${total}問）`
    : `${answered}問解いた（全${total}問）・正解${correct}問（${rate}%）`

// 棒グラフの読み上げの名前。解いていない分野は、割合ではなく解いていないことを伝える
const describeBar = ({ field, rate }: FieldProgress) =>
  rate === null
    ? `${FIELD_LABELS[field]}はまだ解いていません`
    : `${FIELD_LABELS[field]}の正解率 ${rate}%`

const formatDate = (at: number) =>
  new Date(at).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  })

// 学習の記録。分野別の正解率と、模擬試験の成績（一覧とグラフ）を見せる。消去はできない
export function StatsScreen({ progress, records, onBack }: Props) {
  const newestFirst = [...records].reverse()

  return (
    <main className="screen">
      <h1>学習の記録</h1>

      <h2>分野別の正解率</h2>
      <ul className="field-progress">
        {progress.map((item) => (
          <li key={item.field} data-field={item.field}>
            <FieldLabel field={item.field} />
            <div className="rate-bar" role="img" aria-label={describeBar(item)}>
              <div
                className="rate-bar-fill"
                style={{ width: `${item.rate ?? 0}%` }}
              />
            </div>
            <span>{describeProgress(item)}</span>
          </li>
        ))}
      </ul>

      <h2>模擬試験の成績</h2>
      {records.length === 0 ? (
        <p>模擬試験の記録はまだありません</p>
      ) : (
        <>
          <div
            className="score-chart"
            role="img"
            aria-label={`総合点の推移（合格ライン${PASSING_SCORE}点）`}
          >
            <div className="pass-line" aria-hidden="true" />
            {recentExamRecords(records).map((record) => (
              <div
                key={record.at}
                className={record.passed ? 'score-bar pass' : 'score-bar fail'}
                aria-hidden="true"
                style={{ height: `${record.totalScore / 10}%` }}
              />
            ))}
          </div>
          <ol className="exam-records" aria-label="模擬試験の成績">
            {newestFirst.map((record) => (
              <li key={record.at}>
                <p>{`${formatDate(record.at)}　${record.exam}`}</p>
                <p>{`総合 ${record.totalScore}点　${record.passed ? '合格' : '不合格'}　所要時間 ${formatElapsed(record.elapsedMs)}`}</p>
                <p className="note">
                  {FIELDS.map(
                    (field) =>
                      `${FIELD_LABELS[field]} ${record.fieldScores[field]}点`,
                  ).join('・')}
                </p>
              </li>
            ))}
          </ol>
        </>
      )}

      <button type="button" onClick={onBack}>
        戻る
      </button>
    </main>
  )
}
