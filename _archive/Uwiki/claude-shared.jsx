// Shared Claude chat — usable as a panel (inline) or sheet (overlay).
// Same localStorage keys across all pages → data syncs.
(function() {
  const { useState, useEffect, useRef } = React;

  const NOTION_DBS = {
    Reflection:  { color: "#c8a878", label: "Reflection DB" },
    Status:      { color: "#5a92c8", label: "Status DB" },
    Environment: { color: "#9bb8a8", label: "Environment DB" },
  };

  const SYSTEM_PROMPT = `あなたは Uwiki AI 「演出家・メンター・アナリスト」の三役を担うアシスタントです。
ユーザーは Notion を直接開かず、あなたとの会話のみでデータを蓄積します。
ユーザーの発話から構造化データを抽出し、Notion DBに記録するためのJSONを返してください。

利用可能なDB:
- Reflection: { type: "dream" | "grain" | "wishlist" | "roadmap", text: string, heat: 0-1, intensity?: 0-1, phase?: string }
- Status:     { metric: "puffiness" | "weight_kg" | "skin_lv" | "health_score" | "sleep_debt" | "savings" | "mood" | "energy", value: number | string, unit?: string }
- Environment:{ key: "weather" | "location" | "humidity", value: string }

出力は厳密に以下のJSON形式のみ。説明や前置きは一切なし。

{
  "reply": "ユーザーへの返答 (短く、優しく、雨域の雰囲気で。1-2文)",
  "writes": [ { "db": "...", "props": { ... } } ]
}`;

  function getProxyConfig() {
    try {
      const url = localStorage.getItem("uwiki-notion-proxy") || "";
      const dbIds = JSON.parse(localStorage.getItem("uwiki-notion-dbs") || "{}");
      return { url, dbIds };
    } catch { return { url: "", dbIds: {} }; }
  }

  async function pushToNotion(stamped) {
    const { url, dbIds } = getProxyConfig();
    if (!url) return { ok: false, reason: "no-proxy" };
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ writes: stamped, dbIds }),
      });
      if (!res.ok) return { ok: false, reason: `HTTP ${res.status}` };
      const data = await res.json().catch(() => ({}));
      return { ok: true, data };
    } catch (e) {
      return { ok: false, reason: e.message || "network error" };
    }
  }

  function persistWrites(writes) {
    const stamped = writes.map((w) => ({ ...w, t: Date.now() }));
    try {
      const stored = JSON.parse(localStorage.getItem("uwiki-writes") || "[]");
      localStorage.setItem("uwiki-writes", JSON.stringify([...stamped, ...stored].slice(0, 500)));
      window.dispatchEvent(new CustomEvent("uwiki-writes-changed", { detail: stamped }));
    } catch {}
    // Fire-and-forget Notion sync (if configured)
    pushToNotion(stamped).then((r) => {
      window.dispatchEvent(new CustomEvent("uwiki-notion-sync", { detail: r }));
    });
    // Fire-and-forget Cloud (Supabase) sync (if signed in)
    if (window.cloudPushWrites) {
      window.cloudPushWrites(stamped).then((r) => {
        window.dispatchEvent(new CustomEvent("uwiki-cloud-sync", { detail: r }));
      });
    }
  }

  // Hook: live read of writes from localStorage with reactive updates
  function useLiveWrites() {
    const [writes, setWrites] = useState(() => {
      try { return JSON.parse(localStorage.getItem("uwiki-writes") || "[]"); }
      catch { return []; }
    });
    useEffect(() => {
      const handler = () => {
        try { setWrites(JSON.parse(localStorage.getItem("uwiki-writes") || "[]")); }
        catch {}
      };
      window.addEventListener("uwiki-writes-changed", handler);
      window.addEventListener("storage", handler);
      return () => {
        window.removeEventListener("uwiki-writes-changed", handler);
        window.removeEventListener("storage", handler);
      };
    }, []);
    return writes;
  }

  function NotionWrite({ write }) {
    const info = NOTION_DBS[write.db] || {};
    return (
      <div className="uw-write" style={{ "--db-color": info.color }}>
        <span className="uw-write-mark">↗</span>
        <div>
          <div className="uw-write-db">Notion · {info.label || write.db}</div>
          <div className="uw-write-props">
            {Object.entries(write.props).map(([k, v], i) => (
              <span key={k}>
                {i > 0 && ", "}
                <span className="uw-write-key">{k}</span>: {typeof v === "string" ? `"${v}"` : String(v)}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  function ClaudeChat({ greeting, compact = false }) {
    const [messages, setMessages] = useState(() => {
      try { return JSON.parse(localStorage.getItem("uwiki-chat") || "[]"); }
      catch { return []; }
    });
    const [input, setInput] = useState("");
    const [thinking, setThinking] = useState(false);
    const listRef = useRef();
    const inputRef = useRef();

    useEffect(() => {
      localStorage.setItem("uwiki-chat", JSON.stringify(messages.slice(-50)));
      if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
    }, [messages]);

    useEffect(() => {
      if (messages.length === 0) {
        setMessages([{
          role: "claude",
          text: greeting || "雨域へようこそ。話したことは私が Notion に静かに沈めます。",
          writes: [],
        }]);
      }
      const onKey = (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === "k") {
          e.preventDefault();
          inputRef.current?.focus();
        }
      };
      // When cloud pulls chat after login, reload from localStorage
      const onChatChanged = () => {
        try {
          const cloud = JSON.parse(localStorage.getItem("uwiki-chat") || "[]");
          if (cloud.length > 0) setMessages(cloud);
        } catch {}
      };
      window.addEventListener("keydown", onKey);
      window.addEventListener("uwiki-chat-changed", onChatChanged);
      return () => {
        window.removeEventListener("keydown", onKey);
        window.removeEventListener("uwiki-chat-changed", onChatChanged);
      };
    }, []);

    const send = async (text) => {
      if (!text.trim() || thinking) return;
      const userMsg = { role: "user", text: text.trim() };
      setMessages((m) => [...m, userMsg]);
      setInput("");
      setThinking(true);
      // Mirror user message to cloud (fire-and-forget)
      if (window.cloudPushChatMsg) window.cloudPushChatMsg("user", userMsg.text, null);
      try {
        const raw = await window.claude.complete({
          messages: [
            { role: "user", content: SYSTEM_PROMPT + "\n\n---\n\nユーザー: " + text.trim() + "\n\n上記の発話を解析し、JSONのみを返してください。" }
          ],
        });
        let parsed;
        try {
          const m = raw.match(/\{[\s\S]*\}/);
          parsed = JSON.parse(m ? m[0] : raw);
        } catch {
          parsed = { reply: raw.slice(0, 200), writes: [] };
        }
        const writes = parsed.writes || [];
        const replyText = parsed.reply || "記録しました。";
        setMessages((mm) => [...mm, { role: "claude", text: replyText, writes }]);
        if (writes.length) persistWrites(writes);
        if (window.cloudPushChatMsg) window.cloudPushChatMsg("claude", replyText, writes);
      } catch (e) {
        const errText = "つながりが揺れました。もう一度話してください。";
        setMessages((mm) => [...mm, { role: "claude", text: errText, writes: [] }]);
        if (window.cloudPushChatMsg) window.cloudPushChatMsg("claude", errText, null);
      } finally {
        setThinking(false);
      }
    };

    return (
      <div className={`uw-claude ${compact ? "compact" : ""}`}>
        <div className="uw-head">
          <div className="uw-title">
            <span className="uw-avatar">雨</span>
            <div>
              <div className="uw-name">Uwiki AI</div>
              <div className="uw-sub"><span className="uw-pulse" />Reflection · Status · Environment</div>
            </div>
          </div>
          <div className="uw-kbd">⌘ K</div>
        </div>
        <div className="uw-list" ref={listRef}>
          {messages.map((m, i) => (
            <div key={i} className={`uw-msg uw-msg-${m.role}`}>
              <div className="uw-bubble">{m.text}</div>
              {m.writes && m.writes.length > 0 && (
                <div className="uw-writes">
                  {m.writes.map((w, j) => <NotionWrite key={j} write={w} />)}
                </div>
              )}
            </div>
          ))}
          {thinking && (
            <div className="uw-msg uw-msg-claude">
              <div className="uw-bubble uw-thinking"><span/><span/><span/></div>
            </div>
          )}
        </div>
        <div className="uw-input">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
            placeholder="今日の雨を話す… (Enter で沈める)"
            rows={1}
          />
          <button className="uw-send" disabled={!input.trim() || thinking} onClick={() => send(input)}>
            <svg viewBox="0 0 14 14" width="13" height="13">
              <path d="M2 7 L12 7 M8 3 L12 7 L8 11" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  // Floating FAB + sheet — for sub-pages
  function ClaudeFAB({ accent = "warm" }) {
    const [open, setOpen] = useState(false);
    return (
      <>
        {!open && (
          <button className={`uw-fab uw-fab-${accent}`} onClick={() => setOpen(true)} aria-label="Claude に話しかける">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none">
              <path d="M5 8 C5 5 7 4 9 4 H15 C17 4 19 5 19 8 V13 C19 16 17 17 15 17 H10 L6 20 V17 C5.5 16.5 5 15.5 5 13 V8 Z" fill="currentColor" />
              <circle cx="9" cy="11" r="1.1" fill="rgba(0,0,0,0.5)" />
              <circle cx="13" cy="11" r="1.1" fill="rgba(0,0,0,0.5)" />
            </svg>
          </button>
        )}
        {open && (
          <div className="uw-overlay" onClick={(e) => e.target.classList.contains("uw-overlay") && setOpen(false)}>
            <div className="uw-sheet">
              <div className="uw-sheet-handle" />
              <button className="uw-sheet-close" onClick={() => setOpen(false)}>
                <svg viewBox="0 0 14 14" width="12" height="12">
                  <path d="M3 3 L11 11 M11 3 L3 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
              <ClaudeChat />
            </div>
          </div>
        )}
      </>
    );
  }

  // Quick stats reader — total writes per DB today, for portal display
  function useTodayStats() {
    const [stats, setStats] = useState({ Reflection: 0, Status: 0, Environment: 0, total: 0, last: null });
    useEffect(() => {
      const recalc = () => {
        try {
          const stored = JSON.parse(localStorage.getItem("uwiki-writes") || "[]");
          const today = new Date().toDateString();
          const today_writes = stored.filter((w) => new Date(w.t).toDateString() === today);
          const counts = { Reflection: 0, Status: 0, Environment: 0 };
          today_writes.forEach((w) => { if (counts[w.db] !== undefined) counts[w.db]++; });
          setStats({ ...counts, total: today_writes.length, last: today_writes[0] || null });
        } catch {}
      };
      recalc();
      window.addEventListener("uwiki-writes-changed", recalc);
      window.addEventListener("storage", recalc);
      return () => {
        window.removeEventListener("uwiki-writes-changed", recalc);
        window.removeEventListener("storage", recalc);
      };
    }, []);
    return stats;
  }

  // Notion setup modal — user enters proxy URL + DB IDs.
  function NotionSetup({ onClose }) {
    const cfg = getProxyConfig();
    const [url, setUrl] = useState(cfg.url);
    const [reflectionId, setReflectionId] = useState(cfg.dbIds.Reflection || "");
    const [statusId, setStatusId] = useState(cfg.dbIds.Status || "");
    const [envId, setEnvId] = useState(cfg.dbIds.Environment || "");
    const [testResult, setTestResult] = useState(null);

    const save = () => {
      try {
        localStorage.setItem("uwiki-notion-proxy", url.trim());
        const dbIds = {};
        if (reflectionId.trim()) dbIds.Reflection = reflectionId.trim();
        if (statusId.trim()) dbIds.Status = statusId.trim();
        if (envId.trim()) dbIds.Environment = envId.trim();
        localStorage.setItem("uwiki-notion-dbs", JSON.stringify(dbIds));
        setTestResult({ ok: true, msg: "保存しました" });
      } catch (e) {
        setTestResult({ ok: false, msg: e.message });
      }
    };

    const test = async () => {
      setTestResult({ ok: null, msg: "テスト中…" });
      const r = await pushToNotion([{
        db: "Reflection", t: Date.now(),
        props: { type: "grain", text: "Uwiki 接続テスト", heat: 0.3 }
      }]);
      setTestResult(r.ok ? { ok: true, msg: "Notionへ到達しました ✓" }
                          : { ok: false, msg: `失敗: ${r.reason}` });
    };

    const clear = () => {
      localStorage.removeItem("uwiki-notion-proxy");
      localStorage.removeItem("uwiki-notion-dbs");
      setUrl(""); setReflectionId(""); setStatusId(""); setEnvId("");
      setTestResult({ ok: true, msg: "クリアしました(ローカルのみで動作)" });
    };

    return (
      <div className="uw-overlay" onClick={(e) => e.target.classList.contains("uw-overlay") && onClose()}>
        <div className="uw-setup">
          <button className="uw-sheet-close" onClick={onClose}>
            <svg viewBox="0 0 14 14" width="12" height="12">
              <path d="M3 3 L11 11 M11 3 L3 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
          <h2 className="uw-setup-title">Notion 連携設定</h2>
          <p className="uw-setup-sub">
            あなたの Notion ワークスペースに直接書き込むには、API プロキシ(バックエンド)が必要です。<br />
            <a href="DEPLOY.md" target="_blank" rel="noopener">手順を読む →</a>
          </p>

          <label className="uw-field">
            <span>Proxy URL</span>
            <input type="url" value={url} onChange={(e) => setUrl(e.target.value)}
                   placeholder="https://your-worker.workers.dev/notion" />
            <small>Cloudflare Worker / Vercel Function などのエンドポイント</small>
          </label>

          <label className="uw-field">
            <span>Reflection DB · データベースID</span>
            <input type="text" value={reflectionId} onChange={(e) => setReflectionId(e.target.value)}
                   placeholder="2abcdef0-1234-5678-90ab-cdef12345678" />
            <small>夢・熱量・思考の断片用</small>
          </label>

          <label className="uw-field">
            <span>Status DB · データベースID</span>
            <input type="text" value={statusId} onChange={(e) => setStatusId(e.target.value)}
                   placeholder="3abcdef0-…" />
            <small>体重・健康・気分・客観数値用</small>
          </label>

          <label className="uw-field">
            <span>Environment DB · データベースID</span>
            <input type="text" value={envId} onChange={(e) => setEnvId(e.target.value)}
                   placeholder="4abcdef0-…" />
            <small>位置・天気・湿度用</small>
          </label>

          {testResult && (
            <div className={`uw-setup-result ${testResult.ok === false ? "err" : ""} ${testResult.ok ? "ok" : ""}`}>
              {testResult.msg}
            </div>
          )}

          <div className="uw-setup-actions">
            <button className="uw-btn ghost" onClick={clear}>クリア</button>
            <button className="uw-btn ghost" onClick={test} disabled={!url}>接続テスト</button>
            <button className="uw-btn primary" onClick={save}>保存</button>
          </div>

          <div className="uw-setup-foot">
            未設定の場合は localStorage のみに保存されます(自分のブラウザ内で動作)。
          </div>
        </div>
      </div>
    );
  }

  Object.assign(window, { ClaudeChat, ClaudeFAB, NotionWrite, useTodayStats, useLiveWrites, getProxyConfig, NotionSetup });
})();
