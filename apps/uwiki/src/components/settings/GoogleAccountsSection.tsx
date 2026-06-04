"use client"

import { useTransition } from "react"
import { removeGoogleAccount } from "@/actions/gmail"
import { UserPlus, Trash2, Mail } from "lucide-react"
import { ConfirmButton } from "@/components/ui/ConfirmButton"

const COLORS: Record<string, string> = {
  "fukuisho0603@gmail.com":  "#3a6fc9",
  "fukufukui0205@gmail.com": "#8b5cf6",
  "rainybrain.ch@gmail.com": "#14b8a6",
}

export function GoogleAccountsSection({ accounts }: { accounts: { email: string; useGmail: boolean; useCalendar: boolean }[] }) {
  const [pending, start] = useTransition()

  return (
    <div className="surface rounded-xl p-4 space-y-3">
      {accounts.length === 0 && (
        <p className="text-xs text-faint">アカウントが登録されていません</p>
      )}
      {accounts.map((a) => {
        const color = COLORS[a.email] ?? "var(--accent)"
        return (
          <div key={a.email} className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{a.email}</p>
              <p className="text-[10px] text-faint">
                {[a.useGmail && "Gmail", a.useCalendar && "Calendar"].filter(Boolean).join(" · ")}
              </p>
            </div>
            <ConfirmButton
              onConfirm={() => start(() => removeGoogleAccount(a.email))}
              disabled={pending}
              size="xs"
            />
          </div>
        )
      })}

      <a
        href="/api/google-add"
        className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg transition-opacity hover:opacity-80 w-full"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)", color: "var(--dim)" }}
      >
        <UserPlus size={12} />
        アカウントを追加
      </a>
    </div>
  )
}
