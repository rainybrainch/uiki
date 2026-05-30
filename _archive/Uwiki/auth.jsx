// Uwiki — Supabase auth & cloud storage.
// Loads the Supabase JS SDK from CDN; falls back gracefully if no config.
//
// Exports to window:
//   - getSupabase()       — returns the supabase client or null
//   - useSession()        — React hook: { session, user, profile, loading }
//   - AuthSheet({ onClose }) — login/signup modal component
//   - AuthPill()          — small pill button that opens AuthSheet (or shows avatar)
//   - cloudPushWrites(stamped)   — mirror writes to Supabase if signed in
//   - cloudPushChatMsg(role,text,writes) — mirror chat to Supabase
//   - cloudPullWrites()   — pull writes from Supabase into localStorage on login

(function() {
  const { useState, useEffect, useRef } = React;

  // ─── Supabase client (singleton) ────────────────────────────────
  let _sb = null;
  let _initPromise = null;

  function getSupabase() {
    if (_sb) return _sb;
    const cfg = window.UWIKI_CONFIG || {};
    if (!cfg.supabaseUrl || !cfg.supabaseAnonKey) return null;
    if (!window.supabase || !window.supabase.createClient) return null;
    _sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    });
    return _sb;
  }

  // ─── Cloud sync helpers ─────────────────────────────────────────
  async function cloudPushWrites(stamped) {
    const sb = getSupabase();
    if (!sb) return { ok: false, reason: "no-supabase" };
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return { ok: false, reason: "no-session" };

    const rows = stamped.map((w) => ({
      user_id: user.id,
      db: w.db,
      props: w.props,
      t: new Date(w.t).toISOString(),
    }));
    const { error } = await sb.from("writes").insert(rows);
    return error ? { ok: false, reason: error.message } : { ok: true };
  }

  async function cloudPushChatMsg(role, text, writes) {
    const sb = getSupabase();
    if (!sb) return;
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return;
    await sb.from("chat_messages").insert([{
      user_id: user.id,
      role, text,
      writes: writes || null,
    }]);
  }

  async function cloudPullWrites() {
    const sb = getSupabase();
    if (!sb) return null;
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return null;
    const { data, error } = await sb.from("writes")
      .select("db, props, t").order("t", { ascending: false }).limit(500);
    if (error) return null;
    return data.map((r) => ({ db: r.db, props: r.props, t: new Date(r.t).getTime() }));
  }

  async function cloudPullChat() {
    const sb = getSupabase();
    if (!sb) return null;
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return null;
    const { data, error } = await sb.from("chat_messages")
      .select("role, text, writes, t").order("t", { ascending: true }).limit(100);
    if (error) return null;
    return data.map((r) => ({ role: r.role, text: r.text, writes: r.writes || [] }));
  }

  // Merge cloud → localStorage. Cloud is canonical for items the user has.
  async function mergeFromCloud() {
    const cloudWrites = await cloudPullWrites();
    if (cloudWrites) {
      // Use cloud as the source of truth on login.
      localStorage.setItem("uwiki-writes", JSON.stringify(cloudWrites));
      window.dispatchEvent(new CustomEvent("uwiki-writes-changed", { detail: cloudWrites }));
    }
    const cloudChat = await cloudPullChat();
    if (cloudChat && cloudChat.length > 0) {
      localStorage.setItem("uwiki-chat", JSON.stringify(cloudChat));
      window.dispatchEvent(new CustomEvent("uwiki-chat-changed", { detail: cloudChat }));
    }
  }

  // ─── Session hook ───────────────────────────────────────────────
  function useSession() {
    const [state, setState] = useState({ session: null, user: null, profile: null, loading: true });

    useEffect(() => {
      const sb = getSupabase();
      if (!sb) { setState({ session: null, user: null, profile: null, loading: false }); return; }

      let mounted = true;
      const loadProfile = async (user) => {
        if (!user) return null;
        const { data } = await sb.from("profiles").select("username, email").eq("user_id", user.id).maybeSingle();
        return data || null;
      };

      sb.auth.getSession().then(async ({ data: { session } }) => {
        if (!mounted) return;
        const profile = session ? await loadProfile(session.user) : null;
        setState({ session, user: session?.user || null, profile, loading: false });
      });

      const { data: { subscription } } = sb.auth.onAuthStateChange(async (event, session) => {
        if (!mounted) return;
        const profile = session ? await loadProfile(session.user) : null;
        setState({ session, user: session?.user || null, profile, loading: false });
        if (event === "SIGNED_IN") {
          mergeFromCloud().catch(() => {});
        }
      });

      return () => { mounted = false; subscription?.unsubscribe(); };
    }, []);

    return state;
  }

  // ─── AuthSheet — sign in / sign up modal ────────────────────────
  function AuthSheet({ onClose, defaultTab = "signin" }) {
    const [tab, setTab] = useState(defaultTab);
    const [usernameMode, setUsernameMode] = useState(false); // signin: email vs username
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState(null);

    // Form state (shared)
    const [identifier, setIdentifier] = useState(""); // email OR username
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const sb = getSupabase();

    if (!sb) {
      return (
        <div className="uw-overlay" onClick={(e) => e.target.classList.contains("uw-overlay") && onClose()}>
          <div className="uw-setup">
            <button className="uw-sheet-close" onClick={onClose}>
              <svg viewBox="0 0 14 14" width="12" height="12">
                <path d="M3 3 L11 11 M11 3 L3 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
            <h2 className="uw-setup-title">Cloud 未設定</h2>
            <p className="uw-setup-sub">
              ログイン機能を有効化するには、雨域の管理者が <code>config.js</code> に Supabase の URL と Anon Key を設定する必要があります。<br />
              手順は <a href="DEPLOY.md" target="_blank" rel="noopener">DEPLOY.md</a> を参照してください。
            </p>
            <p className="uw-setup-sub" style={{ marginTop: "16px", opacity: 0.7 }}>
              設定なしでもローカル(このブラウザ)で雨域は使えます。
            </p>
          </div>
        </div>
      );
    }

    async function doSignIn() {
      setBusy(true); setMsg(null);
      try {
        let signinEmail = identifier.trim();
        if (usernameMode) {
          const { data, error } = await sb.rpc("email_for_username", { uname: identifier.trim() });
          if (error) throw new Error(error.message);
          if (!data) throw new Error("ユーザー名が見つかりません");
          signinEmail = data;
        }
        const { error } = await sb.auth.signInWithPassword({ email: signinEmail, password });
        if (error) throw error;
        setMsg({ ok: true, text: "サインインしました" });
        setTimeout(onClose, 600);
      } catch (e) {
        setMsg({ ok: false, text: e.message || "サインインに失敗しました" });
      } finally { setBusy(false); }
    }

    async function doSignUp() {
      setBusy(true); setMsg(null);
      try {
        const uname = username.trim();
        const mail = email.trim();
        if (uname.length < 3 || uname.length > 30) throw new Error("ユーザー名は3〜30文字");
        if (!/^[a-zA-Z0-9_\-.]+$/.test(uname)) throw new Error("ユーザー名は英数字 _ - . のみ");
        if (password.length < 8) throw new Error("パスワードは8文字以上");

        const { data: signUpData, error: signUpError } = await sb.auth.signUp({
          email: mail, password,
          options: { data: { username: uname } },
        });
        if (signUpError) throw signUpError;

        // Insert profile row (RLS allows since auth.uid = user_id)
        if (signUpData.user) {
          const { error: pErr } = await sb.from("profiles").insert([{
            user_id: signUpData.user.id, username: uname, email: mail,
          }]);
          if (pErr) {
            if (pErr.code === "23505") throw new Error("そのユーザー名は既に使われています");
            throw pErr;
          }
        }

        if (signUpData.session) {
          setMsg({ ok: true, text: `ようこそ、@${uname} さん。` });
          setTimeout(onClose, 800);
        } else {
          setMsg({ ok: true, text: `確認メールを ${mail} に送りました。リンクをクリックしてください。` });
        }
      } catch (e) {
        setMsg({ ok: false, text: e.message || "登録に失敗しました" });
      } finally { setBusy(false); }
    }

    async function doMagicLink() {
      const mail = (usernameMode ? null : identifier.trim()) || email.trim();
      if (!mail || !mail.includes("@")) {
        setMsg({ ok: false, text: "メールアドレスを入力してください" });
        return;
      }
      setBusy(true); setMsg(null);
      try {
        const { error } = await sb.auth.signInWithOtp({
          email: mail,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        setMsg({ ok: true, text: `${mail} にログインリンクを送りました。` });
      } catch (e) {
        setMsg({ ok: false, text: e.message });
      } finally { setBusy(false); }
    }

    return (
      <div className="uw-overlay" onClick={(e) => e.target.classList.contains("uw-overlay") && onClose()}>
        <div className="auth-sheet">
          <button className="uw-sheet-close" onClick={onClose}>
            <svg viewBox="0 0 14 14" width="12" height="12">
              <path d="M3 3 L11 11 M11 3 L3 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>

          <div className="auth-header">
            <div className="auth-brand">
              <div className="auth-kanji">雨域</div>
              <div className="auth-en">U W I K I</div>
            </div>
            <div className="auth-tabs">
              <button className={tab === "signin" ? "active" : ""} onClick={() => { setTab("signin"); setMsg(null); }}>
                サインイン
              </button>
              <button className={tab === "signup" ? "active" : ""} onClick={() => { setTab("signup"); setMsg(null); }}>
                新規登録
              </button>
            </div>
          </div>

          <div className="auth-body">
            {tab === "signin" ? (
              <>
                <div className="auth-mode-toggle">
                  <button className={!usernameMode ? "on" : ""} onClick={() => setUsernameMode(false)}>メール</button>
                  <button className={usernameMode ? "on" : ""} onClick={() => setUsernameMode(true)}>ユーザー名</button>
                </div>
                <label className="auth-field">
                  <span>{usernameMode ? "ユーザー名" : "メールアドレス"}</span>
                  <input
                    type={usernameMode ? "text" : "email"}
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder={usernameMode ? "kenta" : "you@example.com"}
                    autoComplete={usernameMode ? "username" : "email"}
                  />
                </label>
                <label className="auth-field">
                  <span>パスワード</span>
                  <input
                    type="password" value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                </label>
                <button className="auth-primary" disabled={busy || !identifier || !password} onClick={doSignIn}>
                  {busy ? "..." : "サインイン"}
                </button>
                {!usernameMode && (
                  <>
                    <div className="auth-divider"><span>または</span></div>
                    <button className="auth-ghost" disabled={busy || !identifier} onClick={doMagicLink}>
                      メールで魔法のリンクを送る
                    </button>
                  </>
                )}
              </>
            ) : (
              <>
                <label className="auth-field">
                  <span>ユーザー名 <small>(英数字 _ - .)</small></span>
                  <input
                    type="text" value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="kenta" autoComplete="username"
                    minLength={3} maxLength={30}
                  />
                </label>
                <label className="auth-field">
                  <span>メールアドレス</span>
                  <input
                    type="email" value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com" autoComplete="email"
                  />
                </label>
                <label className="auth-field">
                  <span>パスワード <small>(8文字以上)</small></span>
                  <input
                    type="password" value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password" minLength={8}
                  />
                </label>
                <button className="auth-primary" disabled={busy || !username || !email || !password} onClick={doSignUp}>
                  {busy ? "..." : "新規登録"}
                </button>
                <p className="auth-note">
                  登録すると、話したことは雨域クラウドに保存され、別の端末でも同じ会話を引き継げます。
                </p>
              </>
            )}

            {msg && (
              <div className={`auth-msg ${msg.ok ? "ok" : "err"}`}>{msg.text}</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─── AuthPill — topbar widget ───────────────────────────────────
  function AuthPill() {
    const { user, profile, loading } = useSession();
    const [open, setOpen] = useState(false);
    const [menu, setMenu] = useState(false);
    const menuRef = useRef();

    useEffect(() => {
      if (!menu) return;
      const onDoc = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenu(false); };
      document.addEventListener("click", onDoc);
      return () => document.removeEventListener("click", onDoc);
    }, [menu]);

    const cfg = window.UWIKI_CONFIG || {};
    const cloudAvailable = !!(cfg.supabaseUrl && cfg.supabaseAnonKey);

    if (loading) return <div className="auth-pill loading">…</div>;

    if (!user) {
      return (
        <>
          <button className={`auth-pill ${cloudAvailable ? "" : "off"}`} onClick={() => setOpen(true)}>
            <span className="auth-pill-dot" />
            {cloudAvailable ? "ログイン" : "ローカルのみ"}
          </button>
          {open && <AuthSheet onClose={() => setOpen(false)} />}
        </>
      );
    }

    const displayName = profile?.username || user.email?.split("@")[0] || "user";
    const initial = displayName.slice(0, 2).toUpperCase();

    return (
      <div className="auth-pill-wrap" ref={menuRef}>
        <button className="auth-pill signed" onClick={() => setMenu(!menu)}>
          <span className="auth-avatar">{initial}</span>
          <span className="auth-pill-name">@{displayName}</span>
        </button>
        {menu && (
          <div className="auth-menu">
            <div className="auth-menu-head">
              <div className="auth-menu-name">@{displayName}</div>
              <div className="auth-menu-email">{user.email}</div>
            </div>
            <div className="auth-menu-divider" />
            <div className="auth-menu-status">
              <span className="auth-status-dot" />
              Cloud 同期中
            </div>
            <button className="auth-menu-item" onClick={async () => {
              await getSupabase().auth.signOut();
              setMenu(false);
            }}>
              <svg viewBox="0 0 14 14" width="11" height="11">
                <path d="M3 7 H10 M7 4 L10 7 L7 10" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M3 3 V11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
              サインアウト
            </button>
          </div>
        )}
      </div>
    );
  }

  Object.assign(window, {
    getSupabase, useSession, AuthSheet, AuthPill,
    cloudPushWrites, cloudPushChatMsg, cloudPullWrites, mergeFromCloud,
  });
})();
