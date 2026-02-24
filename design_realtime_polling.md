# ミニバススタッツアプリ 複数入力者対応 設計書（Draft）

## 1. 目的

本設計は、現行アプリ（LocalStorage中心 + D1同期）を、**2〜3人の同時入力**に対応させるための設計方針を定義する。  
リアルタイム要件は厳密な双方向常時接続ではなく、**2〜3秒間隔の差分ポーリング**で満たす。

## 2. 前提とスコープ

- 対象:
  - 同一試合で2〜3端末が同時入力
  - 入力結果を数秒以内に他端末へ反映
  - Cloudflare Free枠を優先
- 非対象（本フェーズでは実施しない）:
  - WebSocket / Durable Objects
  - 複雑な競合解決（完全CRDT）
  - 権限ロール管理（記録員A/Bなど）

## 3. 現状整理（As-Is）

- クライアントは `LocalStorage` を正として操作
- APIは `players/games/game-players/logs` のCRUD
- 起動時Pull、試合終了時Pushは実装済み
- `logs` は `timestamp` 順取得のみ（差分取得は未実装）
- 画面は手動同期ボタンあり（ホーム）

課題:
- 同時入力時に反映遅延が大きい（試合終了まで他端末に見えない）
- 全件取得が増えるとD1読み取りが増加
- 重複送信時の整合性方針が明文化されていない

## 4. 目標アーキテクチャ（To-Be）

1. **入力イベント単位保存**
   - 1操作 = 1 `log` レコードを即時送信
2. **差分取得**
   - `lastFetchedAt`（または `lastSeq`）以降のみ取得
3. **ポーリング反映**
   - 記録画面で2〜3秒間隔に差分取得
4. **冪等性**
   - `log.id`（UUID）をクライアント生成し、`INSERT OR REPLACE`で重複を吸収
5. **ローカル優先**
   - 送信失敗時はローカル保持、次回リトライ

## 5. データモデル変更案

現行 `logs` テーブルに最小変更で対応する。

### 5.1 変更方針

- 既存 `id`（UUID）を冪等キーとして利用
- 差分取得キーとして `timestamp` を利用（段階1）
- 将来的に必要なら `server_created_at` 追加（段階2）

### 5.2 推奨インデックス追加

```sql
CREATE INDEX IF NOT EXISTS idx_logs_game_id_timestamp
ON logs(game_id, timestamp);
```

理由:
- `game_id` + `timestamp > ?` 条件の差分取得が高速化

## 6. API設計（差分ポーリング対応）

## 6.1 logs GET（拡張）

- エンドポイント: `GET /api/logs`
- クエリ:
  - `gameId` (required)
  - `since` (optional, ms timestamp)
  - `limit` (optional, default 500)

例:
- `GET /api/logs?gameId=xxx&since=1730000000000&limit=500`

レスポンス例:

```json
{
  "items": [
    {
      "id": "uuid",
      "gameId": "g1",
      "quarter": 1,
      "playerId": "p1",
      "action": "SHOT",
      "zoneId": 4,
      "result": "MAKE",
      "timestamp": 1730000001111
    }
  ],
  "nextSince": 1730000001111
}
```

## 6.2 logs POST（現行維持 + 運用変更）

- 1件または配列で受け付け（現行仕様を維持）
- 記録画面では基本1件ずつPOST

## 7. クライアント設計

## 7.1 Store方針

- `logs` は引き続きZustandで管理
- 追加状態:
  - `lastFetchedAtByGame: Record<string, number>`
  - `isPolling: boolean`

## 7.2 ポーリング制御

- 対象画面: `/games/:id/record`
- 起動条件:
  - オンライン
  - `gameId` が存在
  - 画面がアクティブ（`visibilityState === "visible"`）
- 間隔:
  - デフォルト `3000ms`
  - 実運用で `2000ms` まで短縮可
- 停止条件:
  - 画面離脱
  - オフライン

## 7.3 マージ規則

- 受信ログは `id` で重複排除
- 新規のみ追加、既存は上書き
- 表示順は `timestamp` 昇順

## 8. 画面変更案

## 8.1 記録画面（`GameRecordPage`）

- 同期ステータス表示（右上に小インジケータ）
  - `同期中` / `最新` / `オフライン`
- 自動反映トグル（任意）
  - ON: 2〜3秒差分取得
  - OFF: 手動更新のみ

## 8.2 ホーム画面（`HomePage`）

- 手動同期ボタンは残す（運用保険）
- 最終同期時刻を継続表示

## 9. 競合・整合性方針

- 同一イベントの二重送信:
  - `id` 同一なら冪等に吸収
- 別端末で同時に異なるイベント:
  - 両方保存（イベントログなので競合しない）
- 削除操作:
  - まず本フェーズでは「削除はローカル起点 + API反映」
  - 高頻度競合は将来フェーズで tombstone 検討

## 10. パフォーマンスとコスト目安

前提（上限寄り）:
- 1日4試合、1試合700イベント、3端末、3秒ポーリング

概算:
- 書き込み: 約2,800 rows/day
- Workers req: 数万/day 規模
- D1 rows read: 差分取得なら 5M/day 未満に収まりやすい

評価:
- Cloudflare Free枠内で運用可能性が高い

## 11. 実装ステップ（段階導入）

### Phase 1（最小実装）
- `GET /logs` に `since` / `limit` 対応
- `idx_logs_game_id_timestamp` 追加
- 記録画面に3秒ポーリング導入
- 受信差分のマージ実装

### Phase 2（運用改善）
- バックオフ（失敗時 3s→6s→12s）
- 可視化（同期遅延表示）
- 低電力モード時ポーリング間隔拡張

### Phase 3（必要時）
- SSE / Durable Objects検討

## 12. 受け入れ条件（Acceptance Criteria）

- 2端末で同一試合を開いたとき、片方入力がもう片方へ**3秒以内**に反映
- 10分連続入力でエラー率が許容範囲（例: <1%）
- オフライン→オンライン復帰後に欠損なく追いつく
- ローカルデータが空クラウドで上書きされない

## 13. リスクと対策

- リスク: ポーリング過多による無駄なread
  - 対策: 差分取得 + インデックス + limit
- リスク: 端末時刻ズレ
  - 対策: 将来 `server_created_at` 導入
- リスク: 長時間試合でログ増大
  - 対策: ページング取得（limit）と集計キャッシュ

## 14. 補足（今回の実装判断ポイント）

この設計は「小規模チーム運用」と「無料枠優先」に最適化している。  
最初に Phase 1 を実装して実測（req/day, rows/day,遅延）を取り、必要があれば段階的に Phase 2/3 へ進める。
