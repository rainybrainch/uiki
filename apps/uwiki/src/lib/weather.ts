// Open-Meteo ── 無料・APIキー不要
// Geocoding: https://geocoding-api.open-meteo.com
// Weather:   https://api.open-meteo.com

export type WeatherData = {
  city: string
  precipitation: number   // mm/h（降水量）
  weatherCode: number     // WMO weather code
  temperature: number     // °C
  description: string
  rainIntensity: number   // 0.0〜1.0（RainCanvas用）
  isRaining: boolean
}

/** WMO weather code → 雨域 intensity マッピング */
function codeToIntensity(code: number, precip: number): number {
  // 0=快晴, 1-3=曇り, 51-67=霧雨〜雨, 71-77=雪, 80-82=にわか雨, 95-99=雷雨
  if (code === 0) return 0.05          // 快晴 → 霧のような最低限
  if (code <= 3) return 0.10           // 曇り
  if (code <= 48) return 0.12          // 霧
  if (code <= 57) return 0.25 + precip * 0.05   // 霧雨
  if (code <= 67) return 0.4 + precip * 0.04    // 雨
  if (code <= 77) return 0.2           // 雪
  if (code <= 82) return 0.5 + precip * 0.05    // にわか雨
  return Math.min(0.9, 0.65 + precip * 0.03)    // 雷雨
}

function codeToDescription(code: number): string {
  if (code === 0) return "快晴"
  if (code <= 1) return "晴れ"
  if (code <= 3) return "曇り"
  if (code <= 48) return "霧"
  if (code <= 57) return "霧雨"
  if (code <= 65) return "雨"
  if (code <= 67) return "みぞれ"
  if (code <= 77) return "雪"
  if (code <= 82) return "にわか雨"
  if (code <= 99) return "雷雨"
  return "—"
}

/** 都市名 → 緯度経度 (Open-Meteo Geocoding) */
export async function geocodeCity(city: string): Promise<{ lat: number; lon: number; name: string } | null> {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=ja&format=json`
  const res = await fetch(url, { next: { revalidate: 86400 } })
  if (!res.ok) return null
  const data = await res.json()
  const r = data.results?.[0]
  if (!r) return null
  return { lat: r.latitude, lon: r.longitude, name: r.name }
}

/** 緯度経度 → 現在の天気 (Open-Meteo Weather) */
export async function fetchWeather(lat: number, lon: number, city: string): Promise<WeatherData> {
  const url = [
    `https://api.open-meteo.com/v1/forecast`,
    `?latitude=${lat}&longitude=${lon}`,
    `&current=temperature_2m,precipitation,weather_code`,
    `&timezone=auto`,
  ].join("")

  const res = await fetch(url, { next: { revalidate: 1800 } }) // 30分キャッシュ
  if (!res.ok) throw new Error("Weather API failed")

  const data = await res.json()
  const cur = data.current

  const code  = cur.weather_code as number
  const precip = cur.precipitation as number
  const temp  = cur.temperature_2m as number

  return {
    city,
    precipitation: precip,
    weatherCode: code,
    temperature: Math.round(temp),
    description: codeToDescription(code),
    rainIntensity: codeToIntensity(code, precip),
    isRaining: code >= 51,
  }
}

/** 設定から天気を取得（キャッシュ済み lat/lon を使う） */
export async function getWeatherFromSettings(settings: {
  city: string | null
  lat: number | null
  lon: number | null
}): Promise<WeatherData | null> {
  if (!settings.city || !settings.lat || !settings.lon) return null
  try {
    return await fetchWeather(settings.lat, settings.lon, settings.city)
  } catch {
    return null
  }
}
