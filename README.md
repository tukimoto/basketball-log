# Basketball Log (ミニバススタッツ記録PWA)

ミニバスケットボールの試合スタッツをリアルタイムに記録・分析するためのプログレッシブWebアプリ（PWA）です。
1名の記録員がiPadやスマートフォンを使用して、自チームのスタッツを直感的に入力し、オフライン環境でも利用できることを目指しています。

## 🚀 主な機能

- **リアルタイム記録**: 9分割されたコートマップをタップして、シュート、リバウンド、ファウル、アシストを素早く記録。
- **オフライン対応**: LocalStorageを活用したオフライン保存と、オンライン復帰時のクラウド（Cloudflare D1）同期。
- **スタッツ分析**:
  - 選手別・チーム合計のスタッツサマリー。
  - **FG%ヒートマップ**: どのゾーンからシュートが決まっているかを可視化。
  - **リバウンド分布**: ゾーンごとのリバウンド取得状況を可視化。
- **クォーター管理**: 各クォーターの出場選手（5名）を管理し、スタッツ計算に反映。
- **データ出力**: 記録したスタッツをCSV形式でエクスポート可能。

## 🛠 技術スタック

- **フロントエンド**: React 19 (Vite) + TypeScript
- **スタイリング**: Tailwind CSS v4
- **状態管理**: Zustand
- **バックエンド**: Cloudflare Pages Functions (Node.js/TypeScript)
- **データベース**: Cloudflare D1 (SQLite)
- **アイコン**: Lucide React
- **PWA**: vite-plugin-pwa (Workbox)
- **デプロイ**: Cloudflare Pages

## 📂 プロジェクト構成

```text
.
├── db/                # D1 データベーススキーマとマイグレーション
├── functions/api/     # Cloudflare Pages Functions (APIエンドポイント)
├── public/            # 静的アセット、PWAアイコン
└── src/
    ├── api/           # APIクライアント
    ├── components/    # 再利用可能なUIコンポーネント (Court, Game, Stats等)
    ├── hooks/         # カスタムフック (同期ロジック等)
    ├── lib/           # ユーティリティ関数、スタッツ計算ロジック
    ├── pages/         # 各画面コンポーネント
    ├── stores/        # Zustand ストア
    └── types/         # TypeScript 型定義
```

## 💻 開発手順

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 開発サーバーの起動

```bash
npm run dev
```

### 3. データベースのセットアップ (Wrangler)

ローカル環境で D1 を使用する場合は以下のコマンドを実行します。

```bash
npx wrangler d1 execute basketball-db --local --file=./db/schema.sql
```

## 🚀 デプロイ

Cloudflare Pages にデプロイします。

```bash
npm run deploy
```

## 📝 記録可能なアクション

- **SHOT**: シュート（成功/失敗）とゾーン選択
- **FT**: フリースロー（成功/失敗）
- **REB**: リバウンド（オフェンス/ディフェンス）とゾーン選択
- **AST**: アシスト（誰から誰へのパスか）
- **FOUL**: パーソナルファウル等

## 📋 ライセンス

MIT License
