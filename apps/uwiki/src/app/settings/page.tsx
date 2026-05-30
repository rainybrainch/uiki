import { getSettings } from "@/actions/settings"
import { CityForm } from "@/components/settings/CityForm"
import { PomojikanForm } from "@/components/settings/PomojikanForm"
import { ApiKeySection } from "@/components/settings/ApiKeySection"
import { getWeatherFromSettings } from "@/lib/weather"
import { Settings2, CloudRain, Thermometer, MapPin, Timer, Key } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function SettingsPage() {
  const settings = await getSettings()
  const weather = settings ? await getWeatherFromSettings(settings) : null

  return (
    <div className="page-container max-w-xl">
      <div className="animate-fade-in mb-10">
        <div className="flex items-center gap-3">
          <Settings2 size={18} strokeWidth={1.5} style={{ color: "var(--accent)" }} />
          <h1 className="text-2xl font-serif font-light tracking-wide">設定</h1>
        </div>
      </div>

      <div className="space-y-8">

        {/* 天気連動 */}
        <section className="animate-fade-in delay-100">
          <p className="section-label flex items-center gap-2"><CloudRain size={11} /> 天気連動</p>
          <p className="text-xs text-dim mb-4">都市名を設定すると実際の天気に合わせて雨が変化します。</p>
          <CityForm currentCity={settings?.city ?? null} />

          {weather && (
            <div className="surface rounded-xl p-4 mt-3 animate-fade-in-fast">
              <p className="text-xs text-dim mb-3 flex items-center gap-1.5">
                <MapPin size={11} /> {weather.city} の現在の天気
              </p>
              <div className="flex items-center gap-6 flex-wrap">
                <div className="flex items-center gap-2">
                  <CloudRain size={18} style={{ color: "var(--accent)" }} />
                  <div>
                    <p className="text-base font-serif">{weather.description}</p>
                    <p className="text-xs text-dim">{weather.precipitation} mm/h</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <Thermometer size={14} className="text-dim" />
                  <p className="text-sm font-mono">{weather.temperature}°C</p>
                </div>
                <div>
                  <p className="text-xs text-dim mb-1">雨強度</p>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1.5 rounded-full" style={{ background: "var(--faint)" }}>
                      <div className="h-full rounded-full" style={{ width: `${weather.rainIntensity * 100}%`, background: "var(--accent)" }} />
                    </div>
                    <span className="text-xs font-mono text-dim">{Math.round(weather.rainIntensity * 100)}%</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        <hr className="divider" />

        {/* ぽもじかん連携 */}
        <section className="animate-fade-in delay-150">
          <p className="section-label flex items-center gap-2"><Timer size={11} /> ぽもじかん連携</p>
          <p className="text-xs text-dim mb-4">
            ぽもじかんと雨域を接続します。タスクからタイマーを起動できるようになります。
          </p>
          <PomojikanForm currentUrl={settings?.pomojikanUrl ?? null} active={settings?.pomojikanActive ?? false} />
        </section>

        <hr className="divider" />

        {/* 外部API */}
        <section className="animate-fade-in delay-200">
          <p className="section-label flex items-center gap-2"><Key size={11} /> 外部API連携</p>
          <p className="text-xs text-dim mb-4">
            他のサービスから雨域のタスクを読み書きするためのAPIキーです。
            マネぼう・UIKI・ぽもじかん等との連携に使います。
          </p>
          <ApiKeySection currentKey={settings?.apiKey ?? null} />
        </section>

      </div>
    </div>
  )
}
