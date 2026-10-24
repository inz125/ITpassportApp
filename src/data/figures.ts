// 過去問の図は src/data/figures/<回>/<ファイル名> に置く。
// Vite が配信用の URL（ベースパスやハッシュ付き）に変換するので、そのまま img の src に使える
export const createFigureResolver =
  (urls: Readonly<Record<string, string>>) =>
  (name: string): string => {
    const url = urls[`./figures/${name}`]
    if (!url) throw new Error(`図が見つかりません: ${name}`)
    return url
  }

// 型引数つきの import.meta.glob<string>(...) は変換されず空になるため、型は as で付ける
export const figureUrl = createFigureResolver(
  import.meta.glob('./figures/*/*.png', {
    eager: true,
    query: '?url',
    import: 'default',
  }) as Record<string, string>,
)
