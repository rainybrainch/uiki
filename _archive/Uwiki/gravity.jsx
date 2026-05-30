// 重力雨域 — Gravity / The rain that falls inward
// Roadmap, dreams, want-to-do, sand log. Dark warm aesthetic.
const { useState, useEffect, useRef } = React;

// Same rain canvas as lobby (heavier warm rain on this page)
function GravityRain() {
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
      len: 14 + Math.random() * 22,
      speed: 5 + Math.random() * 8,
      wind: -1.4 - Math.random() * 0.7,
      opacity: 0.15 + Math.random() * 0.35,
      width: Math.random() < 0.18 ? 1.4 : 0.7,
    });
    while (drops.length < 200) drops.push(spawn());
    const tick = () => {
      if (!running) return;
      const w = canvas.clientWidth, h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);
      ctx.lineCap = "round";
      for (const d of drops) {
        d.y += d.speed; d.x += d.wind;
        if (d.y > h - 20) {
          if (Math.random() < 0.3) ripples.push({ x: d.x, y: h - 12, r: 0, life: 1 });
          Object.assign(d, spawn());
          continue;
        }
        ctx.strokeStyle = `rgba(200,170,120,${d.opacity})`;
        ctx.lineWidth = d.width;
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x + d.wind * 1.6, d.y + d.len);
        ctx.stroke();
      }
      for (let i = ripples.length - 1; i >= 0; i--) {
        const rp = ripples[i];
        rp.r += 0.7; rp.life -= 0.02;
        if (rp.life <= 0) { ripples.splice(i, 1); continue; }
        ctx.strokeStyle = `rgba(200,170,120,${rp.life * 0.35})`;
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
  return <canvas ref={ref} className="g-rain" />;
}

// ─── Sections ───────────────────────────────────────────
function Section({ no, jp, en, action, children }) {
  return (
    <section className="g-section">
      <header className="g-sechead">
        <div className="g-sechead-left">
          <span className="g-sechead-no">{no}</span>
          <div>
            <div className="g-sechead-jp">{jp}</div>
            <div className="g-sechead-en">{en}</div>
          </div>
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}

function NTag({ db, prop }) {
  return (
    <span className="g-ntag">
      <svg viewBox="0 0 10 10" width="9" height="9">
        <rect x="1" y="1" width="8" height="8" rx="1" fill="none" stroke="currentColor" strokeWidth="0.9" />
        <path d="M3.3 2.8 V7.2 M3.3 2.8 L6.7 7.2 M6.7 2.8 V7.2" stroke="currentColor" strokeWidth="0.9" fill="none" />
      </svg>
      <span>{db}<span className="g-ntag-prop">·{prop}</span></span>
    </span>
  );
}

function UserBlock({ items, label, children }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="g-user-block">
      <div className="g-user-label">
        <span className="g-user-dot" />
        あなたが沈めた · {items.length} 件
      </div>
      {children}
    </div>
  );
}

function fmtTime(t) {
  return new Date(t).toLocaleString("ja-JP", { month:"numeric", day:"numeric", hour:"2-digit", minute:"2-digit" });
}

