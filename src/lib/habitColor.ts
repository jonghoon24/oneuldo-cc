/** 습관 색 팔레트. 배열 순서가 팔레트 순서다. */
export const HABIT_COLORS = ['yellow', 'pink', 'green', 'sky', 'orange', 'purple'] as const

export type HabitColor = (typeof HABIT_COLORS)[number]

export const HABIT_COLOR_NAMES: Record<HabitColor, string> = {
  yellow: '노랑',
  pink: '분홍',
  green: '초록',
  sky: '하늘',
  orange: '주황',
  purple: '보라',
}

export function isHabitColor(value: unknown): value is HabitColor {
  return typeof value === 'string' && (HABIT_COLORS as readonly string[]).includes(value)
}

/** 등록 폼의 기본 색. 가장 적게 쓰인 색 중 팔레트 순서상 첫 색이며, 안 쓴 색이 있으면 그중 첫 색이 된다. */
export function suggestColor(habits: readonly { color: HabitColor }[]): HabitColor {
  const counts = new Map<HabitColor, number>(HABIT_COLORS.map((color) => [color, 0]))
  for (const habit of habits) counts.set(habit.color, (counts.get(habit.color) ?? 0) + 1)
  let best: HabitColor = HABIT_COLORS[0]
  for (const color of HABIT_COLORS) {
    if ((counts.get(color) ?? 0) < (counts.get(best) ?? 0)) best = color
  }
  return best
}

/** 색 정보 없이 저장된 습관의 색. 등록순으로 팔레트를 돌아가며 받는다. */
export function legacyColor(index: number): HabitColor {
  return HABIT_COLORS[index % HABIT_COLORS.length]
}
