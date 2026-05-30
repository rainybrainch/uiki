# 雨域 — デプロイ手順

## Phase 1: Cloudflare Pages で公開する

### 1. GitHub にリポジトリを作る

```bash
cd /path/to/uwiki
git init
git add .
git commit -m "Initial commit — 雨域 v1"
git branch -M main
git remote add origin https://github.com/yourname/uwiki.git
git push -u origin main
```

### 2. Cloudflare アカウント作成

[https://dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up) で無料アカウントを作成。

### 3. Pages プロジェクト作成

1. ダッシュボード → **Workers & Pages** → **Create application** → **Pages** タブ
2. **Connect to Git** → GitHub アカウントを認証 → `uwiki` リポジトリを選択
3. ビルド設定:
   - **Framework preset**: `None`
   - **Build command**: 空白
   - **Build output directory**: `/`
4. **Save and Deploy**

数分で `https://uwiki.pages.dev` のような URL でアクセス可能になります。

### 4. カスタムドメイン (uwiki.app) を接続

1. **uwiki.app** をドメインレジストラで取得
   - 推奨: [Cloudflare Registrar](https://www.cloudflare.com/products/registrar/) (年 ~$14、原価販売)
   - 他: Google Domains (Squarespace)、お名前.com など
2. ドメインを Cloudflare に追加(Cloudflare Registrar の場合は自動)
   - 他社レジストラの場合: ネームサーバーを Cloudflare のものに変更
3. Pages プロジェクト → **Custom domains** → **Set up a custom domain** → `uwiki.app` を入力
4. 自動的に DNS 設定 + SSL 証明書発行(~5分)

これで `https://uwiki.app` で公開完了。

### 5. (任意) アクセス制限

公開前の自分用テストなら:
- Cloudflare **Zero Trust** → **Access** → Pages を保護
- 自分のメールアドレスからのみ閲覧可

---

## Phase 2: Supabase 認証 + Cloud 保管庫

ユーザーが **メール+パスワード** または **ユーザー名+パスワード** または **メール一発(マジックリンク)** でログインできるようになります。会話履歴と書き込みが Supabase 上に保存され、複数端末で同期します。

### 1. Supabase プロジェクト作成

1. [https://supabase.com](https://supabase.com) → Sign in → **New project**
2. Project name: `uwiki`
3. Database Password: 強力なものを生成して保管
4. Region: 自分に近いもの (Tokyo / Singapore など)
5. Pricing: **Free** で十分
6. 数分待つとプロビジョニング完了

### 2. データベーススキーマ作成

左メニュー → **SQL Editor** → New query → 以下を全部貼って **Run**:

```sql
-- ─── プロフィール ───────────────────────────────────────
create table public.profiles (
  user_id uuid references auth.users on delete cascade primary key,
  username text unique not null check (length(username) >= 3 and length(username) <= 30),
  email text not null,
  created_at timestamptz default now()
);

-- ユーザー名 → メール解決用 RPC (匿名でも実行可)
create or replace function public.email_for_username(uname text)
returns text language sql security definer set search_path = public as $$
  select email from public.profiles where lower(username) = lower(uname) limit 1;
$$;
grant execute on function public.email_for_username(text) to anon, authenticated;

-- ─── 書き込みログ(Notion 互換 JSON) ───────────────────
create table public.writes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  db text not null check (db in ('Reflection','Status','Environment')),
  props jsonb not null,
  t timestamptz default now()
);
create index writes_user_t on writes(user_id, t desc);

-- ─── チャット履歴 ──────────────────────────────────────
create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  role text not null check (role in ('user','claude')),
  text text not null,
  writes jsonb,
  t timestamptz default now()
);
create index chat_user_t on chat_messages(user_id, t);

-- ─── Row Level Security:自分のデータだけアクセス可 ──
alter table profiles enable row level security;
alter table writes enable row level security;
alter table chat_messages enable row level security;

create policy "own profile select" on profiles
  for select using (auth.uid() = user_id);
create policy "own profile insert" on profiles
  for insert with check (auth.uid() = user_id);
create policy "own profile update" on profiles
  for update using (auth.uid() = user_id);

create policy "own writes all" on writes
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "own chat all" on chat_messages
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

成功すると **Success. No rows returned** が表示されます。

### 3. 認証設定

**Authentication** → **Providers** → **Email** を確認(デフォルトで有効)

**Authentication** → **URL Configuration**:
- **Site URL**: `https://uwiki.app` (本番)
- **Redirect URLs**: `http://localhost:8080`, `https://uwiki.app`(マジックリンクで戻る先)

**Authentication** → **Email Templates**(任意でカスタマイズ):
- Confirm signup: 確認メールの文面を雨域ぽくする
- Magic Link: ログインリンクメールの文面を雨域ぽくする

### 4. キーの取得

**Project Settings** → **API**:
- **Project URL** をコピー: `https://xxxx.supabase.co`
- **Project API keys** → `anon` `public` キーをコピー: `eyJhbGci...`

### 5. config.js に設定

リポジトリのルートにある `config.js` を編集:

```js
window.UWIKI_CONFIG = {
  supabaseUrl: "https://xxxx.supabase.co",
  supabaseAnonKey: "eyJhbGci...",
  githubUrl: "https://github.com/yourname/uwiki",
  donateUrl: "https://buymeacoffee.com/yourname",
};
```

> **anon key は公開しても安全** です(Row Level Security でユーザー自身のデータしか触れない)。`config.js` を git にコミットしてOK。

ローカルテスト:
```bash
python3 -m http.server 8080
open http://localhost:8080
```

雨域トップ右上に **「ログイン」** ボタンが現れたら成功。新規登録 → ユーザー名/メール/パスワード入力 → サインインできれば動作確認完了。

### 6. テスト

1. 雨域でClaudeに「テストです、本屋プロジェクトをやりたい」と話す
2. Supabase ダッシュボード → **Table Editor** → `writes` を開く
3. レコードが入っていれば cloud sync 成功

別の端末(または別のブラウザ・シークレットウィンドウ)で同じアカウントにログインすると、過去の会話と書き込みがすべて読み込まれます。

---

## Phase 3: Notion BYO (上級者モード) <a id="notion-proxy"></a>

`worker/` ディレクトリにデプロイ可能なコードがあります。詳細は [`worker/README.md`](worker/README.md) を参照。

要約:

```bash
cd worker
npm install -g wrangler
wrangler login
wrangler secret put NOTION_TOKEN
wrangler deploy
```

その後、雨域トップの「Notion 未接続」ボタン → Worker URL + DB ID を入力 → 接続テスト → 保存。

---

## Phase 4: 自撮りアップロード (Supabase Storage)

### Storage バケット作成

Supabase ダッシュボード → **Storage** → **New bucket**:

- **Name**: `selfies`
- **Public bucket**: OFF(プライベート)
- **Save**

次に SQL Editor で RLS ポリシーを追加:

```sql
-- ユーザーは自分のフォルダにだけアップロード/閲覧可
create policy "own selfies upload" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'selfies'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "own selfies read" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'selfies'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "own selfies delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'selfies'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
```

これでログイン中のユーザーは自分の自撮りだけアップロード・閲覧できます。引力雨域の「セルフスキャン」セクションから直接 upload 可能。

---

## Phase 6: PWA としてインストール

雨域は Progressive Web App として配信されています。ユーザーは:

- **iOS Safari** で開く → 共有ボタン → **ホーム画面に追加**
- **Android Chrome** → メニュー → **アプリをインストール**
- **デスクトップ Chrome / Edge** → アドレスバー右の **インストール** アイコン

オフラインでも基本機能(Claude チャット以外)が動作します。

---

## トラブルシュート

### Cloudflare Pages にデプロイしたら React が動かない

ブラウザのコンソールを開き、CORSエラーか CDN ロード失敗を確認。`unpkg.com` がブロックされている場合は、`integrity` ハッシュ付きの別 CDN を試してください。

### Notion 接続テストで `HTTP 401`

Notion Token が間違っているか、データベースを Integration に share していない。

### Notion 接続テストで `no db`

DB ID が設定されていない。雨域の Notion 設定モーダルで再入力。

### Claude が JSON ではなく長文を返す

トークン上限(1024)に当たっている可能性。短く話しかけてみてください。
