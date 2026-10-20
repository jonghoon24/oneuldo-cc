import { addDays } from './date'

/**
 * 현재 연속 실천 일수.
 * 오늘이 체크되어 있으면 오늘부터, 아니면 어제부터 과거 방향으로 끊기지 않은 날을 센다.
 */
export function currentStreak(completed: ReadonlySet<string>, today: string): number {
  let day = completed.has(today) ? today : addDays(today, -1)
  let count = 0
  while (completed.has(day)) {
    count++
    day = addDays(day, -1)
  }
  return count
}
