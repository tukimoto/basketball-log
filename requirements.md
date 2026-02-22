# ミニバスケットボール用スタッツ記録PWA 設計要件

## プロジェクト概要
ミニバスケットボール用のスタッツ記録PWA（プログレッシブWebアプリ）をReactで開発する。
1名の記録員がiPad（メイン）またはスマートフォン（サブ）で試合を見ながら、リアルタイムに自チームのスタッツを入力・オフライン保存できることが目標。

## 技術スタック
* フロントエンド: React (Vite) + TypeScript
* スタイリング: Tailwind CSS v4
* 状態管理: Zustand
* 永続化: LocalStorage（オフラインキャッシュ） + Cloudflare D1（クラウドDB）
* アイコン: Lucide React
* PWA: vite-plugin-pwa (Workbox)

## インフラ構成
* ホスティング: Cloudflare Pages（静的SPA配信）
* API: Cloudflare Pages Functions（`functions/` ディレクトリ）
* データベース: Cloudflare D1（SQLite）
* 認証: シンプルなAPIキー方式（環境変数 `API_KEY`）

## データモデル定義

```typescript
type Action = 'SHOT' | 'FT' | 'REB' | 'FOUL';
type ShotResult = 'MAKE' | 'MISS';
type ReboundResult = 'OFF' | 'DEF';
type Result = ShotResult | ReboundResult | string; // ファウル種別含む

type Quarter = 1 | 2 | 3 | 4 | 5; // 5は延長

interface Game {
  id: string;          // UUID
  opponentName: string;
  gameDate: string;    // ISO 8601 日付
  opponentScore: number;
  createdAt: number;
}

interface Player {
  id: string;          // UUID
  number: number;      // 背番号
  name: string;
  createdAt: number;
}

interface GamePlayer {
  gameId: string;
  playerId: string;
  isActiveQ1: boolean; // 各クォーターの出場フラグ
  isActiveQ2: boolean;
  isActiveQ3: boolean;
  isActiveQ4: boolean;
  isActiveQ5: boolean;
}

interface Log {
  id: string;          // UUID
  gameId: string;
  quarter: Quarter;
  playerId: string;
  action: Action;
  zoneId: number | null; // 1-9 (FTの場合はnull)
  result: Result;
  timestamp: number;   // 入力時のシステム日時
}
```

## 9分割ハーフコート（ゾーンマップ）

JBA規格のハーフコートを3行×3列の9ゾーンに分割。シュート位置の大まかな把握が目的。

```
  [1: ペイント左]  [2: ゴール下]  [3: ペイント右]   ← ゴール側
  [4: ミドル左]    [5: ミドル正面] [6: ミドル右]     ← ミドルレンジ
  [7: 外側左]      [8: 外側正面]   [9: 外側右]       ← 3Pライン付近
```

コートはSVGで描画し、ペイントエリア・FTサークル・3Pアーク等のコートラインを上にオーバーレイ表示する。

## 画面構成とルーティング

| パス | 画面名 | 概要 |
|------|--------|------|
| `/` | 試合一覧 | 過去の試合リスト、新規作成、クラウド同期ボタン |
| `/settings` | 選手管理 | チームロスターのCRUD（背番号・名前） |
| `/games/new` | 試合セットアップ | 対戦相手名・日付入力、ベンチ入り＆先発5名選択 |
| `/games/:id/record` | 試合記録（メイン） | 1画面完結のスタッツ入力SPA |
| `/games/:id` | 試合詳細 | スタッツサマリー表示、CSVエクスポート |

## UI/UX設計（レスポンシブ要件）

### iPad用レイアウト (横画面/md以上)
3ペイン構成:
* 左 (20%): 出場中選手（5名）のボタングループ
* 中央 (50%): 9分割ハーフコート（タップでzoneIdを取得するUI領域）
* 右 (30%): アクション＆結果ボタングループ

### スマートフォン用レイアウト (縦画面/md未満)
縦積み構成 (スクロールなしで1画面に収める):
* 上部 (40%): 9分割ハーフコート
* 中部 (30%): アクション＆結果ボタン
* 下部 (30%): 出場中選手（5名）のボタングループ

### ヘッダー（共通）
* 戻るボタン（←）
* クォーター切り替えトグル（1Q〜4Q, OT）
* 「次Qへ」ボタン（出場選手選択モーダルが開く）
* スコア表示（自チーム得点は自動計算、相手は手動+1/-1ボタン）
* ステップインジケーター（ゾーン→アクション→選手）
* リセット / Undo / スタッツ / 試合終了 ボタン

## コア機能・ロジック

### 入力フロー
「コートのゾーン(zoneId)をタップ」→「アクション・結果(action/result)をタップ」→「選手(playerId)をタップ」の順で一時状態を保持し、3要素が揃った時点でlogs配列に保存する。
FT（フリースロー）の場合はゾーン選択をスキップ（zoneId = null）。

### Undo機能
直前の入力を1つ取り消す（pop）ボタンを常時表示。

### クォーター管理
* 各クォーターの出場選手5名をGamePlayerテーブルで管理
* 「次Qへ」ボタンを押すと、次のクォーターの出場選手を選択するモーダルが表示される
* 選手未設定のクォーターに移動した場合も自動的にモーダルを表示
* 選手未設定時は画面上部に警告バーを表示

### 試合終了フロー
「試合終了」ボタン（確認ダイアログ付き） → 試合詳細画面（`/games/:id`）に遷移し、スタッツサマリーとCSVエクスポートを表示。

### スタッツ集計ビュー
logs配列から以下を計算して表示するモーダル:
* チーム合計得点
* 選手ごとのシュート成功率（FG%）
* 選手ごとのFT成功率（FT%）
* 選手ごとのリバウンド数（ORB / DRB）
* 選手ごとのファウル数

### CSVエクスポート
試合詳細画面およびスタッツモーダルから、選手別スタッツをCSV形式でダウンロード可能。BOM付きUTF-8で出力。

## オフライン同期戦略

1. 全ての書き込みはまずLocalStorageに保存（即座にUIに反映）
2. オンライン時、ホーム画面の同期ボタンからWorkers API経由でD1へPush
3. 同様にD1からPullして最新データをLocalStorageに反映
4. 同期状態をUI上にインジケーターで表示（最終同期日時）

## アクション種別の設計方針

* SHOT（シュート）、FT（フリースロー）、REB（リバウンド）、FOUL（ファウル）の4種に限定
* ターンオーバー・スティール・アシスト・ブロックは、1名での操作におけるデータ整合性を考慮し意図的に省略
* 相手チームのスタッツは記録しない（スコアのみ手動入力）
