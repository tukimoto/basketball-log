# ミニバススタッツアプリ イベント拡張設計書（Draft）

## 1. 目的

現行の基本イベント（SHOT/FT/FOUL中心）に対して、以下を拡張する。

- リバウンド: **ORB/DRB + 取得ゾーン**
- アシスト: **誰から誰へ（passer -> scorer）**
- 将来的な複数入力者運用時にも整合性を保てるイベント構造

本書は「イベント仕様/UI/API」を定義する。  
同期方式（2〜3秒差分ポーリング）は `design_realtime_polling.md` を前提とする。

## 2. スコープ

### 2.1 対象
- イベント入力UIの拡張
- データモデル拡張（Log中心）
- APIの受け渡し拡張
- 試合後スタッツ表示（選手別、ゾーン別）の拡張

### 2.2 非対象（この設計では扱わない）
- WebSocket化
- 詳細な認可（役割ベース権限）
- 映像連携

## 3. 要件（イベント別）

## 3.1 リバウンド
- ORB / DRB を記録できること
- **どのゾーン（1〜9）で取得したか**を記録できること
- 必須項目:
  - quarter
  - playerId（取得者）
  - reboundType（OFF/DEF）
  - zoneId（1〜9）
  - timestamp

## 3.2 アシスト
- シュート成功に紐づくアシストを記録できること
- **誰から誰へ**を記録できること
- 必須項目:
  - quarter
  - passerPlayerId（アシストした選手）
  - scorerPlayerId（得点した選手）
  - linkedShotLogId（成功シュートログID）
  - timestamp
- 制約:
  - passerPlayerId と scorerPlayerId は同一不可
  - scorerは成功シュートの playerId と一致必須

## 4. データモデル拡張案

現行 `logs` を中心に、段階的拡張する。

## 4.1 方式A（推奨）: logs単一テーブル拡張

```typescript
type Action = "SHOT" | "FT" | "REB" | "FOUL" | "AST";

interface Log {
  id: string;
  gameId: string;
  quarter: 1 | 2 | 3 | 4 | 5;

  // 共通
  action: Action;
  timestamp: number;

  // SHOT/FT/REB/FOUL の基本
  playerId?: string;          // SHOT/FT/REB/FOULの主対象
  zoneId?: number | null;     // SHOT/REBで利用, FTはnull
  result?: string;            // MAKE/MISS/OFF/DEF/PF...

  // AST専用
  passerPlayerId?: string;
  scorerPlayerId?: string;
  linkedShotLogId?: string;
}
```

利点:
- 差分同期がシンプル（単一ストリーム）
- 時系列再生が容易

注意:
- action別バリデーションを厳密化する必要あり

## 4.2 方式B: assistsを別テーブル

- `logs` は現行維持
- `assists` テーブル新設

利点:
- スキーマが明確
欠点:
- 同期・結合が複雑化

本プロジェクトではまず **方式A** を採用する。

## 5. DB変更案（方式A）

## 5.1 logsカラム追加

```sql
ALTER TABLE logs ADD COLUMN passer_player_id TEXT;
ALTER TABLE logs ADD COLUMN scorer_player_id TEXT;
ALTER TABLE logs ADD COLUMN linked_shot_log_id TEXT;
```

## 5.2 インデックス

```sql
CREATE INDEX IF NOT EXISTS idx_logs_game_id_action ON logs(game_id, action);
CREATE INDEX IF NOT EXISTS idx_logs_linked_shot ON logs(linked_shot_log_id);
```

## 6. 入力UI設計

## 6.1 リバウンド入力フロー

候補フロー（推奨）:
1. ゾーン選択（1〜9）
2. アクション選択（ORB / DRB）
3. 選手選択（取得者）
4. 保存

補足:
- シュート失敗直後のショートカットとして「リバウンド入力へ」ボタンを任意追加可能
- ただし強制遷移はしない（運用に合わせる）

## 6.2 アシスト入力フロー

候補フロー（推奨）:
1. 成功シュート保存後、トーストで「アシストを記録しますか？」表示
2. 記録する場合:
   - passer（出し手）選択
   - scorer（受け手: 直前シュート成功者で固定または確認）
3. ASTログ保存（linkedShotLogId付き）

UI簡略案:
- 「アシストなし」ボタンですぐ閉じる

## 6.3 ヘッダー/サイドUI
- ActionPanelに `ORB`, `DRB`, `AST` を追加
- ASTは単独ボタンで、押下後に専用モーダルを開く方式

## 7. API設計拡張

## 7.1 POST /api/logs
- 既存維持（単体/配列）
- `action` に応じて必須チェック追加

バリデーション例:
- `action = "REB"` -> `playerId`, `zoneId`, `result in ("OFF","DEF")` 必須
- `action = "AST"` -> `passerPlayerId`, `scorerPlayerId`, `linkedShotLogId` 必須

## 7.2 GET /api/logs
- 既存拡張（`since`, `limit`）を前提
- AST含めて同じ時系列で返却

## 8. 集計・表示拡張

## 8.1 選手別
- ORB / DRB / REB合計
- AST数
- FG%、FT%

## 8.2 ゾーン別
- SHOTのみ: zone別 FG%
- REBのみ: zone別 REB回数（OFF/DEF内訳）

## 8.3 画面表示
- 試合詳細画面:
  - 既存ヒートマップ（FG%）に加えて
  - `ゾーン別リバウンド分布` タブを追加可能
- 選手選択時:
  - FGヒートマップ + REB分布 + AST件数

## 9. 整合性ルール

- 同一ログ重複防止: `id` UUIDで冪等
- AST整合:
  - `linkedShotLogId` が存在すること
  - 対応SHOTが `MAKE` であること
  - `scorerPlayerId === linkedShot.playerId`
- 同時入力時:
  - 最終表示は timestamp順
  - 衝突時はID単位で重複排除

## 10. 実装ステップ（推奨）

### Phase 1（REB拡張）
- ActionPanelに ORB/DRB追加
- REBに zoneId 必須化
- 集計（選手別REB, zone別REB）追加

### Phase 2（AST拡張）
- AST入力モーダル追加
- linkedShotLogId連携
- 選手別AST表示追加

### Phase 3（画面強化）
- 試合詳細画面にタブ式分析
  - FGヒートマップ
  - REB分布
  - AST関係（誰→誰）

## 11. 受け入れ条件

- REB入力で zoneId が必ず保存される
- AST入力で passer/scorer が保存される
- 試合詳細で選手ごとの FG% / REB / AST が確認できる
- 差分同期時にイベント欠損・重複登録が発生しない

## 12. 判断ポイント（実装前に確定すべきこと）

1. REB入力は「常時手動」か「シュートMISS後ショートカット」も併用するか
2. ASTは「必須入力」か「任意入力」か
3. AST入力UIは「直後ポップアップ」か「後から編集」か
4. 詳細画面は「1ページ縦積み」か「タブUI」か
