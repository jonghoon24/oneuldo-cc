import { dayOfMonth, daysInMonth } from './date'

export type MonthlyRate = {
  /** 체크한 날 수 */
  done: number
  /** 체크할 수 있었던 날 수 */
  total: number
  /** 반올림한 정수 퍼센트 */
  percent: number
}

/**
 * 월간 달성률.
 * 분모는 그 달과 '시작일~오늘' 범위가 겹치는 일수다. 시작일이 든 달은 시작일부터, 이번 달은 오늘까지 센다.
 * 겹치는 날이 없으면(시작일 이전 달, 미래 달, 기기 날짜를 되돌려 시작일이 오늘보다 늦은 경우) 0/0이다.
 */
export function monthlyRate(
  completedDates: readonly string[],
  monthKey: string,
  today: string,
  startDate: string,
): MonthlyRate {
  const monthStart = `${monthKey}-01`
  const monthEnd = `${monthKey}-${String(daysInMonth(monthKey)).padStart(2, '0')}`
  const from = startDate > monthStart ? startDate : monthStart
  const to = today < monthEnd ? today : monthEnd
  if (from > to) return { done: 0, total: 0, percent: 0 }

  const total = dayOfMonth(to) - dayOfMonth(from) + 1
  // 범위 밖 날짜(다른 달, 시작일 이전, 오늘 이후)가 섞여 있어도 분자가 분모를 넘지 않도록 범위 안만 센다.
  const done = completedDates.filter((date) => date >= from && date <= to).length
  return { done, total, percent: Math.round((done / total) * 100) }
}
