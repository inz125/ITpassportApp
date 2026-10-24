import { expect, test } from '@playwright/test'
import { answerCurrent } from './helpers'

const STORAGE_KEY = 'itpassport-app:history:v1'

test('過去問を解くと、出典・図・アプリ独自の解説である旨が表示される', async ({
  page,
}) => {
  // 令和8年度の問3（表の図がある問題）を苦手にしておき、苦手復習で出題させる
  await page.addInitScript(([key, value]) => localStorage.setItem(key, value), [
    STORAGE_KEY,
    JSON.stringify({ 'r08-003': false }),
  ] as const)
  await page.goto('./')
  await page.getByRole('button', { name: '苦手を復習する（1問）' }).click()

  await expect(
    page.getByText(
      '出典：令和8年度 ITパスポート試験 公開問題 問3（選択肢の順序を変更）',
    ),
  ).toBeVisible()

  // 図の画像が、公開時と同じビルドで実際に読み込めている
  const figure = page.getByRole('img', { name: /投資戦略ごとの予想利益の表/ })
  await expect(figure).toBeVisible()
  expect(
    await figure.evaluate(
      (img: HTMLImageElement) => img.complete && img.naturalWidth > 0,
    ),
  ).toBe(true)

  await answerCurrent(page, true)
  await expect(
    page.getByText(
      '解説はこのアプリ独自のもので、IPA によるものではありません',
    ),
  ).toBeVisible()
})
