// Lobby — the front door of Uwiki.
// One screen: rain, Uwiki logo, Claude chat, two doors to inner worlds.
const { useState, useEffect, useRef } = React;

function LobbyRain() {
  const ref = useRef();
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext("2d");
    let raf, running = true;
    const drops = [];
    const ripples = [];
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const spawn = () => ({
      x: Math.random() * canvas.clientWidth,
      y: -10 - Math.random() * canvas.clientHeight,
      len: 10 + Math.random() * 20,
      speed: 4 + Math.random() * 6,
      wind: -1.0 - Math.random() * 0.6,
      opacity: 0.12 + Math.random() * 0.32,
      color: Math.random() < 0.55 ? "200,170,120" : "150,180,210",
    });
    while (drops.length < 180) drops.push(spawn());
    const tick = () => {
      if (!running) return;
      const w = canvas.clientWidth, h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);
      ctx.lineCap = "round";
      for (const d of drops) {
        d.y += d.speed; d.x += d.wind;
        if (d.y > h - 30) {
          if (Math.random() < 0.3) ripples.push({ x: d.x, y: h - 18 - Math.random() * 8, r: 0, life: 1, color: d.color });
          Object.assign(d, spawn());
          continue;
        }
        ctx.strokeStyle = `rgba(${d.color},${d.opacity})`;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x + d.wind * 1.6, d.y + d.len);
        ctx.stroke();
      }
      for (let i = ripples.length - 1; i >= 0; i--) {
        const rp = ripples[i];
        rp.r += 0.6; rp.life -= 0.018;
        if (rp.life <= 0) { ripples.splice(i, 1); continue; }
        ctx.strokeStyle = `rgba(${rp.color},${rp.life * 0.35})`;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.ellipse(rp.x, rp.y, rp.r, rp.r * 0.32, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => { running = false; cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);
  return <canvas ref={ref} className="lobby-rain" />;
}

function Door({ to, jp, en, desc, locked, accent, icon, count }) {
  const handleClick = (e) => {
    if (locked) {
      e.preventDefault();
      window.location.href = `${to}?gate=1`;
    }
  };
  return (
    <a href={to} className={`door door-${accent} ${locked ? "locked" : ""}`} onClick={handleClick}>
      <div className="door-frame">
        <div className="door-icon">{icon}</div>
        <div className="door-content">
          <div className="door-tag">
            <span className="door-jp">{jp}</span>
            {locked && (
              <span className="door-lock" title="鍵付き">
                <svg viewBox="0 0 14 14" width="11" height="11">
                  <rect x="3" y="6.5" width="8" height="6" rx="1" fill="none" stroke="currentColor" strokeWidth="1.2" />
                  <path d="M4.5 6.5 V4.5 a2.5 2.5 0 0 1 5 0 V6.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
                </svg>
              </span>
            )}
          </div>
          <div className="door-en">{en}</div>
          <div className="door-desc">{desc}</div>
          {count > 0 && (
            <div className="door-count">
              <span className="door-count-dot" />
              本日 {count} 件記録
            </div>
          )}
        </div>
        <div className="door-arrow">
          <svg viewBox="0 0 16 16" width="16" height="16">
            <path d="M4 8 L12 8 M8 4 L12 8 L8 12" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </a>
  );
}

function Lobby() {
  const [now, setNow] = useState(new Date());
  const stats = window.useTodayStats();
  const [setupOpen, setSetupOpen] = useState(false);
  const [proxyOk, setProxyOk] = useState(() => !!window.getProxyConfig().url);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000);
    const onSync = (e) => {
      const ok = !!window.getProxyConfig().url;
      setProxyOk(ok);
    };
    window.addEventListener("uwiki-notion-sync", onSync);
    return () => { clearInterval(id); window.removeEventListener("uwiki-notion-sync", onSync); };
  }, []);

  const date = now.toLocaleDateString("ja-JP", { month: "long", day: "numeric", weekday: "long" });
  const time = now.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
  const greeting = "雨域へようこそ。Notionは開かなくて大丈夫。話したことは私が静かに沈めておきます。";

  return (
    <div className="lobby">
      <div className="lobby-bg" />
      <LobbyRain />
      <div className="lobby-grid" />

      <header className="lobby-top">
        <div className="lobby-date">{date}</div>
        <div className="lobby-top-actions">
          <button className={`lobby-notion-btn ${proxyOk ? "connected" : ""}`} onClick={() => setSetupOpen(true)}>
            <span className="lobby-notion-dot" />
            {proxyOk ? "Notion 接続中" : "Notion 未接続"}
          </button>
          <window.AuthPill />
        </div>
        <div className="lobby-time">{time}</div>
      </header>

      <div className="lobby-stage">
        <div className="lobby-brand">
          <h1 className="lobby-kanji">雨 域</h1>
          <div className="lobby-divider" />
          <div className="lobby-en">U W I K I</div>
          <div className="lobby-tagline">— 重力と引力の二重世界 —</div>
        </div>

        <div className="lobby-claude-wrap">
          <window.ClaudeChat greeting={greeting} compact />
        </div>

        <div className="lobby-doors">
          <Door
            to="Gravity.html"
            jp="重力雨域"
            en="GRAVITY · 内側"
            desc="夢・熱量・ロードマップ。砂のように沈めた想い。"
            accent="warm"
            count={stats.Reflection}
            icon={
              <svg viewBox="0 0 32 32" width="28" height="28">
                <path d="M10 4 H22 V10 L16 16 L22 22 V28 H10 V22 L16 16 L10 10 Z" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
              </svg>
            }
          />
          <Door
            to="Attraction.html"
            jp="引力雨域"
            en="ATTRACTION · 外側"
            desc="客観データ・AI測定・自撮りスコア。他者から見た像。"
            locked
            accent="cool"
            count={stats.Status + stats.Environment}
            icon={
              <svg viewBox="0 0 32 32" width="28" height="28">
                <circle cx="16" cy="16" r="10" fill="none" stroke="currentColor" strokeWidth="1.4" />
                <circle cx="16" cy="16" r="4" fill="currentColor" opacity="0.7" />
              </svg>
            }
          />
        </div>
      </div>

      <footer className="lobby-bottom">
        <div className="lobby-sync-summary">
          <span className="lobby-sync-dot" />
          <span>本日 Claude が Notion に書いた: <strong>{stats.total}</strong> 件</span>
          <span className="lobby-sync-spacer" />
          <span className="lobby-sync-detail">
            <span className="db-pill warm">Reflection {stats.Reflection}</span>
            <span className="db-pill cool">Status {stats.Status}</span>
            <span className="db-pill green">Environment {stats.Environment}</span>
          </span>
        </div>
      </footer>

      <div className="lobby-meta">
        <a href="https://github.com/yourname/uwiki" target="_blank" rel="noopener" className="lobby-meta-link">
          <svg viewBox="0 0 16 16" width="13" height="13" fill="currentColor">
            <path d="M8 0a8 8 0 0 0-2.5 15.6c.4.1.6-.2.6-.4v-1.4c-2.2.5-2.7-1-2.7-1-.4-.9-.9-1.2-.9-1.2-.7-.5.1-.5.1-.5.8.1 1.2.8 1.2.8.7 1.2 1.9.9 2.4.7.1-.5.3-.9.5-1.1-1.8-.2-3.6-.9-3.6-3.9 0-.9.3-1.6.8-2.1-.1-.2-.4-1 .1-2.1 0 0 .7-.2 2.2.8a7.5 7.5 0 0 1 4 0c1.5-1 2.2-.8 2.2-.8.4 1.1.2 1.9.1 2.1.5.5.8 1.2.8 2.1 0 3-1.8 3.7-3.6 3.9.3.3.5.8.5 1.5v2.2c0 .2.2.5.6.4A8 8 0 0 0 8 0Z" />
          </svg>
          GitHub
        </a>
        <span className="lobby-meta-sep">·</span>
        <a href="https://buymeacoffee.com/uwiki" target="_blank" rel="noopener" className="lobby-meta-link">
          <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6 H13 V11 a2 2 0 0 1 -2 2 H5 a2 2 0 0 1 -2 -2 z" />
            <path d="M13 7 H14 a1.5 1.5 0 0 1 0 3 H13" />
            <path d="M6 2 V4 M9 2 V4" />
          </svg>
          一杯の雨を差し入れる
        </a>
        <span className="lobby-meta-sep">·</span>
        <span className="lobby-meta-text">MIT · Open Source</span>
        <span className="lobby-meta-sep">·</span>
        <a href="https://github.com/yourname/uwiki#readme" target="_blank" rel="noopener" className="lobby-meta-link">
          使い方
        </a>
      </div>

      {setupOpen && <window.NotionSetup onClose={() => { setSetupOpen(false); setProxyOk(!!window.getProxyConfig().url); }} />}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<Lobby />);
