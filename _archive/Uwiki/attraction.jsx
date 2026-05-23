// 引力雨域 — Attraction / The way you appear, measured.
// Private page (PIN/hold gate). AI selfie scan, status data.
const { useState, useEffect, useRef } = React;

// ─── Gate: hold to enter ────────────────────────────────
function PrivacyGate({ onEnter }) {
  const [holding, setHolding] = useState(false);
  const [progress, setProgress] = useState(0);
  const rafRef = useRef();
  const startRef = useRef();
  const HOLD_MS = 1400;

  useEffect(() => {
    if (!holding) {
      cancelAnimationFrame(rafRef.current);
      const fade = setInterval(() => {
        setProgress((p) => {
          if (p <= 0) { clearInterval(fade); return 0; }
          return p - 0.04;
        });
      }, 16);
      return () => clearInterval(fade);
    }
    startRef.current = performance.now();
    const tick = () => {
      const dt = performance.now() - startRef.current;
      const p = Math.min(1, dt / HOLD_MS);
      setProgress(p);
      if (p >= 1) {
        setTimeout(onEnter, 200);
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [holding]);

  const C = 2 * Math.PI * 54;
  return (
    <div className="a-gate">
      <div className="a-gate-bg" />
      <div className="a-gate-mist" />
      <div className="a-gate-inner">
        <div className="a-gate-eyebrow">
          <svg viewBox="0 0 14 14" width="11" height="11">
            <rect x="3" y="6.5" width="8" height="6" rx="1" fill="none" stroke="currentColor" strokeWidth="1.2" />
            <path d="M4.5 6.5 V4.5 a2.5 2.5 0 0 1 5 0 V6.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
          </svg>
          PRIVATE · 引力雨域
        </div>
        <h1 className="a-gate-title">
          測定された自分を、<br />
          ここに開きます。
        </h1>
        <p className="a-gate-sub">
          客観データ・健康スコア・自撮りスキャン。<br />
          他者から見たあなたの像が残る場所です。
        </p>

        <button
          className={`a-gate-hold ${holding ? "active" : ""} ${progress >= 1 ? "complete" : ""}`}
          onMouseDown={() => setHolding(true)}
          onMouseUp={() => setHolding(false)}
          onMouseLeave={() => setHolding(false)}
          onTouchStart={(e) => { e.preventDefault(); setHolding(true); }}
          onTouchEnd={() => setHolding(false)}
          onTouchCancel={() => setHolding(false)}
        >
          <svg viewBox="0 0 120 120" width="120" height="120">
            <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(42,69,112,0.15)" strokeWidth="2" />
            <circle cx="60" cy="60" r="54" fill="none" stroke="#3a76d2" strokeWidth="2"
                    strokeDasharray={C} strokeDashoffset={C * (1 - progress)}
                    strokeLinecap="round" transform="rotate(-90 60 60)" />
            <circle cx="60" cy="60" r="36"
                    fill={progress > 0 ? `rgba(58,118,210,${0.08 + progress * 0.18})` : "rgba(58,118,210,0.06)"}
                    stroke="rgba(58,118,210,0.3)" strokeWidth="1" />
            <path d="M52 56 V52 a8 8 0 0 1 16 0 V56 M48 56 H72 V72 H48 z" fill="none" stroke="#2a4570" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="a-gate-hold-label">
            {progress >= 1 ? "開いています…" : holding ? "保持中…" : "押し続けて開く"}
          </span>
        </button>

        <div className="a-gate-foot">
          <a href="./" className="a-gate-back">← 雨域へ戻る</a>
          <span className="a-gate-sep">·</span>
          <span className="a-gate-hint">クリック+ホールド({(HOLD_MS / 1000).toFixed(1)}秒)</span>
        </div>
      </div>
    </div>
  );
}

// ─── Cool mist rain ─────────────────────────────────────
function AttractionRain() {
  const ref = useRef();
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext("2d");
    let raf, running = true;
    const drops = [];
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
      len: 4 + Math.random() * 10,
      speed: 1.5 + Math.random() * 2.5,
      wind: -0.3 + (Math.random() - 0.5) * 0.4,
      opacity: 0.18 + Math.random() * 0.30,
    });
    while (drops.length < 130) drops.push(spawn());
    const tick = () => {
      if (!running) return;
      const w = canvas.clientWidth, h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);
      ctx.lineCap = "round";
      for (const d of drops) {
        d.y += d.speed; d.x += d.wind;
        if (d.y > h) Object.assign(d, spawn());
        ctx.strokeStyle = `rgba(120,160,210,${d.opacity})`;
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x + d.wind * 1.6, d.y + d.len);
        ctx.stroke();
      }
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => { running = false; cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);
  return <canvas ref={ref} className="a-rain" />;
}

