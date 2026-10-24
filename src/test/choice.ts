// 選択肢のボタンから、選択肢の文だけを取り出す（記号のバッジや正誤の印は含めない）。
// 選択肢ではないボタン（「中断する」など）は、空文字になる
export const choiceText = (button: HTMLElement): string =>
  button.querySelector('.choice-text')?.textContent ?? ''
