import { expect, test, type Page } from '@playwright/test'
import { answerCurrent } from './helpers'

type Rgb = [number, number, number]

// "rgb(1, 2, 3)" や "rgba(1, 2, 3, 0.5)"、"rgb(1 2 3 / 50%)" から、赤・緑・青を取り出す
const parse = (css: string): Rgb => {
  const numbers = css.match(/[\d.]+/g)
  if (!numbers || numbers.length < 3)
    throw new Error(`色を読み取れません: ${css}`)
  return [Number(numbers[0]), Number(numbers[1]), Number(numbers[2])]
}

const luminance = ([r, g, b]: Rgb) => {
  const channel = (v: number) => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

// WCAG のコントラスト比（4.5 以上が、通常の文字の基準）
const contrast = (a: Rgb, b: Rgb) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

const colors = (page: Page, selector: string) =>
  page
    .locator(selector)
    .first()
    .evaluate((el) => {
      const style = getComputedStyle(el)
      return {
        color: style.color,
        background: style.backgroundColor,
        radius: style.borderRadius,
        width: el.getBoundingClientRect().width,
      }
    })

const bodyBackground = (page: Page) =>
  page.evaluate(() => getComputedStyle(document.body).backgroundColor)

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`見た目（${scheme === 'light' ? '明るい画面' : '暗い画面'}）`, () => {
    test.use({ colorScheme: scheme })

    test('分野のラベルは分野ごとに違う色で、文字との明るさの差が基準以上ある', async ({
      page,
    }) => {
      const backgrounds: string[] = []
      for (const label of ['ストラテジ', 'マネジメント', 'テクノロジ']) {
        await page.goto('./')
        await page.getByRole('button', { name: `${label}で練習` }).click()

        const style = await colors(page, '.field-label')
        backgrounds.push(style.background)
        expect(
          contrast(parse(style.color), parse(style.background)),
          label,
        ).toBeGreaterThanOrEqual(4.5)
      }

      expect(new Set(backgrounds).size).toBe(3)
    })

    test('選択肢の記号のバッジは丸く、文字との明るさの差が基準以上ある', async ({
      page,
    }) => {
      await page.goto('./')
      await page.getByRole('button', { name: '一問一答を始める' }).click()

      const badge = await colors(page, '.choice .badge')

      expect(badge.width).toBeGreaterThanOrEqual(24)
      expect(
        contrast(parse(badge.color), parse(badge.background)),
      ).toBeGreaterThanOrEqual(4.5)
      // 丸（角丸が幅の半分以上）
      const radius = badge.radius.endsWith('%')
        ? parseFloat(badge.radius) * (badge.width / 100)
        : parseFloat(badge.radius)
      expect(radius).toBeGreaterThanOrEqual(badge.width / 2 - 0.5)
    })

    test('問題のカードと解説のカードは、ページの背景とも互いにも違う色である', async ({
      page,
    }) => {
      await page.goto('./')
      await page.getByRole('button', { name: '一問一答を始める' }).click()
      await answerCurrent(page, true)

      const question = await colors(page, '[data-card="question"]')
      const explanation = await colors(page, '[data-card="explanation"]')
      const page_ = await bodyBackground(page)

      expect(question.background).not.toBe(page_)
      expect(explanation.background).not.toBe(page_)
      expect(explanation.background).not.toBe(question.background)
      for (const card of [question, explanation]) {
        expect(
          contrast(parse(card.color), parse(card.background)),
        ).toBeGreaterThanOrEqual(4.5)
      }
    })

    test('正解は緑系、不正解は赤系の背景で、文字との明るさの差が基準以上ある', async ({
      page,
    }) => {
      await page.goto('./')
      await page.getByRole('button', { name: '一問一答を始める' }).click()
      await answerCurrent(page, false)

      const correct = await colors(page, '.choice[data-state="correct"]')
      const wrong = await colors(page, '.choice[data-state="wrong"]')
      const [cr, cg, cb] = parse(correct.background)
      const [wr, wg, wb] = parse(wrong.background)

      expect(cg).toBeGreaterThan(cr)
      expect(cg).toBeGreaterThan(cb)
      expect(wr).toBeGreaterThan(wg)
      expect(wr).toBeGreaterThan(wb)
      for (const style of [correct, wrong]) {
        expect(
          contrast(parse(style.color), parse(style.background)),
        ).toBeGreaterThanOrEqual(4.5)
      }
    })

    test('見た目を付けても、横スクロールが出ず、選択肢の高さは44px以上ある', async ({
      page,
    }) => {
      await page.goto('./')
      await page.getByRole('button', { name: '一問一答を始める' }).click()
      await answerCurrent(page, false)

      const heights = await page
        .locator('.choice')
        .evaluateAll((els) =>
          els.map((el) => el.getBoundingClientRect().height),
        )
      const scrolls = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth,
      )

      for (const height of heights) expect(height).toBeGreaterThanOrEqual(44)
      expect(scrolls).toBe(false)
    })
  })
}