// ─── Sections ───────────────────────────────────────────
function Section({ no, jp, en, action, children }) {
  return (
    <section className="a-section">
      <header className="a-sechead">
        <div className="a-sechead-left">
          <span className="a-sechead-no">{no}</span>
          <div>
            <div className="a-sechead-jp">{jp}</div>
            <div className="a-sechead-en">{en}</div>
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
    <span className="a-ntag">
      <svg viewBox="0 0 10 10" width="9" height="9">
        <rect x="1" y="1" width="8" height="8" rx="1" fill="none" stroke="currentColor" strokeWidth="0.9" />
        <path d="M3.3 2.8 V7.2 M3.3 2.8 L6.7 7.2 M6.7 2.8 V7.2" stroke="currentColor" strokeWidth="0.9" fill="none" />
      </svg>
      <span>{db}<span className="a-ntag-prop">·{prop}</span></span>
    </span>
  );
}

function SelfieScan() {
  const [photo, setPhoto] = useState(() => {
    try { return JSON.parse(localStorage.getItem("uwiki-selfie-latest") || "null"); }
    catch { return null; }
  });
  const [scanning, setScanning] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [cloudOk, setCloudOk] = useState(null); // null=not attempted, true=uploaded, false=failed
  const fileRef = useRef();

  const handlePick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("画像ファイルを選んでください");
      return;
    }
    setUploading(true);
    setScanning(true);
    setCloudOk(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      const img = new Image();
      img.onload = async () => {
        const meta = {
          dataUrl,
          capturedAt: new Date().toISOString(),
          width: img.naturalWidth,
          height: img.naturalHeight,
          size: file.size,
          mimeType: file.type,
        };
        // Save locally first
        try { localStorage.setItem("uwiki-selfie-latest", JSON.stringify(meta)); } catch {}
        setPhoto(meta);

        // Optional: push to Supabase Storage if signed in
        const sb = window.getSupabase?.();
        if (sb) {
          try {
            const { data: { user } } = await sb.auth.getUser();
            if (user) {
              const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
              const path = `${user.id}/${Date.now()}.${ext}`;
              const { error } = await sb.storage.from("selfies").upload(path, file, {
                upsert: false, contentType: file.type,
              });
              setCloudOk(!error);
            }
          } catch (e) { setCloudOk(false); }
        }
        setUploading(false);
        setTimeout(() => setScanning(false), 1800);
      };
      img.onerror = () => { setUploading(false); setScanning(false); alert("画像を読み込めませんでした"); };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
    // Reset input so re-picking same file works
    e.target.value = "";
  };

  const removePhoto = () => {
    if (!confirm("この自撮りを削除しますか?")) return;
    localStorage.removeItem("uwiki-selfie-latest");
    setPhoto(null);
    setCloudOk(null);
  };

  // Display values
  const capturedText = photo
    ? new Date(photo.capturedAt).toLocaleString("ja-JP", {
        month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit"
      })
    : "未取得";
  const resText = photo ? `${photo.width} × ${photo.height}` : "—";
  const sizeText = photo ? `${(photo.size / 1024).toFixed(0)} KB` : "—";

  return (
    <Section no="01" jp="セルフスキャン" en="DAILY SELF-SCAN · 顔の今日"
      action={<NTag db="Status" prop="selfie" />}>
      <div className="a-scan">
        <div className={`a-scan-face ${scanning ? "on" : ""} ${photo ? "has-photo" : ""}`}>
          {photo && (
            <img className="a-scan-photo" src={photo.dataUrl} alt="自撮り" />
          )}
          <svg className="a-scan-mesh" viewBox="0 0 120 140" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
            <ellipse cx="60" cy="70" rx="34" ry="44" fill={photo ? "transparent" : "rgba(58,118,210,0.06)"}
                     stroke="rgba(42,69,112,0.3)" strokeWidth="0.6" strokeDasharray="2 3" />
            {[[48,60],[72,60],[60,78],[50,92],[70,92],[60,100],[42,70],[78,70],[60,50]].map(([x,y],i) => (
              <circle key={i} cx={x} cy={y} r="1.2" fill="rgba(50,80,120,0.5)" />
            ))}
            <line x1="60" y1="22" x2="60" y2="118" stroke="rgba(50,80,120,0.18)" strokeWidth="0.5" strokeDasharray="2 2" />
            <line x1="20" y1="70" x2="100" y2="70" stroke="rgba(50,80,120,0.18)" strokeWidth="0.5" strokeDasharray="2 2" />
          </svg>
          {scanning && <div className="a-scan-line" />}
          {photo && !scanning && (
            <button className="a-scan-remove" onClick={removePhoto} title="削除">
              <svg viewBox="0 0 14 14" width="11" height="11">
                <path d="M3 3 L11 11 M11 3 L3 11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>
        <div className="a-scan-info">
          <div className="a-scan-row">
            <span>CAPTURED</span><span>{capturedText}</span>
          </div>
          <div className="a-scan-row">
            <span>RESOLUTION</span><span>{resText}</span>
          </div>
          <div className="a-scan-row">
            <span>SIZE</span><span>{sizeText}</span>
          </div>
          <div className="a-scan-row">
            <span>CLOUD</span>
            <span className={cloudOk === true ? "ok-tag" : cloudOk === false ? "warn" : ""}>
              {cloudOk === true ? "保存済み" : cloudOk === false ? "未保存" : (photo ? "ローカルのみ" : "—")}
            </span>
          </div>
          <input
            ref={fileRef} type="file" accept="image/*" capture="user"
            style={{ display: "none" }} onChange={handlePick}
          />
          <button className="a-scan-cta" onClick={() => fileRef.current?.click()} disabled={uploading}>
            <svg viewBox="0 0 16 16" width="13" height="13">
              <rect x="2" y="4" width="12" height="9" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.3" />
              <circle cx="8" cy="8.5" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.3" />
              <path d="M6 4 L6.7 2.7 H9.3 L10 4" fill="none" stroke="currentColor" strokeWidth="1.3" />
            </svg>
            {uploading ? "解析中…" : photo ? "新しい1枚を取り込む" : "今日の1枚を取り込む"}
          </button>
        </div>
      </div>
    </Section>
  );
}

function AIAnalysis() {
  // Radar (puffiness)
  const regions = ["眼下", "頬", "顎", "額"];
  const values = [0.62, 0.48, 0.35, 0.42];
  const cx = 65, cy = 65, r = 46;
  const pts = values.map((v, i) => {
    const a = (Math.PI * 2 * i) / values.length - Math.PI / 2;
    return [cx + Math.cos(a) * r * v, cy + Math.sin(a) * r * v];
  });
  const ringPts = (f) => values.map((_, i) => {
    const a = (Math.PI * 2 * i) / values.length - Math.PI / 2;
    return [cx + Math.cos(a) * r * f, cy + Math.sin(a) * r * f];
  });
  const polyStr = (arr) => arr.map((p) => p.join(",")).join(" ");

  const skinDims = [
    { k: "ハリ", v: 0.72 }, { k: "潤い", v: 0.58 }, { k: "明るさ", v: 0.81 },
    { k: "毛穴", v: 0.66 }, { k: "均一性", v: 0.74 },
  ];

  return (
    <Section no="02" jp="AI評価" en="AI ANALYSIS · 三つの測定"
      action={<NTag db="Status" prop="ai_score" />}>
      <div className="a-ai-grid">
        {/* Puffiness */}
        <div className="a-ai-card">
          <div className="a-ai-head">
            <span className="a-ai-code">A1</span>
            <div>
              <div className="a-ai-jp">むくみ</div>
              <div className="a-ai-en">Puffiness</div>
            </div>
          </div>
          <div className="a-ai-body radar-body">
            <svg viewBox="0 0 130 130" width="130" height="130">
              {[0.33, 0.66, 1].map((f, i) => (
                <polygon key={i} points={polyStr(ringPts(f))} fill="none" stroke="rgba(40,70,110,0.15)" strokeWidth="0.6" />
              ))}
              {values.map((_, i) => {
                const a = (Math.PI * 2 * i) / values.length - Math.PI / 2;
                return <line key={i} x1={cx} y1={cy} x2={cx + Math.cos(a) * r} y2={cy + Math.sin(a) * r} stroke="rgba(40,70,110,0.15)" strokeWidth="0.6" />;
              })}
              <polygon points={polyStr(pts)} fill="rgba(58,118,210,0.22)" stroke="#3a76d2" strokeWidth="1.4" strokeLinejoin="round" />
              {pts.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="2.2" fill="#3a76d2" />)}
              {regions.map((label, i) => {
                const a = (Math.PI * 2 * i) / values.length - Math.PI / 2;
                return (
                  <text key={i} x={cx + Math.cos(a) * (r + 12)} y={cy + Math.sin(a) * (r + 12) + 3}
                        textAnchor="middle" fontSize="9.5" fill="#3a4860" fontFamily="Inter Tight">{label}</text>
                );
              })}
            </svg>
            <div className="a-ai-right">
              <div className="a-ai-val">2.4<span className="a-ai-of">/5</span></div>
              <div className="a-ai-dots">
                {[1,2,3,4,5].map((i) => <span key={i} className={`a-fdot ${i <= 2 ? "on" : ""}`} />)}
              </div>
              <div className="a-ai-delta">前日 -0.3</div>
            </div>
          </div>
          <div className="a-ai-verdict">眼下にやや滞留。塩分過多の傾向。</div>
        </div>

        {/* Weight */}
        <div className="a-ai-card">
          <div className="a-ai-head">
            <span className="a-ai-code">A2</span>
            <div>
              <div className="a-ai-jp">体重バランス</div>
              <div className="a-ai-en">Weight Balance</div>
            </div>
          </div>
          <div className="a-ai-body wb-body">
            <div className="wb-numbers">
              <div className="wb-cell">
                <div className="wb-k">CURRENT</div>
                <div className="wb-v">68.4<span className="wb-u">kg</span></div>
              </div>
              <div className="wb-cell">
                <div className="wb-k">OPTIMAL</div>
                <div className="wb-v opt">67.0<span className="wb-u">kg</span></div>
              </div>
              <div className="wb-cell">
                <div className="wb-k">乖離</div>
                <div className="wb-v warn">+1.4<span className="wb-u">kg</span></div>
              </div>
            </div>
            <div className="wb-scale">
              <div className="wb-scale-zone" />
              {[-3,-2,-1,0,1,2,3].map((t, i) => (
                <div key={t} className="wb-tick" style={{ left: `${((t + 3) / 6) * 100}%` }}>
                  <span className="wb-tick-m" />
                  <span className="wb-tick-l">{t > 0 ? "+" : ""}{t}</span>
                </div>
              ))}
              <div className="wb-marker" style={{ left: `${((1.4 + 3) / 6) * 100}%` }}>
                <span className="wb-m-dot" />
                <span className="wb-m-l">YOU</span>
              </div>
            </div>
          </div>
          <div className="a-ai-verdict">基礎代謝範囲内。漸減期。</div>
        </div>

        {/* Skin */}
        <div className="a-ai-card a-ai-card-wide">
          <div className="a-ai-head">
            <span className="a-ai-code">A3</span>
            <div>
              <div className="a-ai-jp">肌の活力</div>
              <div className="a-ai-en">Skin Vitality</div>
            </div>
          </div>
          <div className="a-ai-body sv-body">
            <div className="sv-level">
              <div className="sv-k">SKIN LV</div>
              <div className="sv-v">7</div>
              <div className="a-ai-dots">
                {[1,2,3,4,5].map((i) => <span key={i} className={`a-fdot ${i <= 4 ? "on" : ""}`} />)}
              </div>
            </div>
            <div className="sv-dims">
              {skinDims.map((d) => (
                <div key={d.k} className="sv-dim">
                  <div className="sv-dim-head">
                    <span>{d.k}</span>
                    <span className="sv-dim-v">{Math.round(d.v * 100)}</span>
                  </div>
                  <div className="sv-dim-track"><span style={{ width: `${d.v * 100}%` }} /></div>
                </div>
              ))}
            </div>
          </div>
          <div className="a-ai-verdict">潤いが低下傾向。睡眠5h以下が3日連続。</div>
        </div>
      </div>
    </Section>
  );
}

