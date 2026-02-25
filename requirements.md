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
type Action = 'SHOT' | 'FT' | 'REB' | 'FOUL' | 'AST';
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
  zoneId: number | null; // 1-9 (FT/ASTの場合はnull)
  result: Result;
  timestamp: number;   // 入力時のシステム日時
  synced?: boolean;    // ローカル管理用フラグ

  // AST専用フィールド
  passerPlayerId?: string;   // アシストした選手
  scorerPlayerId?: string;   // 得点した選手
  linkedShotLogId?: string;  // 紐付くシュート成功ログID
}
```

## 9分割コート（ゾーンマップ）

操作しやすさを優先し、3PTライン付近までを主対象として9ゾーンで記録する。  
見た目はJBA/FIBAハーフコートに近いコート線を表示しつつ、入力はリング（距離）ベースで分割する。

```
  Ring 1（最短距離）: [1]
  Ring 2（ペイント周辺）: [2][3][4]
  Ring 3（ミドル〜3PT付近）: [5][6][7][8][9]
```

※ 画面上の表示ラベルは数字（1〜9）のみとする。

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
* 「次Qへ」ボタン（出場選手選択モーダル `QuarterModal` が開く）
* スコア表示（自チーム得点は自動計算、相手は手動+1/-1ボタン）
* ステップインジケーター（ゾーン→アクション→選手）
* リセット / Undo / スタッツ / 試合終了 ボタン

## コア機能・ロジック

### 入力フロー
「コートのゾーン(zoneId)をタップ」→「アクション・結果(action/result)をタップ」→「選手(playerId)をタップ」の順で一時状態を保持し、3要素が揃った時点でlogs配列に保存する。
FT（フリースロー）の場合はゾーン選択をスキップ（zoneId = null）。

入力順序の制御:
* ステップ外のUIは操作不可（非活性表示）
* 1つ前のステップを完了しない限り次ステップへ進めない

### アシスト入力（AssistModal）
シュート成功（SHOT MAKE）直後に `AssistModal` を自動表示:
* 得点者以外のアクティブ選手一覧からパサーを選択
* 「アシストなし」ボタンでスキップ可能（任意入力）
* 選択されたアシストは `AST` ログとして保存（`linkedShotLogId` で成功シュートと紐付け）

### Undo機能
直前の入力を1つ取り消す（pop）ボタンを常時表示。
シュート成功（SHOT MAKE）を取り消した場合、紐付くアシストログも自動的に削除される。

### クォーター管理（QuarterModal）
* 各クォーターの出場選手5名を `GamePlayer` テーブルで管理
* 「次Qへ」ボタンを押すと、次のクォーターの出場選手を選択するモーダルが表示される
* 選手未設定のクォーターに移動した場合も自動的にモーダルを表示
* 選手未設定時は画面上部に警告バーを表示

### 試合終了フロー
「試合終了」ボタン（確認ダイアログ付き）押下時に、まずクラウド同期（Push）を実行し、その後に試合詳細画面（`/games/:id`）へ遷移する。

### スタッツ集計ビュー（StatsModal）
logs配列から以下を計算して表示するモーダル:
* チーム合計得点
* 選手ごとのシュート成功率（FG%）
* 選手ごとのFT成功率（FT%）
* 選手ごとのリバウンド数（ORB / DRB）
* 選手ごとのアシスト数（AST）
* 選手ごとのファウル数

### 試合詳細画面（分析タブ）
試合詳細画面では、選手プルダウン（チーム全体 / 個別選手）と分析タブを表示:
* **FG%ヒートマップ**: コートSVG上にゾーン別シュート成功率を表示（色: 高確率=緑 / 中間=黄 / 低確率=赤 / 試投なし=灰）
* **REBヒートマップ**: コートSVG上にゾーン別リバウンド分布を表示（色: 青の濃淡、ORB/DRB内訳付き）
* **スタッツ一覧**: 選手別・チーム合計のスタッツ表

### CSVエクスポート
試合詳細画面およびスタッツモーダルから、選手別スタッツをCSV形式でダウンロード可能。BOM付きUTF-8で出力。

## オフライン同期戦略

1. 全ての書き込みはまずLocalStorageに保存（即座にUIに反映）
2. アプリ起動時（オンライン時）にWorkers API経由でD1からPullし、最新データを反映
3. 「試合終了」ボタン押下時、またはホーム画面からWorkers API経由でD1へPush
4. D1側では `INSERT OR REPLACE` を使用し、UUIDベースで重複を排除（冪等性を担保）
5. 同期状態をUI上にインジケーターで表示（最終同期日時）
6. 安全策として「クラウドが空でローカルにデータあり」の場合はローカルを上書きしない

## 今後の拡張方針（リアルタイム対応）

複数入力者による同時記録をサポートするため、以下の拡張を予定している（設計済）:

* **差分ポーリング**: 2〜3秒間隔で `since` パラメータを用いた差分取得を行い、他端末の入力をリアルタイムに反映する。
* **イベントストリーム**: 1操作ごとに1レコードをAPI送信し、常に最新の状態をクラウドと同期する。
* **サーバーサイドタイムスタンプ**: 端末間の時刻ズレを許容するため、サーバー側での作成日時保持を検討。

## アクション種別の設計方針

* **SHOT**: ゾーン選択必須。MAKE/MISSを選択。
* **FT**: ゾーン選択スキップ（null）。MAKE/MISSを選択。
* **REB**: ゾーン選択必須。OFF/DEFを選択。
* **FOUL**: ゾーン選択スキップ（null）。PF（パーソナルファウル）等を記録。
* **AST**: シュート成功に紐づくオプション入力。パサーとスコアラーの関係を記録。
* ターンオーバー・スティール・ブロックは、1名での操作負荷を考慮し意図的に省略。
* 相手チームのスタッツは記録しない（スコアのみ手動入力）。
