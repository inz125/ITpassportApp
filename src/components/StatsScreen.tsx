import type { ExamRecord } from '../domain/examRecords'
import { recentExamRecords } from '../domain/examRecords'
import { formatElapsed } from '../domain/elapsed'
import { FIELDS } from '../domain/fieldPractice'
import { FIELD_LABELS } from '../domain/question'
import {
  coverageRate,
  overallProgress,
  type FieldProgress,
  type OverallProgress,
} from '../domain/stats'
import { FieldLabel } from './FieldLabel'

type Props = {
  progress: readonly FieldProgress[]
  records: readonly ExamRecord[]
  onBack: () => void
}

const PASSING_SCORE = 600

const describeProgress = ({
  answered,
  total,
  correct,
  rate,
}: OverallProgress) =>
  answered === 0
    ? `まだ解いていません（全${total}問）`
    : `${answered}問解いた（全${total}問）・正解${correct}問（${rate}%）`

const describeCoverage = ({ answered, total }: OverallProgress) =>
  `解いた割合 ${coverageRate(answered, total)}%（全${total}問中${answered}問）`

// 棒グラフの読み上げの名前。解いていないときは、正解率ではなく解いていないことを伝える
const describeRateBar = (name: string, { rate }: OverallProgress) =>
  rate === null ? `${name}はまだ解いていません` : `${name}の正解率 ${rate}%`

const describeCoverageBar = (name: string, item: OverallProgress) =>
  `${name}の解いた割合 ${coverageRate(item.answered, item.total)}%`

// 横棒。長さが割合（0〜100%）
function Bar({
  label,
  percent,
  coverage = false,
}: {
  label: string
  percent: number
  coverage?: boolean
}) {
  return (
    <div
      className={coverage ? 'rate-bar coverage' : 'rate-bar'}
      role="img"
      aria-label={label}
    >
      <div className="rate-bar-fill" style={{ width: `${percent}%` }} />
    </div>
  )
}

// 解いた割合と正解率の2本の棒と、文字
function ProgressBars({ name, item }: { name: string; item: OverallProgress }) {
  return (
    <>
      <Bar
        coverage
        label={describeCoverageBar(name, item)}
        percent={coverageRate(item.answered, item.total)}
      />
      <span>{describeCoverage(item)}</span>
      <Bar label={describeRateBar(name, item)} percent={item.rate ?? 0} />
      <span>{describeProgress(item)}</span>
    </>
  )
}

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

      <section className="overall-progress" aria-label="全分野の合計">
        <h2>全分野の合計</h2>
        <ProgressBars name="全分野" item={overallProgress(progress)} />
      </section>

      <h2>分野別の正解率</h2>
      <ul className="field-progress">
        {progress.map((item) => (
          <li key={item.field} data-field={item.field}>
            <FieldLabel field={item.field} />
            <ProgressBars name={FIELD_LABELS[item.field]} item={item} />
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
