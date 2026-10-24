import { isPastQuestion, type Question } from '../domain/question'

type Props = {
  question: Question
}

// 過去問の解説は IPA のものではないため、その旨を添える
export function Explanation({ question }: Props) {
  return (
    <>
      <p>{question.explanation}</p>
      {isPastQuestion(question) && (
        <p className="note">
          解説はこのアプリ独自のもので、IPA によるものではありません
        </p>
      )}
    </>
  )
}
