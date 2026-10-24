# CLAUDE.md

ITパスポート試験の学習を支援する iPhone 向け Web アプリ。開発は TDD を基本とする。
詳しい手順は [docs/development.md](docs/development.md) を参照。

## 技術スタック

- React + TypeScript + Vite
- 単体・結合テスト: Vitest + Testing Library（jsdom）
- E2E: Playwright（iPhone 15 相当。CI は WebKit、ローカルは WebKit がなければ Chromium）
- Lint: oxlint / Format: Prettier
- デプロイ: GitHub Pages（`main` へのマージで自動公開。ベースパスは `/ITpassportApp/`）

## TDD のルール（必ず守る）

Claude が Red → Green → Refactor の全サイクルを実行し、ユーザーはレビューを担当する。

1. **要件を確認する**: GitHub Issue の受け入れ条件を読む。曖昧な点は実装前にユーザーへ質問する。
2. **Red**: 受け入れ条件をテストに書き、実行して **失敗することを確認する**。失敗理由が想定どおりか（未実装・期待値不一致）も確かめる。
3. **Green**: テストを通す最小限の実装をする。テストにない機能を先回りして作らない。
4. **Refactor**: テストが通った状態を保ったまま重複や命名を整理する。
5. 1 サイクルが終わるたびにテストを実行し、全テストが通ってから次の受け入れ条件へ進む。
6. テストを消す・`skip` する・期待値を実装に合わせて書き換えることで Green にしてはいけない。仕様が変わる場合はユーザーに確認する。
7. 不具合修正は、まず不具合を再現するテストを書いてから直す。

## テストの書き方

- テスト名（`describe` / `it` / `test`）は **日本語** で、仕様として読める文にする（例: `it('正解を選ぶと正解数が1増える')`）。
- 受け入れ条件 1 つにつき、テスト 1 つ以上を対応させる。
- 配置:
  - ロジック: `src/domain/*.ts` と同じ場所に `*.test.ts`（UI に依存しない純粋関数として書く）
  - コンポーネント: `src/**/*.tsx` と同じ場所に `*.test.tsx`。要素は `getByRole` など利用者視点のクエリで取得する
  - E2E: `e2e/*.spec.ts`。画面をまたぐ操作や iPhone 表示の確認に使う
- カバレッジ閾値は 80%（`npm run test:coverage` で検証される）。

## コマンド

```bash
npm run dev            # 開発サーバー（http://localhost:5173/ITpassportApp/）
npm run test:watch     # TDD 中はこれを起動しておく
npm test               # 単体・結合テスト
npm run test:coverage  # カバレッジ付き
npm run test:e2e       # E2E（全プロジェクト）
npx playwright test --project=iphone-chromium  # WebKit がない環境での E2E
npm run check          # lint + format + 型チェック + カバレッジ（コミット前に必ず実行）
npm run format         # 自動整形
```

## ブランチ・コミット・PR

- `main` は常にテストが通る状態に保つ。直接コミットしない。
- 1 Issue = 1 ブランチ = 1 PR。ブランチ名は `feature/<issue番号>-<概要>`、`fix/<issue番号>-<概要>`。
- コミットメッセージは日本語。Green / Refactor の区切りでコミットする（Red の状態ではコミットしない）。
- PR は `.github/pull_request_template.md` に沿って書き、`closes #<番号>` で Issue と紐付ける。
- CI（lint・型チェック・テスト・E2E）が通ってからユーザーがレビューしてマージする。

## コーディング規約

- コード中の識別子は英語、コメント・ドキュメントは日本語。
- 学習データ（解答履歴など）は端末内（localStorage / IndexedDB）に保存する前提。サーバーは持たない。
- iPhone の Safari で使う前提で、タップ領域・セーフエリア・横スクロールが出ないことに気を配る。
