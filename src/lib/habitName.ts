export const HABIT_NAME_MAX_LENGTH = 20

const LINE_BREAK_PATTERN = /[\r\n\u2028\u2029]/

export const NAME_ERROR_LINE_BREAK = '습관 이름에는 줄바꿈을 넣을 수 없어요.'

export type NameValidation = { ok: true; name: string } | { ok: false; message: string }

export function normalizeHabitName(raw: string): string {
  return raw.trim().normalize('NFC')
}

export function nameLength(value: string): number {
  return Array.from(value).length
}

export function hasLineBreak(value: string): boolean {
  return LINE_BREAK_PATTERN.test(value)
}

/** 이름 형식 검사. 중복 여부는 보지 않는다. */
export function checkNameFormat(raw: string): NameValidation {
  if (hasLineBreak(raw)) return { ok: false, message: NAME_ERROR_LINE_BREAK }
  const name = normalizeHabitName(raw)
  if (name.length === 0) return { ok: false, message: '습관 이름을 입력해 주세요.' }
  if (nameLength(name) > HABIT_NAME_MAX_LENGTH) {
    return { ok: false, message: `습관 이름은 ${HABIT_NAME_MAX_LENGTH}자 이하로 입력해 주세요.` }
  }
  return { ok: true, name }
}

export function validateHabitName(
  raw: string,
  habits: readonly { id: string; name: string }[],
  excludeId?: string,
): NameValidation {
  const result = checkNameFormat(raw)
  if (!result.ok) return result
  const duplicated = habits.some(
    (habit) => habit.id !== excludeId && normalizeHabitName(habit.name) === result.name,
  )
  if (duplicated) return { ok: false, message: '이미 같은 이름의 습관이 있어요.' }
  return result
}
