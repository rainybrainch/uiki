# Uwiki — Claude Code Handoff Notes

> 雨域 (Uwiki) — Notionを開かないNotionダッシュボード。
> あなたが引き継いだ時点の状態を、このファイルに集約しています。

## 一行で

Claude に話しかける → 構造化JSONを抽出 → localStorage + (任意で) Supabase + (任意で) Notion に蓄積される個人ダッシュボード。3つのHTMLページ(玄関 / 重力雨域 / 引力雨域)で構成。

## 技術スタック (ビルドステップなし)

- **React 18 + Babel standalone** (CDN ロード、no build)
- **Supabase JS SDK** (UMD, CDN)
- **Cloudflare Pages** ホスティング想定
- **Cloudflare Workers** (Notion proxy, `worker/`)
- Pure JSX + plain CSS + fonts from Google Fonts

ローカル起動:
```bash
python3 -m http.server 8080
open http://localhost:8080
```

## ファイル構成

```
Uwiki/
├── index.html              玄関 (lobby)
├── Gravity.html            重力雨域 (内側・夢・ロードマップ)
├── Attraction.html         引力雨域 (外側・客観・自撮り) 🔒
│
├── lobby.jsx + lobby.css           玄関の実装
├── gravity.jsx + gravity.css       重力雨域の実装(今日の振り返り含む)
├── attraction.jsx + attraction.css 引力雨域の実装(自撮りアップロード含む)
├── auth.jsx + auth.css             Supabase 認証 (AuthSheet, AuthPill, useSession)
├── claude-shared.jsx + .css        Claude統合 + Notion proxy + cloud sync
│
├── config.js               Supabase URL/Key 設定 (空ならローカルのみ)
├── config.example.js       config.js の雛形
├── manifest.json           PWA マニフェスト
├── sw.js                   Service Worker (オフライン対応)
│
├── README.md               GitHub フロントページ
├── DEPLOY.md               デプロイ手順 (Cloudflare Pages, Supabase, Worker, PWA)
├── LICENSE                 MIT
├── .gitignore
│
└── worker/                 Notion API プロキシ (Cloudflare Worker)
    ├── index.js            Worker 実装
    ├── wrangler.toml       デプロイ設定
    └── README.md           デプロイ手順
```

## 重要な実装パターン

### スクリプトのロード順序

各HTMLは厳密に以下の順で読み込みます:
1. `config.js` (同期, `window.UWIKI_CONFIG` を設定)
2. React + ReactDOM + Babel (UMD CDN)
3. Supabase UMD (CDN)
4. `claude-shared.jsx` (window に exports)
5. `auth.jsx` (window に exports、claude-shared を読む)
6. ページ固有 jsx (`lobby.jsx` / `gravity.jsx` / `attraction.jsx`)
7. SW 登録 (inline)

### モジュール間の共有

各 `<script type="text/babel">` は独立スコープなので、共有したい関数は **`Object.assign(window, { ... })`** で window に明示的に exposes します。

`claude-shared.jsx` → window: `ClaudeChat, ClaudeFAB, NotionWrite, useTodayStats, useLiveWrites, getProxyConfig, NotionSetup`

`auth.jsx` → window: `getSupabase, useSession, AuthSheet, AuthPill, cloudPushWrites, cloudPushChatMsg, cloudPullWrites, mergeFromCloud`

ページコードは `window.ClaudeChat`、`window.useSession()` のように呼ぶ。

### styles オブジェクトの命名

スクリプトをまたいで `const styles = { ... }` を作ると名前衝突する。常にコンポーネント名前空間付き(`const lobbyStyles`)か、CSS クラスにする。現状は全部 CSS クラスベース。

### localStorage キー

| キー | 用途 |
|---|---|
| `uwiki-chat` | チャット履歴 (直近50件) |
| `uwiki-writes` | Notion 書き込みログ (直近500件) |
| `uwiki-selfie-latest` | 最新の自撮り (dataUrl, meta) |
| `uwiki-reflection-cache` | 「今日の振り返り」キャッシュ (1日1回) |
| `uwiki-notion-proxy` | Notion proxy URL |
| `uwiki-notion-dbs` | Notion DB ID マップ |
| `uwiki-onboarded` | (未使用、過去のオンボーディング用) |