function StatusDashboard() {
  const stats = [
    { k: "健康スコア", v: 78,   u: "/100", pct: 78, delta: "+2",   color: "#3a76d2" },
    { k: "睡眠負債",   v: 4.2,  u: "h",    pct: 70, delta: "+1.2", color: "#c46a3a" },
    { k: "貯金額",     v: "¥3.42M", u: "", pct: 62, delta: "+0.4%", color: "#3a92a8" },
    { k: "可処分エネ", v: 41,   u: "%",   pct: 41, delta: "-8",   color: "#b86a3a" },
    { k: "他者好感度", v: 6.2,  u: "/10", pct: 62, delta: "±0",   color: "#5a82b8" },
    { k: "活動半径",   v: 8.4,  u: "km",  pct: 28, delta: "-1.1", color: "#7a7e9a" },
  ];
  const trend30 = [62, 64, 60, 65, 68, 66, 70, 72, 70, 73, 75, 73, 78, 76, 78];

  return (
    <Section no="03" jp="同期ダッシュボード" en="NOTION DASHBOARD · Status DB の今日"
      action={<NTag db="Status" prop="*" />}>
      <div className="a-trend">
        <div className="a-trend-head">
          <div>
            <div className="a-trend-k">健康スコア / 30日トレンド</div>
            <div className="a-trend-v">78<span className="a-trend-u">/100</span></div>
          </div>
          <div className="a-trend-meta">
            <span className="up">+16 / 30日</span>
            <span>62 → 78</span>
          </div>
        </div>
        <svg viewBox="0 0 700 110" width="100%" height="110" preserveAspectRatio="none">
          <defs>
            <linearGradient id="trendG" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3a76d2" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#3a76d2" stopOpacity="0" />
            </linearGradient>
          </defs>
          {(() => {
            const max = Math.max(...trend30), min = Math.min(...trend30);
            const W = 700, H = 110;
            const pts = trend30.map((v, i) => [
              (i / (trend30.length - 1)) * W,
              H - ((v - min) / (max - min)) * (H - 20) - 10
            ]);
            const path = pts.map((p, i) => (i === 0 ? "M" : "L") + p.join(" ")).join(" ");
            const area = path + ` L ${W} ${H} L 0 ${H} Z`;
            return (
              <>
                <path d={area} fill="url(#trendG)" />
                <path d={path} fill="none" stroke="#3a76d2" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="3.5" fill="#3a76d2" />
              </>
            );
          })()}
        </svg>
      </div>
      <div className="a-statgrid">
        {stats.map((s) => (
          <div key={s.k} className="a-stat">
            <div className="a-stat-k">{s.k}</div>
            <div className="a-stat-v">{s.v}<span className="a-stat-u">{s.u}</span></div>
            <div className="a-stat-bar"><span style={{ width: `${s.pct}%`, background: s.color }} /></div>
            <div className="a-stat-delta">{s.delta}</div>
          </div>
        ))}
      </div>
    </Section>
  );
}

