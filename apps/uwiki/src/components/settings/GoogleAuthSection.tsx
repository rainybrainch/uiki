"use client"

import { signIn, signOut, useSession } from "next-auth/react"
import { Chrome } from "lucide-react"

export function GoogleAuthSection() {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return <div style={{ height: 48, background: "var(--faint)", borderRadius: "0.5rem", opacity: 0.5 }} />
  }

  if (session) {
    return (
      <div className="surface rounded-xl p-4">
        <div className="flex items-center gap-3 mb-3">
          <Chrome size={16} style={{ color: "var(--green)" }} />
          <span className="text-sm font-medium" style={{ color: "var(--green)" }}>Google 連携済み</span>
        </div>
        <div className="flex items-center gap-3 mb-4">
          {session.user?.image && (
            <img src={session.user.image} alt="" style={{ width: 36, height: 36, borderRadius: "50%" }} />
          )}
          <div>
            <p className="text-sm font-medium">{session.user?.name}</p>
            <p className="text-xs text-dim">{session.user?.email}</p>
          </div>
        </div>
        <div className="text-xs text-dim mb-3">
          連携中: Google Calendar（読み取り） · Gmail（読み取り）
        </div>
        <button
          onClick={() => signOut()}
          className="text-xs px-3 py-1.5 rounded-lg transition-colors hover:bg-[var(--faint)]"
          style={{ border: "1px solid var(--border)", color: "var(--dim)" }}
        >
          連携を解除する
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => signIn("google")}
      className="w-full flex items-center justify-center gap-3 p-4 rounded-xl transition-all hover:opacity-90 active:scale-95"
      style={{
        background: "rgba(255,255,255,0.06)",
        border: "1px solid var(--border)",
      }}
    >
      <svg viewBox="0 0 24 24" width="20" height="20">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
      <span className="text-sm font-medium">Google でログイン</span>
      <span className="text-xs text-dim">（Calendar + Gmail 連携）</span>
    </button>
  )
}
