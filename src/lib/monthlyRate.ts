import { dayOfMonth, daysInMonth, monthOf } from './date'

/**
 * 보고 있는 달의 달성률.
 * 분모는 그 달 1일부터 말일과 오늘 중 이른 날까지의 일수다. 등록일 이전도 체크할 수 있으므로 등록일은 보지 않는다.
 * 달력은 미래 달로 이동할 수 없으므로 이번 달이 아니면 지난달로 보고 전체 일수를 쓴다.
 */
export function monthlyRate(
  completedDates: readonly string[],
  monthKey: string,
  today: string,
): { done: number; total: number; percent: number } {
  const total = monthKey === monthOf(today) ? dayOfMonth(today) : daysInMonth(monthKey)
  const done = completedDates.filter((date) => monthOf(date) === monthKey && date <= today).length
  return { done, total, percent: Math.round((done / total) * 100) }
}
