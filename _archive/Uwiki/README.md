# 雨域 — Uwiki

> *Notionを開かないNotionダッシュボード。話したことを、Claudeが静かに沈める。*

**[uwiki.app](https://uwiki.app)** — Live demo (coming soon)

[![License: MIT](https://img.shields.io/badge/License-MIT-c8a878.svg)](LICENSE)
[![Open Source](https://img.shields.io/badge/Open-Source-9bb8a8.svg)](https://github.com/yourname/uwiki)
[![Made with Claude](https://img.shields.io/badge/Made_with-Claude-efe6d6.svg)](https://claude.ai)

---

## これは何?

雨域(Uwiki)は、**話すだけで内面と外面のデータが自動で蓄積される個人ダッシュボード** です。

普段使いの言葉で「今日は気分が重い」「本屋プロジェクトはやっぱりやりたい」と話しかけると、Claude AI が解析して **3つのデータベース** に振り分けて記録します。

- **Reflection** — 夢、熱量、思考の断片、ロードマップ
- **Status** — 体重、健康、気分、貯金などの客観数値
- **Environment** — 位置、天気、湿度

データは Notion / クラウド / ローカルのいずれかに保管され、3つの世界(画面)から眺めることができます。

---

## 構造 — 3つの世界

```
                    雨 域  (玄関)
                  Rain Zone
       ┌────────────────┴────────────────┐
       ↓                                 ↓
  重力雨域 (内側)                    引力雨域 (外側) 🔒
   Gravity                            Attraction
   ・ロードマップ                       ・セルフスキャン
   ・夢                                 ・AI評価 (むくみ/体重/肌)
   ・やりたいこと                       ・客観ステータス
   ・砂のログ                           ・環境ログ
```

| ページ | 役割 | アクセス |
|---|---|---|
| **雨域** `/` | 玄関・Claude常駐 | 自由 |
| **重力雨域** `/Gravity.html` | 内面・夢 | 自由 |
| **引力雨域** `/Attraction.html` | 客観・健康データ | 押し続けて解錠(プライバシー) |

---

## どう使うか

1. **雨域(トップページ)を開く**
2. **画面中央のClaudeに話しかける** — `Enter` で送信、`⌘K` でフォーカス
   - 例: 「今日は気分が重い、本屋プロジェクトをやりたい」
3. Claude が応答 + 抽出した構造化データを ↗ Notion カードで可視化
4. **重力雨域 / 引力雨域** へ降りると、Claude に話したログが反映されている

データは Notion を未接続でも localStorage に保存され、後から Notion へ移行可能。

---

## 保管庫(Storage Adapter)

ユーザーは自分のプライバシー要求に応じて、保管庫を選べます:

| モード | 何を使う | 同期 | プライバシー | おすすめ |
|---|---|---|---|---|
| ① **ローカル** | localStorage のみ | 1端末のみ | 完璧 | 試す人 |
| ② **Uwiki Cloud** | Supabase(管理者側) | 全端末 | 暗号化保管 | 一般ユーザー |
| ③ **Notion (BYO)** | あなた自身のNotion | Notion経由 | 自分でフルコントロール | パワーユーザー |

> ① は config.js が未設定でも常に動作。② は config.js に Supabase の URL/Key を設定すると有効化。③ は雨域トップの「Notion 未接続」ボタンから設定可能(別途バックエンド Worker が必要 — 詳細 [DEPLOY.md](DEPLOY.md))。

---

## ローカル動作 (自分用)

特別な準備不要 — ブラウザで開くだけ:

```bash
git clone https://github.com/yourname/uwiki.git
cd uwiki
# どんなHTTPサーバーでもOK
python3 -m http.server 8080
# または npx serve
open http://localhost:8080
```

このまま個人用ダッシュボードとして使えます。データは全てブラウザ内 (`localStorage`)。

---

## 公開サイトを立てる (Cloudflare Pages)

詳細は **[DEPLOY.md](DEPLOY.md)** を参照。要約:

1. このリポジトリを Fork
2. Cloudflare Pages に GitHub リポジトリを接続
3. ビルド設定: **不要**(静的 HTML)
4. Output: ルート (`/`)
5. カスタムドメイン (例: `uwiki.app`) を設定
6. デプロイ完了

ビルドステップ不要、静的ファイルのみ。

---

## Notion 連携 (上級者向け)

自分の Notion ワークスペースと同期するには:

1. [Notion Developers](https://developers.notion.com) で **Internal Integration** を作成
2. 3つのデータベース(Reflection / Status / Environment)を Notion で作成し、Integration に share
3. Cloudflare Worker (Notion proxy) をデプロイ — 詳細 [DEPLOY.md](DEPLOY.md#notion-proxy)
4. 雨域の **「Notion 未接続」** ボタンから設定モーダルを開く
5. Proxy URL + 3つの DB ID を入力 → 接続テスト → 保存

以降、Claude に話した内容が **あなたの Notion** にも自動同期されます。Uwiki 運営側は **あなたのトークンを一切預かりません**。

---

## 技術スタック

- **Frontend**: React 18 + Vanilla JSX (no build step, Babel standalone)
- **AI**: Claude (`window.claude.complete`)
- **Storage**: localStorage / Supabase (Phase 2) / Notion (BYO)
- **Hosting**: Cloudflare Pages
- **Fonts**: Inter Tight, Noto Sans JP, Shippori Mincho, JetBrains Mono

ファイル一覧:

```
index.html          — エントリ(雨域 / 玄関)
Gravity.html        — 重力雨域
Attraction.html     — 引力雨域
manifest.json       — PWA マニフェスト
sw.js               — Service Worker (オフライン対応)
config.js           — Supabase 設定 (空ならローカルのみ)
config.example.js   — 雛形

lobby.jsx/.css      — 雨域(玄関)実装
gravity.jsx/.css    — 重力雨域実装(今日の振り返り含む)
attraction.jsx/.css — 引力雨域実装(自撮りアップロード含む)
auth.jsx/.css       — Supabase 認証 + AuthSheet + AuthPill
claude-shared.jsx/.css — Claude統合・Notion proxy・cloud sync

worker/             — Cloudflare Worker (Notion proxy)
  index.js, wrangler.toml, README.md
```

---

## 寄付

雨域は完全無料・広告なしで提供しています。気に入ったら一杯の雨を:

- ☕ [Buy Me a Coffee](https://buymeacoffee.com/uwiki)
- 💛 [GitHub Sponsors](https://github.com/sponsors/yourname)

---

## ロードマップ

- [x] Phase 0 — ローカル動作 + 3画面構成
- [x] Phase 1 — Cloudflare Pages 公開 + オープンソース化
- [x] Phase 2 — Cloud 保管庫 (Supabase) + メール/ユーザー名ログイン
- [x] Phase 3 — Notion BYO 上級者モード(`worker/` ディレクトリにデプロイ済みコード)
- [x] Phase 4 — 自撮りアップロード + Supabase Storage 保存(Vision API 接続は将来)
- [x] Phase 5 — 今日の振り返り(Claudeが本日の writes を詩的に要約)
- [x] Phase 6 — PWA(`manifest.json` + service worker、ホーム画面に追加可能)
- [ ] Phase 7 — Claude Vision で自撮りを実解析(別途 Anthropic API キー必要)
- [ ] Phase 8 — 週次・月次レポート自動生成

---

## ライセンス

MIT — 自由にフォークしてください。

雨域に「貢献したい」と思ったら、Pull Request も歓迎します。issue で先に相談してもらえると、方向性を合わせやすいです。

---

> 「やる」より「やめる」のほうが価値が高い日もある。
> 今日は、何粒沈めましたか。

— *雨域 · 2026*
