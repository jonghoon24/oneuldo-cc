import { isValidDateKey } from './date'
import { isHabitColor, legacyColor, type HabitColor } from './habitColor'
import { checkNameFormat, normalizeHabitName } from './habitName'

export const STORAGE_KEY = 'oneuldo'
/** 2: 습관 색 추가. 1은 색 없이 저장된 데이터로, 불러올 때 등록순으로 색을 채운다. */
export const DATA_VERSION = 2

export type Habit = {
  id: string
  name: string
  /** 시작일 (YYYY-MM-DD). 저장 형식 호환을 위해 필드 이름은 등록일 시절 그대로 둔다. */
  createdDate: string
  /** 완료한 날짜 목록 (YYYY-MM-DD, 오름차순, 중복 없음) */
  completedDates: string[]
  color: HabitColor
}

/** habits 배열의 순서가 등록 순서다. */
export type StoredData = {
  version: typeof DATA_VERSION
  habits: Habit[]
}

export type LoadErrorReason = 'access' | 'parse'

export type LoadResult = { ok: true; data: StoredData } | { ok: false; reason: LoadErrorReason }

export function emptyData(): StoredData {
  return { version: DATA_VERSION, habits: [] }
}

function getStorage(): Storage {
  return window.localStorage
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** index는 등록순 위치다. 버전 1 데이터에는 색이 없으므로 이 위치로 색을 채운다. */
function parseHabit(value: unknown, index: number, version: number): Habit | null {
  if (!isRecord(value)) return null
  const { id, name, createdDate, completedDates, color } = value
  if (typeof id !== 'string' || id.length === 0) return null
  if (typeof name !== 'string' || !checkNameFormat(name).ok) return null
  if (!isValidDateKey(createdDate)) return null
  if (!Array.isArray(completedDates) || !completedDates.every(isValidDateKey)) return null
  // 색 보정도 시작일 보정처럼 불러오기만으로는 저장하지 않고 다음 변경을 저장할 때 함께 반영된다.
  if (version === 1 ? color !== undefined && !isHabitColor(color) : !isHabitColor(color)) return null
  const sorted = [...new Set(completedDates)].sort()
  // 시작일 이전 체크가 허용되던 시절의 기록이 있으면 시작일을 가장 이른 기록으로 당긴다.
  // 불러오기만으로는 저장하지 않고, 다음 변경을 저장할 때 함께 반영된다.
  const earliest = sorted[0]
  return {
    id,
    name: normalizeHabitName(name),
    createdDate: earliest !== undefined && earliest < createdDate ? earliest : createdDate,
    completedDates: sorted,
    color: isHabitColor(color) ? color : legacyColor(index),
  }
}

function parseData(value: unknown): StoredData | null {
  if (!isRecord(value) || !Array.isArray(value.habits)) return null
  const { version } = value
  if (version !== 1 && version !== DATA_VERSION) return null
  const habits: Habit[] = []
  const ids = new Set<string>()
  const names = new Set<string>()
  for (const [index, item] of value.habits.entries()) {
    const habit = parseHabit(item, index, version)
    if (!habit || ids.has(habit.id) || names.has(habit.name)) return null
    ids.add(habit.id)
    names.add(habit.name)
    habits.push(habit)
  }
  return { version: DATA_VERSION, habits }
}

export function loadData(): LoadResult {
  let raw: string | null
  try {
    raw = getStorage().getItem(STORAGE_KEY)
  } catch {
    return { ok: false, reason: 'access' }
  }
  if (raw === null) return { ok: true, data: emptyData() }
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return { ok: false, reason: 'parse' }
  }
  const data = parseData(parsed)
  return data ? { ok: true, data } : { ok: false, reason: 'parse' }
}

export function saveData(data: StoredData): boolean {
  try {
    getStorage().setItem(STORAGE_KEY, JSON.stringify(data))
    return true
  } catch {
    return false
  }
}

export function createId(existing: readonly Habit[]): string {
  const ids = new Set(existing.map((habit) => habit.id))
  for (;;) {
    const id =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
    if (!ids.has(id)) return id
  }
}
