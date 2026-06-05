// Open-Meteo ── 無料・APIキー不要
// Geocoding: https://geocoding-api.open-meteo.com
// Weather:   https://api.open-meteo.com

export type WeatherData = {
  city: string
  precipitation: number
  weatherCode: number
  temperature: number
  description: string
  rainIntensity: number
  isRaining: boolean
}

const TIMEOUT_MS = 5000

/** fetch with AbortController タイムアウト */
async function fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(url, { ...options, signal: controller.signal })
    return res
  } finally {
    clearTimeout(id)
  }
}

function codeToIntensity(code: number, precip: number): number {
  if (code === 0) return 0.05
  if (code <= 3) return 0.10
  if (code <= 48) return 0.12
  if (code <= 57) return 0.25 + precip * 0.05
  if (code <= 67) return 0.4 + precip * 0.04
  if (code <= 77) return 0.2
  if (code <= 82) return 0.5 + precip * 0.05
  return Math.min(0.9, 0.65 + precip * 0.03)
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

export async function geocodeCity(city: string): Promise<{ lat: number; lon: number; name: string } | null> {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=ja&format=json`
  try {
    const res = await fetchWithTimeout(url, { next: { revalidate: 86400 } } as RequestInit)
    if (!res.ok) return null
    const data = await res.json()
    const r = data.results?.[0]
    if (!r) return null
    return { lat: r.latitude, lon: r.longitude, name: r.name }
  } catch (e) {
    console.error("[weather] geocode failed:", e)
    return null
  }
}

export async function fetchWeather(lat: number, lon: number, city: string): Promise<WeatherData> {
  const url = [
    `https://api.open-meteo.com/v1/forecast`,
    `?latitude=${lat}&longitude=${lon}`,
    `&current=temperature_2m,precipitation,weather_code`,
    `&timezone=auto`,
  ].join("")

  const res = await fetchWithTimeout(url, { next: { revalidate: 1800 } } as RequestInit)
  if (!res.ok) throw new Error("Weather API failed")

  const data = await res.json()
  const cur = data.current
  const code = cur.weather_code as number
  const precip = cur.precipitation as number
  const temp = cur.temperature_2m as number

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

export async function getWeatherFromSettings(settings: {
  city: string | null
  lat: number | null
  lon: number | null
}): Promise<WeatherData | null> {
  if (!settings.city || !settings.lat || !settings.lon) return null
  try {
    return await fetchWeather(settings.lat, settings.lon, settings.city)
  } catch (e) {
    console.error("[weather] fetch failed:", e)
    return null
  }
}
