import { addDays } from './date'

/**
 * 현재 연속 실천 일수.
 * 오늘이 체크되어 있으면 오늘부터, 아니면 어제부터 과거 방향으로 끊기지 않은 날을 센다.
 */
export function currentStreak(completed: ReadonlySet<string>, today: string, createdDate: string): number {
  let day = completed.has(today) ? today : addDays(today, -1)
  let count = 0
  while (day >= createdDate && completed.has(day)) {
    count++
    day = addDays(day, -1)
  }
  return count
}

/**
 * 최장 연속 실천 일수.
 * 체크 가능한 기간(createdDate ≤ date ≤ 오늘) 안에서 끊기지 않고 이어진 가장 긴 구간의 길이다.
 */
export function longestStreak(completedDates: readonly string[], today: string, createdDate: string): number {
  let longest = 0
  let count = 0
  let previous: string | null = null
  for (const day of completedDates) {
    if (day < createdDate || day > today) continue
    count = previous !== null && addDays(previous, 1) === day ? count + 1 : 1
    longest = Math.max(longest, count)
    previous = day
  }
  return longest
}
