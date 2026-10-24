# 開発手順

## 前提

- Node.js 22（`.nvmrc` 参照）

```bash
npm install
npx playwright install webkit chromium  # E2E 用ブラウザ（初回のみ）
```

## 1 機能の開発の流れ

```
Issue 作成 → ブランチ作成 → (Red → Green → Refactor) × 受け入れ条件の数 → npm run check → PR → CI → レビュー → マージ → 自動デプロイ
```

### 1. Issue を作る

「機能要望」テンプレートで Issue を作る。**受け入れ条件はそのままテスト名になる** ように「〜すると〜になる」の形で書く。

例:

> ユーザーストーリー: 受験者として、模擬試験の結果から合否を知りたい。
>
> 受け入れ条件
>
> - 総合600点以上かつ各分野300点以上なら合格になる
> - 1分野でも300点未満なら不合格になる

### 2. ブランチを切る

```bash
git switch main && git pull
git switch -c feature/12-exam-judgement
```

### 3. TDD サイクルを回す

`npm run test:watch` を起動したまま進める。

| 段階     | やること                                         | 終了条件                     |
| -------- | ------------------------------------------------ | ---------------------------- |
| Red      | 受け入れ条件 1 つをテストとして書く              | テストが想定どおりに失敗する |
| Green    | テストを通す最小限のコードを書く                 | すべてのテストが通る         |
| Refactor | 重複・命名・構造を整理する（振る舞いは変えない） | すべてのテストが通ったまま   |

どの層のテストを書くかの目安:

| 層   | 対象                               | ツール                       | 置き場所               |
| ---- | ---------------------------------- | ---------------------------- | ---------------------- |
| 単体 | 採点・出題・合否判定などのロジック | Vitest                       | `src/domain/*.test.ts` |
| 結合 | コンポーネントの表示と操作         | Vitest + Testing Library     | `src/**/*.test.tsx`    |
| E2E  | 画面遷移・iPhone での表示          | Playwright（iPhone 15 相当） | `e2e/*.spec.ts`        |

ロジックはできるだけ UI から切り離して `src/domain/` に置き、単体テストで厚く確認する。E2E は主要な操作の流れに絞る。

### 4. コミット前チェック

```bash
npm run check      # lint / format / 型チェック / 単体・結合テスト（カバレッジ80%以上）
npm run test:e2e   # E2E
```

### 5. PR を出す

PR テンプレートに沿って、受け入れ条件と追加したテストの対応を書く。CI がすべて通ったらレビューしてマージする。

## CI / デプロイ

| ワークフロー                   | タイミング         | 内容                                                           |
| ------------------------------ | ------------------ | -------------------------------------------------------------- |
| `.github/workflows/ci.yml`     | PR・`main` へ push | lint、format、型チェック、カバレッジ、E2E（WebKit / Chromium） |
| `.github/workflows/deploy.yml` | `main` へ push     | テスト → ビルド → GitHub Pages へ公開                          |

公開 URL: `https://inz125.github.io/ITpassportApp/`

> 初回のみ、GitHub のリポジトリ設定 **Settings → Pages → Build and deployment → Source** を「GitHub Actions」にする必要がある。

## iPhone での確認

- 公開 URL を Safari で開き、共有メニューの「ホーム画面に追加」でアプリのように使える。
- 開発中に実機で確認したい場合は `npm run dev -- --host` で起動し、同じ Wi-Fi の iPhone から `http://<PCのIP>:5173/ITpassportApp/` を開く。