### ストレージ アダプタ

`persistWrites(writes)` (in `claude-shared.jsx`) が3つの destination に並列 push:
1. localStorage (常に)
2. Notion proxy (Worker URL 設定済みなら)
3. Supabase (ログイン中なら)

これらは independent — ユーザーは好きな組み合わせで使える。

## 動作フェーズ

| Phase | 内容 | 状態 |
|---|---|---|
| 0 | 3画面ローカル動作 | ✅ |
| 1 | Cloudflare Pages 公開 + OSS | ✅ (ユーザー側がデプロイ) |
| 2 | Supabase 認証 + Cloud 保管庫 | ✅ (ユーザー側が Supabase 設定) |
| 3 | Notion BYO Worker | ✅ (ユーザー側が `wrangler deploy`) |
| 4 | 自撮りアップロード + Storage | ✅ (ユーザー側が Storage バケット作成) |
| 5 | 今日の振り返り (Claude要約) | ✅ |
| 6 | PWA インストール | ✅ |
| 7 | Claude Vision で自撮り実解析 | 未着手 (要 Anthropic API Worker) |
| 8 | 週次・月次レポート自動生成 | 未着手 |

## 次の作業候補

### Phase 7: Claude Vision で自撮り解析

現状は自撮りをアップロードするだけで、ハードコードされた AI スコアが表示される。実際の解析には:
1. 別の Cloudflare Worker で Anthropic API (claude-3-5-sonnet-latest や claude-haiku-4-5) の vision エンドポイントを叩く
2. `attraction.jsx` の `SelfieScan` から、アップロード後に画像を Worker に POST
3. レスポンスの JSON ({puffiness, weight_balance, skin}) を Status DB に書き込み
4. AIAnalysis セクションを localStorage `uwiki-ai-scores` から動的に読む(現状ハードコード)

### Phase 8: 週次・月次レポート

`gravity.jsx` の `DailyReflection` を雛形に:
- 「今週を振り返る」(直近7日の writes)
- 「今月を振り返る」(直近30日)
- 「年次サマリー」
それぞれボタン + Claude プロンプトを変えるだけ。

### config.js の管理

`config.js` を git にコミットすると、ユーザーごとに別の値を入れたい時に conflict する。
- Cloudflare Pages の環境変数 → ビルド時に `config.js` を生成、というアプローチを検討
- もしくは `config.js` は `.gitignore` 入りにして、デプロイ時に手動配置

現在は `config.js` がコミット対象。anon key は公開しても安全(RLS で保護)。

### Notion DB スキーマの実機検証

`worker/index.js` の `propsToNotion()` は数値・boolean・文字列を雑にマッピング。実際の Notion DB で `select` 型や `date` 型を使う場合は明示的なマッピングが必要。

## デザイン上のルール

- カラー: 暖色 (#c8a878 系) = 重力雨域、寒色 (#3a76d2 系) = 引力雨域
- フォント: Shippori Mincho (見出し・詩的テキスト), Inter Tight (UI), Noto Sans JP (本文), JetBrains Mono (数値・ラベル)
- 雨アニメ: 各ページ独自(玄関は2色混合、重力は太い琥珀色、引力は細い水色)
- 漢字をブランドの主役にする(「雨域」「重力」「引力」)
- 余白を多く、文字サイズは大きめ(24px+ の見出し、13-15px の本文)

## 既知の問題

- Babel-in-browser のパフォーマンス警告がコンソールに出る(正常、無視可)
- SW は localhost or HTTPS のみで動く(file:// では fail silently)
- 自撮りの実 AI 解析は未実装(ハードコードスコア)
- Notion proxy はリクエスト元を認証していない(個人利用前提)

## ユーザーの想い (元の発話より)

> 「Notionを開かないNotionダッシュボード」
> 「話したことを、Claudeが静かに沈める」
> 「重力と引力の二重世界」
> 「やる より やめる のほうが価値が高い日もある」

これらが雨域のコアコンセプト。新機能を足す時も、この「静けさ」「内省」「測定 vs 内面の二重構造」を保つこと。
