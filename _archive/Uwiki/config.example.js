// Uwiki — sample config. Copy to config.js and fill in.
//
// Supabase はオプションです。空のまま(または config.js を作らない)場合は、
// 雨域はローカル専用モード(localStorage のみ)で動作します。
//
// セットアップ手順は DEPLOY.md の "Phase 2: Supabase" セクションを参照してください。

window.UWIKI_CONFIG = {
  // ────── Supabase (Cloud 保管庫 + 認証) ──────
  // https://supabase.com → プロジェクト → Project Settings → API
  supabaseUrl: "",        // 例: "https://abcdefghijklm.supabase.co"
  supabaseAnonKey: "",    // 例: "eyJhbGciOi..." (anon public key)

  // ────── オープンソース情報 ──────
  githubUrl: "https://github.com/yourname/uwiki",
  donateUrl: "https://buymeacoffee.com/uwiki",
};
