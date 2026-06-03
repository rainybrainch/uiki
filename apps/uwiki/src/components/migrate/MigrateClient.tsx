"use client"

import { useState } from "react"

// 旧UIKIページのコンソールで実行するスクリプト
const EXTRACT_SCRIPT = `
(function() {
  const KEYS = [
    'uiki_sand_log',
    'shared_rb_gravity',
    'shared_rb_attraction',
    'uiki_config',
    'uiki_tasks',
  ];
  const data = {};
  KEYS.forEach(k => {
    const v = localStorage.getItem(k);
    if (v) { try { data[k] = JSON.parse(v); } catch { data[k] = v; } }
  });
  const json = JSON.stringify(data, null, 2);
  try { navigator.clipboard.writeText(json); alert('✓ クリップボードにコピーしました'); }
  catch { console.log(json); alert('コンソールにデータを出力しました'); }
  return json;
})();
`.trim()

export function MigrateClient() {
  const [json, setJson] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle")
  const [result, setResult] = useState<any>(null)

  const handleImport = async () => {
    if (!json.trim()) return
    setStatus("loading")
    try {
      const data = JSON.parse(json)
      const res = await fetch("/api/migrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      const r = await res.json()
      if (!res.ok) throw new Error(r.error)
      setResult(r.imported)
      setStatus("done")
    } catch (e: any) {
      setResult(e.message)
      setStatus("error")
    }
  }

  return (
    <div className="page-container max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-serif font-light tracking-wide mb-2">データ移行</h1>
        <p className="text-sm text-dim">旧UIKI（rainybrainch.github.io/uiki/）から 雨域/Uwiki にデータを移行します</p>
      </div>

      {/* Step 1 */}
      <div className="surface rounded-xl p-5 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold"
            style={{ background: "var(--accent)", color: "white" }}>1</span>
          <p className="text-sm font-medium">旧UIKIでデータを抽出</p>
        </div>
        <p className="text-xs text-dim mb-3">
          <a href="https://rainybrainch.github.io/uiki/" target="_blank" rel="noopener"
            className="underline" style={{ color: "var(--accent)" }}>
            rainybrainch.github.io/uiki/
          </a> をブラウザで開き、DevTools（F12）→ コンソールに以下を貼り付けて実行してください
        </p>
        <div className="rounded-lg p-3 text-xs font-mono overflow-x-auto relative"
          style={{ background: "rgba(0,0,0,0.4)", border: "1px solid var(--border)" }}>
          <pre style={{ color: "#4ade80", margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
            {EXTRACT_SCRIPT}
          </pre>
        </div>
        <button
          onClick={() => navigator.clipboard?.writeText(EXTRACT_SCRIPT)}
          className="mt-2 text-xs px-3 py-1.5 rounded-lg transition-opacity hover:opacity-80"
          style={{ background: "rgba(58,111,201,0.15)", color: "var(--accent)", border: "1px solid rgba(58,111,201,0.3)" }}
        >
          スクリプトをコピー
        </button>
        <p className="text-xs text-dim mt-2">実行するとデータが自動でクリップボードにコピーされます</p>
      </div>

      {/* Step 2 */}
      <div className="surface rounded-xl p-5 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold"
            style={{ background: "var(--accent)", color: "white" }}>2</span>
          <p className="text-sm font-medium">コピーしたJSONをここに貼り付ける</p>
        </div>
        <textarea
          value={json}
          onChange={(e) => setJson(e.target.value)}
          placeholder='{"uiki_sand_log": [...], "shared_rb_gravity": {...}, "shared_rb_attraction": {...}}'
          rows={6}
          className="w-full input-base text-xs font-mono resize-none"
        />
      </div>

      {/* Step 3 */}
      <button
        onClick={handleImport}
        disabled={!json.trim() || status === "loading"}
        className="w-full py-3 rounded-xl text-sm font-medium transition-all disabled:opacity-40"
        style={{ background: "var(--accent)", color: "white" }}
      >
        {status === "loading" ? "移行中..." : "移行を実行"}
      </button>

      {/* 結果 */}
      {status === "done" && result && (
        <div className="mt-4 rounded-xl p-4"
          style={{ background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.25)" }}>
          <p className="text-sm font-medium mb-2" style={{ color: "#4ade80" }}>✓ 移行完了</p>
          <div className="space-y-1 text-xs text-dim">
            {result.gravityLogs > 0 && <p>砂のログ: {result.gravityLogs}件</p>}
            {result.attractionMetrics > 0 && <p>引力雨域 指標: {result.attractionMetrics}項目 / ログ: {result.attractionLogs}件</p>}
            {result.settings > 0 && <p>設定（都市）: 移行済み</p>}
          </div>
          <p className="text-xs text-dim mt-3">
            <a href="/gravity?tab=internal" className="underline" style={{ color: "var(--accent)" }}>重力雨域</a>
            {" / "}
            <a href="/gravity?tab=external" className="underline" style={{ color: "var(--accent)" }}>引力雨域</a>
            {" で確認できます"}
          </p>
        </div>
      )}

      {status === "error" && (
        <div className="mt-4 rounded-xl p-4"
          style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.25)" }}>
          <p className="text-sm" style={{ color: "var(--red)" }}>エラー: {String(result)}</p>
        </div>
      )}
    </div>
  )
}