function EnvironmentLog() {
  return (
    <Section no="04" jp="環境ログ" en="ENVIRONMENT · 今日の周囲"
      action={<NTag db="Environment" prop="weather" />}>
      <div className="a-env">
        <div className="a-env-row">
          <span className="a-env-k">位置</span>
          <span className="a-env-v">京都 · 左京区</span>
        </div>
        <div className="a-env-row">
          <span className="a-env-k">天気</span>
          <span className="a-env-v">本降りの雨 · 18°C</span>
        </div>
        <div className="a-env-row">
          <span className="a-env-k">湿度</span>
          <span className="a-env-v">87%</span>
        </div>
        <div className="a-env-row">
          <span className="a-env-k">雨域への反映</span>
          <span className="a-env-v ok">●●●● 強</span>
        </div>
      </div>
    </Section>
  );
}

// ─── Page ───────────────────────────────────────────────
function AttractionPage() {
  const [unlocked, setUnlocked] = useState(false);
  const stats = window.useTodayStats();
  const [now] = useState(new Date());

  if (!unlocked) return <PrivacyGate onEnter={() => setUnlocked(true)} />;

  return (
    <div className="attraction-page">
      <div className="a-bg" />
      <AttractionRain />
      <div className="a-grid-tex" />

      <header className="a-topnav">
        <a href="./" className="a-back">
          <svg viewBox="0 0 16 16" width="14" height="14">
            <path d="M12 8 L4 8 M8 4 L4 8 L8 12" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>雨域へ戻る</span>
        </a>
        <div className="a-topnav-center">
          <span className="a-loc-tag">引力雨域</span>
          <span className="a-loc-sep">/</span>
          <span className="a-loc-sub">PRIVATE · 客観 · 測定</span>
        </div>
        <button className="a-lock-pill" onClick={() => setUnlocked(false)} title="ロックする">
          <svg viewBox="0 0 14 14" width="11" height="11">
            <rect x="3" y="6.5" width="8" height="6" rx="1" fill="none" stroke="currentColor" strokeWidth="1.2" />
            <path d="M4.5 6.5 V4.5 a2.5 2.5 0 0 1 5 0 V6.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
          </svg>
          ロック
        </button>
      </header>

      <main className="a-main">
        <div className="a-hero">
          <div className="a-hero-eyebrow">{now.toLocaleDateString("ja-JP", { month: "long", day: "numeric", weekday: "long" })}</div>
          <h1 className="a-hero-title">
            測定。<br />
            <span className="a-hero-emph">事実だけが残る。</span>
          </h1>
          <p className="a-hero-sub">
            外側から見たあなたを、AIが冷静に図ります。<br />
            Notionの Status DB と Environment DB に蓄積されています。
          </p>
          <div className="a-hero-readings">
            <div className="a-reading">
              <div className="a-reading-k">引力スコア</div>
              <div className="a-reading-v">70.4<span className="a-reading-u">/100</span></div>
            </div>
            <div className="a-reading">
              <div className="a-reading-k">本日同期</div>
              <div className="a-reading-v">{stats.Status + stats.Environment}<span className="a-reading-u">件</span></div>
            </div>
            <div className="a-reading">
              <div className="a-reading-k">最終測定</div>
              <div className="a-reading-v">12<span className="a-reading-u">秒前</span></div>
            </div>
          </div>
        </div>

        <SelfieScan />
        <AIAnalysis />
        <StatusDashboard />
        <EnvironmentLog />

        <footer className="a-footer">
          自己評価を入れる隙はない。<br />
          測定値だけが、明日のあなたの設計図になる。
        </footer>
      </main>

      <window.ClaudeFAB accent="cool" />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<AttractionPage />);