function DailyReflection({ writes }) {
  const [summary, setSummary] = useState(() => {
    try {
      const s = JSON.parse(localStorage.getItem("uwiki-reflection-cache") || "null");
      if (s && s.date === new Date().toDateString()) return s.text;
    } catch {}
    return null;
  });
  const [loading, setLoading] = useState(false);
  const today = writes.filter((w) => new Date(w.t).toDateString() === new Date().toDateString());

  const generate = async () => {
    setLoading(true);
    try {
      const items = today.length
        ? today.map((w) => `- [${w.db}] ${JSON.stringify(w.props).slice(0, 200)}`).join("\n")
        : "(まだ今日の記録はありません)";
      const prompt = `あなたは雨域(Uwiki)の演出家です。以下は本日のユーザーの記録です。

${items}

これを内側のユーザーに向けて、短く詩的に振り返ってください。雨の比喩を交え、80〜120文字。最後に「明日の問い」を1行。JSONではなく自然な日本語の散文として。前置きや見出しは不要。`;
      const result = await window.claude.complete(prompt);
      setSummary(result);
      try { localStorage.setItem("uwiki-reflection-cache", JSON.stringify({ date: new Date().toDateString(), text: result })); } catch {}
    } catch (e) {
      setSummary("雨脚が乱れました。もう一度試してください。");
    } finally { setLoading(false); }
  };

  return (
    <Section no="00" jp="今日の振り返り" en="DAILY REFLECTION · The day's rain">
      <div className="g-reflection">
        {!summary && !loading && (
          <div className="g-reflection-empty">
            <p className="g-reflection-prompt">
              本日 <strong>{today.length}</strong> 件の粒が沈みました。
              {today.length > 0 && " Claude に短く振り返らせます。"}
            </p>
            <button className="g-reflection-btn" onClick={generate} disabled={today.length === 0}>
              <svg viewBox="0 0 14 14" width="11" height="11">
                <path d="M2 7 Q 7 1 12 7 Q 7 13 2 7 Z" fill="none" stroke="currentColor" strokeWidth="1.2" />
                <circle cx="7" cy="7" r="2.4" fill="currentColor" opacity="0.6" />
              </svg>
              {today.length === 0 ? "まず Claude に話してください" : "Claude に振り返らせる"}
            </button>
          </div>
        )}
        {loading && (
          <div className="g-reflection-loading">
            <div className="g-reflection-pulse"><span /><span /><span /></div>
            <div className="g-reflection-loading-text">雨を集めています…</div>
          </div>
        )}
        {summary && !loading && (
          <div className="g-reflection-result">
            <div className="g-reflection-text">{summary}</div>
            <div className="g-reflection-actions">
              <button className="g-reflection-redo" onClick={generate}>
                <svg viewBox="0 0 12 12" width="10" height="10">
                  <path d="M2 6 a4 4 0 1 0 1.5 -3 M2 2 V4 H4" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
                もう一度
              </button>
              <span className="g-reflection-meta">本日 {today.length} 件から生成</span>
            </div>
          </div>
        )}
      </div>
    </Section>
  );
}

