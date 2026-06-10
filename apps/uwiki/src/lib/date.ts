import { format, parseISO, differenceInCalendarDays, startOfDay } from "date-fns"
import { ja } from "date-fns/locale"

export const today = () => format(new Date(), "yyyy-MM-dd")

export const formatDisplay = (dateStr: string) =>
  format(parseISO(dateStr), "M月d日(E)", { locale: ja })

export const formatFull = (date: Date) =>
  format(date, "yyyy年M月d日", { locale: ja })

export function calcBestStreak(dates: string[]): number {
  if (dates.length === 0) return 0
  const sorted = [...new Set(dates)].sort()
  let best = 1, cur = 1
  for (let i = 1; i < sorted.length; i++) {
    const diff = differenceInCalendarDays(parseISO(sorted[i]), parseISO(sorted[i - 1]))
    cur = diff === 1 ? cur + 1 : 1
    if (cur > best) best = cur
  }
  return best
}

export function calcStreak(dates: string[]): number {
  if (dates.length === 0) return 0
  const sorted = [...dates].sort().reverse()
  const todayStr = today()

  if (sorted[0] !== todayStr) {
    // startOfDay で日付境界をローカルタイムゾーンに正規化
    const diff = differenceInCalendarDays(startOfDay(new Date()), parseISO(sorted[0]))
    if (diff > 1) return 0
  }

  let streak = 1
  for (let i = 0; i < sorted.length - 1; i++) {
    const diff = differenceInCalendarDays(parseISO(sorted[i]), parseISO(sorted[i + 1]))
    if (diff === 1) streak++
    else break
  }
  return streak
}
