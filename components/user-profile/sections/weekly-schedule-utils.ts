export const WEEKDAY_KANJI = ['日', '月', '火', '水', '木', '金', '土'] as const

export function getDayInfo(
  startDate: string,
  offset: number
): { weekday: string; label: string } {
  // タイムゾーン問題を避けるため日付文字列を直接パース
  const [year, month, day] = startDate.split('-').map(Number)
  const date = new Date(year, month - 1, day + offset)
  const weekday = WEEKDAY_KANJI[date.getDay()]
  return { weekday, label: `${date.getMonth() + 1}/${date.getDate()}` }
}
