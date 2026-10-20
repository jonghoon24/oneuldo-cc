import { formatFullDate, isValidDateKey } from './date'

/** 시작일로 고를 수 있는 가장 이른 날짜 */
export const MIN_START_DATE = '1900-01-01'

export type StartDateValidation = { ok: true; date: string } | { ok: false; message: string }

/**
 * 시작일 검사. 1900-01-01 이상, 오늘 이하여야 하며
 * 체크 기록이 있으면 가장 이른 기록보다 늦을 수 없다.
 */
export function validateStartDate(raw: string, today: string, earliestRecord?: string): StartDateValidation {
  // <input type="date">는 덜 입력된 값을 빈 문자열로 넘긴다.
  if (!isValidDateKey(raw)) return { ok: false, message: '시작일을 입력해 주세요.' }
  if (raw < MIN_START_DATE) return { ok: false, message: '시작일은 1900년 1월 1일 이후로 정해 주세요.' }
  if (raw > today) return { ok: false, message: '시작일은 오늘 이후로 정할 수 없어요.' }
  if (earliestRecord !== undefined && raw > earliestRecord) {
    return {
      ok: false,
      message: `가장 이른 체크 기록(${formatFullDate(earliestRecord)})보다 늦게 정할 수 없어요.`,
    }
  }
  return { ok: true, date: raw }
}

/** 체크할 수 있는 날짜인지. 시작일부터 오늘까지이며, 시작일이 오늘보다 늦으면(기기 날짜를 되돌린 경우) 비어 있다. */
export function isCheckableDate(date: string, startDate: string, today: string): boolean {
  return startDate <= date && date <= today
}
