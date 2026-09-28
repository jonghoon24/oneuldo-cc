// 날짜는 시간대 없는 현지 달력 날짜 문자열(YYYY-MM-DD)로 다룬다.
// 월은 YYYY-MM 문자열로 다룬다. 두 형식 모두 문자열 비교로 순서를 판단할 수 있다.

const DATE_KEY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/
const WEEKDAY_NAMES = ['일', '월', '화', '수', '목', '금', '토']

export const WEEKDAY_HEADERS = ['월', '화', '수', '목', '금', '토', '일']

function pad2(value: number): string {
  return String(value).padStart(2, '0')
}

function parseDateKey(key: string): { year: number; month: number; day: number } {
  const [year, month, day] = key.split('-').map(Number)
  return { year, month, day }
}

// 정오를 기준으로 Date를 만들어 자정에 일어나는 DST 전환의 영향을 피한다.
function dateFromKey(key: string): Date {
  const { year, month, day } = parseDateKey(key)
  return new Date(year, month - 1, day, 12)
}

export function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
}

export function todayKey(): string {
  return toDateKey(new Date())
}

export function isValidDateKey(value: unknown): value is string {
  if (typeof value !== 'string') return false
  const match = DATE_KEY_PATTERN.exec(value)
  if (!match) return false
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(year, month - 1, day, 12)
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
}

export function addDays(key: string, days: number): string {
  const { year, month, day } = parseDateKey(key)
  return toDateKey(new Date(year, month - 1, day + days, 12))
}

export function monthOf(key: string): string {
  return key.slice(0, 7)
}

export function addMonths(monthKey: string, months: number): string {
  const [year, month] = monthKey.split('-').map(Number)
  const date = new Date(year, month - 1 + months, 1, 12)
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}`
}

export function clampMonth(monthKey: string, min: string, max: string): string {
  if (monthKey > max) return max
  if (monthKey < min) return min
  return monthKey
}

/** 월요일 시작 달력 칸. 해당 달이 아닌 칸은 null이다. */
export function getMonthCells(monthKey: string): (string | null)[] {
  const [year, month] = monthKey.split('-').map(Number)
  const first = new Date(year, month - 1, 1, 12)
  const daysInMonth = new Date(year, month, 0, 12).getDate()
  const leading = (first.getDay() + 6) % 7
  const cells: (string | null)[] = Array.from({ length: leading }, () => null)
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(`${monthKey}-${pad2(day)}`)
  }
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

export function dayOfMonth(key: string): number {
  return parseDateKey(key).day
}

/** 예: 2026년 9월 28일 월요일 */
export function formatFullDate(key: string): string {
  const { year, month, day } = parseDateKey(key)
  const weekday = WEEKDAY_NAMES[dateFromKey(key).getDay()]
  return `${year}년 ${month}월 ${day}일 ${weekday}요일`
}

/** 예: 2026년 9월 */
export function formatMonth(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number)
  return `${year}년 ${month}월`
}

/** 다음 현지 자정까지 남은 밀리초 */
export function msUntilNextMidnight(now: Date = new Date()): number {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  return next.getTime() - now.getTime()
}