function RoadmapSection({ userItems = [] }) {
  const phases = [
    { phase: "Q2 2026", title: "雨域の核を固める", progress: 0.72, status: "進行中", heat: 0.85 },
    { phase: "Q3 2026", title: "10人に届ける", progress: 0.18, status: "始動", heat: 0.6 },
    { phase: "Q4 2026", title: "本屋プロジェクト", progress: 0.04, status: "種", heat: 0.95 },
    { phase: "2027 +",   title: "長い小説の続き", progress: 0,    status: "保留", heat: 0.45 },
  ];
  return (
    <Section no="01" jp="ロードマップ" en="ROADMAP · The path of your gravity"
      action={<NTag db="Reflection" prop="roadmap" />}>
      <UserBlock items={userItems}>
        {userItems.map((w, i) => (
          <div key={i} className="g-user-row">
            <span className="g-user-time">{fmtTime(w.t)}</span>
            {w.props.phase && <span className="g-rm-status">{w.props.phase}</span>}
            <span className="g-user-text">{w.props.text}</span>
            {w.props.heat != null && <span className="g-user-heat">熱量 {Math.round(w.props.heat * 100)}</span>}
          </div>
        ))}
      </UserBlock>
      <div className="g-roadmap">
        {phases.map((r, i) => (
          <div key={i} className="g-rm-row">
            <div className="g-rm-spine">
              <span className={`g-rm-dot ${r.progress > 0.5 ? "on" : ""}`} style={{ background: `oklch(0.7 0.12 ${28 + i * 14})` }} />
              <span className="g-rm-line" />
            </div>
            <div className="g-rm-body">
              <div className="g-rm-meta">
                <span className="g-rm-phase">{r.phase}</span>
                <span className="g-rm-status">{r.status}</span>
                <span className="g-rm-heat">熱量 {Math.round(r.heat * 100)}</span>
              </div>
              <div className="g-rm-title">{r.title}</div>
              <div className="g-rm-bar">
                <span className="g-rm-fill" style={{ width: `${r.progress * 100}%` }} />
              </div>
              <div className="g-rm-progress">進捗 {Math.round(r.progress * 100)}%</div>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

function DreamsSection({ userItems = [] }) {
  const dreams = [
    { icon: "本", text: "京都の路地に小さな本屋を持つ", intensity: 0.92 },
    { icon: "書", text: "もう一度、長い小説を書き切る", intensity: 0.81 },
    { icon: "映", text: "雨の日に泣ける映画を撮る", intensity: 0.68 },
    { icon: "母", text: "母にゆっくり会いに行く", intensity: 0.74 },
    { icon: "空", text: "週に2回は何もしない時間を持つ", intensity: 0.55 },
    { icon: "信", text: "10年後の自分に手紙を書く", intensity: 0.62 },
    { icon: "旅", text: "知らない街で1ヶ月暮らす", intensity: 0.46 },
    { icon: "友", text: "古い友人と本気の喧嘩をする", intensity: 0.38 },
  ];
  return (
    <Section no="02" jp="夢" en="DREAMS · What I'd love"
      action={<NTag db="Reflection" prop="dream" />}>
      <UserBlock items={userItems}>
        <div className="g-dreams">
          {userItems.map((w, i) => (
            <div key={i} className="g-dream g-user-dream">
              <div className="g-dream-icon">夢</div>
              <div className="g-dream-content">
                <div className="g-dream-text">{w.props.text}</div>
                <div className="g-user-time">{fmtTime(w.t)}</div>
              </div>
              {w.props.intensity != null && (
                <div className="g-dream-pct">{Math.round(w.props.intensity * 100)}</div>
              )}
            </div>
          ))}
        </div>
      </UserBlock>
      <div className="g-dreams">
        {dreams.map((d, i) => (
          <div key={i} className="g-dream">
            <div className="g-dream-icon">{d.icon}</div>
            <div className="g-dream-content">
              <div className="g-dream-text">{d.text}</div>
              <div className="g-dream-bar">
                <span style={{ width: `${d.intensity * 100}%` }} />
              </div>
            </div>
            <div className="g-dream-pct">{Math.round(d.intensity * 100)}</div>
          </div>
        ))}
      </div>
    </Section>
  );
}

function WantTodoSection({ userItems = [] }) {
  const wantTodo = [
    { text: "古本市に行く", when: "週末", done: false },
    { text: "誰かに長い手紙を書く", when: "今月", done: false },
    { text: "雨音だけのプレイリストを作る", when: "今日", done: true },
    { text: "Notion APIの仕様を読み直す", when: "明日", done: false },
    { text: "10年後の自分に手紙", when: "いつか", done: false },
    { text: "京都に小旅行", when: "来月", done: false },
  ];
  return (
    <Section no="03" jp="やりたいこと" en="WANT TO DO · Things still calling"
      action={<NTag db="Reflection" prop="wishlist" />}>
      <UserBlock items={userItems}>
        <div className="g-wantlist">
          {userItems.map((w, i) => (
            <div key={i} className="g-want g-user-want">
              <span className="g-want-check" />
              <div className="g-want-text">{w.props.text}</div>
              <span className="g-user-time">{fmtTime(w.t)}</span>
            </div>
          ))}
        </div>
      </UserBlock>
      <div className="g-wantlist">
        {wantTodo.map((w, i) => (
          <div key={i} className={`g-want ${w.done ? "done" : ""}`}>
            <span className="g-want-check">
              {w.done && (
                <svg viewBox="0 0 10 10" width="11" height="11">
                  <path d="M2 5.5 L4 7.5 L8 3" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </span>
            <div className="g-want-text">{w.text}</div>
            <span className="g-want-when">{w.when}</span>
          </div>
        ))}
      </div>
    </Section>
  );
}

function SandLogSection({ userItems = [] }) {
  const initialGrains = [
    { time: "08:14", text: "今日の雨は、内側に降る方が強い気がする。", heat: 0.7 },
    { time: "09:42", text: "急いで決めない。砂が積もるのを待つ。", heat: 0.55 },
    { time: "11:08", text: "プロダクトより人。順番を間違えない。", heat: 0.82 },
    { time: "12:30", text: "昼食、ひとりで食べる。雨音だけで足りる。", heat: 0.40 },
  ];
  return (
    <Section no="04" jp="砂のログ" en="SAND LOG · Today's grains"
      action={<NTag db="Reflection" prop="grain" />}>
      <UserBlock items={userItems}>
        <div className="g-grains">
          {userItems.map((w, i) => (
            <div key={i} className="g-grain g-user-grain">
              <span className="g-grain-bar" style={{ "--h": `${(w.props.heat || 0.5) * 100}%` }} />
              <span className="g-grain-time">{fmtTime(w.t)}</span>
              <div className="g-grain-text">{w.props.text}</div>
            </div>
          ))}
        </div>
      </UserBlock>
      <div className="g-grains">
        {initialGrains.map((g, i) => (
          <div key={i} className="g-grain">
            <span className="g-grain-bar" style={{ "--h": `${g.heat * 100}%` }} />
            <span className="g-grain-time">{g.time}</span>
            <div className="g-grain-text">{g.text}</div>
          </div>
        ))}
        <div className="g-grain-hint">
          <span className="g-grain-hint-mark">↘</span>
          新しい一粒は右下の Claude に話して沈める
        </div>
      </div>
    </Section>
  );
}

// ─── Page ───────────────────────────────────────────────
function GravityPage() {
  const stats = window.useTodayStats();
  const writes = window.useLiveWrites();
  const [now] = useState(new Date());

  // Filter Reflection writes by type
  const refl = writes.filter((w) => w.db === "Reflection");
  const userRoadmap = refl.filter((w) => w.props?.type === "roadmap");
  const userDreams = refl.filter((w) => w.props?.type === "dream");
  const userWishlist = refl.filter((w) => w.props?.type === "wishlist");
  const userGrains = refl.filter((w) => w.props?.type === "grain");

  // Snapshot summary (live: count from writes if available, else sample)
  const totalDreams = 8 + userDreams.length;
  const heat = 62.4;
  const sandDepth = 11.3;

  return (
    <div className="gravity-page">
      <div className="g-bg" />
      <GravityRain />
      <div className="g-grain-tex" />

      <header className="g-topnav">
        <a href="./" className="g-back">
          <svg viewBox="0 0 16 16" width="14" height="14">
            <path d="M12 8 L4 8 M8 4 L4 8 L8 12" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>雨域へ戻る</span>
        </a>
        <div className="g-topnav-center">
          <span className="g-loc-tag">重力雨域</span>
          <span className="g-loc-sep">/</span>
          <span className="g-loc-sub">内側 · 夢 · 熱量</span>
        </div>
        <div className="g-sync-pill">
          <span className="g-sync-dot" />
          本日 <strong>{stats.Reflection}</strong> 件記録
        </div>
      </header>

      <main className="g-main">
        <div className="g-hero">
          <div className="g-hero-eyebrow">{now.toLocaleDateString("ja-JP", { month: "long", day: "numeric", weekday: "long" })}</div>
          <h1 className="g-hero-title">
            静かに、<br />
            <span className="g-hero-emph">密度の高い雨。</span>
          </h1>
          <p className="g-hero-sub">
            内側に降るものを、ここに沈めていきます。<br />
            右下のClaudeに話せば、Notionが勝手に積もります。
          </p>
          <div className="g-hero-readings">
            <div className="g-reading">
              <div className="g-reading-k">内部熱量</div>
              <div className="g-reading-v">{heat}<span className="g-reading-u">℃</span></div>
            </div>
            <div className="g-reading">
              <div className="g-reading-k">砂層</div>
              <div className="g-reading-v">{sandDepth}<span className="g-reading-u">cm</span></div>
            </div>
            <div className="g-reading">
              <div className="g-reading-k">夢の数</div>
              <div className="g-reading-v">{totalDreams}<span className="g-reading-u">個</span></div>
            </div>
          </div>
        </div>

        <DailyReflection writes={writes} />
        <RoadmapSection userItems={userRoadmap} />
        <DreamsSection userItems={userDreams} />
        <WantTodoSection userItems={userWishlist} />
        <SandLogSection userItems={userGrains} />

        <footer className="g-footer">
          <div className="g-footer-poem">
            「やる」より「やめる」のほうが価値が高い日もある。<br />
            今日は、何粒沈めましたか。
          </div>
        </footer>
      </main>

      <window.ClaudeFAB accent="warm" />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<GravityPage />);
