"use client"

import { useState, useTransition } from "react"
import { saveCity } from "@/actions/settings"
import { MapPin, Check, AlertCircle, Loader2 } from "lucide-react"

export function CityForm({ currentCity }: { currentCity: string | null }) {
  const [city, setCity] = useState(currentCity ?? "")
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null)
  const [pending, startTransition] = useTransition()

  const submit = () => {
    setStatus(null)
    startTransition(async () => {
      const result = await saveCity(city)
      if (result.ok) {
        setStatus({ ok: true, message: `「${result.name}」を設定しました` })
        setCity(result.name ?? city)
      } else {
        setStatus({ ok: false, message: result.error ?? "エラーが発生しました" })
      }
    })
  }

  return (
    <div className="surface rounded-xl p-4">
      <label className="text-xs text-dim mb-2 block flex items-center gap-1.5">
        <MapPin size={11} /> 都市名（英語または日本語）
      </label>
      <div className="flex gap-2">
        <input
          className="input-field flex-1"
          placeholder="例: Tokyo / 東京 / Osaka"
          value={city}
          onChange={(e) => { setCity(e.target.value); setStatus(null) }}
          onKeyDown={(e) => { if (e.key === "Enter") submit() }}
        />
        <button
          className="btn-primary shrink-0"
          onClick={submit}
          disabled={pending || !city.trim()}
        >
          {pending ? <Loader2 size={14} className="animate-spin" /> : "設定"}
        </button>
      </div>

      {status && (
        <div
          className="flex items-center gap-2 mt-3 text-xs animate-fade-in-fast"
          style={{ color: status.ok ? "var(--green)" : "var(--red)" }}
        >
          {status.ok
            ? <Check size={13} />
            : <AlertCircle size={13} />
          }
          {status.message}
        </div>
      )}

      <p className="text-[10px] text-faint mt-3">
        Geocoding により座標を解決 → Open-Meteo で30分ごとに天気取得
      </p>
    </div>
  )
}
