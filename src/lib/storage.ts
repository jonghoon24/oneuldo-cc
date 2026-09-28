import { isValidDateKey } from './date'
import { checkNameFormat, normalizeHabitName } from './habitName'

export const STORAGE_KEY = 'oneuldo'
export const DATA_VERSION = 1

export type Habit = {
  id: string
  name: string
  /** 등록일 (YYYY-MM-DD) */
  createdDate: string
  /** 완료한 날짜 목록 (YYYY-MM-DD, 오름차순, 중복 없음) */
  completedDates: string[]
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

function parseHabit(value: unknown): Habit | null {
  if (!isRecord(value)) return null
  const { id, name, createdDate, completedDates } = value
  if (typeof id !== 'string' || id.length === 0) return null
  if (typeof name !== 'string' || !checkNameFormat(name).ok) return null
  if (!isValidDateKey(createdDate)) return null
  if (!Array.isArray(completedDates) || !completedDates.every(isValidDateKey)) return null
  return {
    id,
    name: normalizeHabitName(name),
    createdDate,
    completedDates: [...new Set(completedDates)].sort(),
  }
}

function parseData(value: unknown): StoredData | null {
  if (!isRecord(value) || value.version !== DATA_VERSION || !Array.isArray(value.habits)) return null
  const habits: Habit[] = []
  const ids = new Set<string>()
  const names = new Set<string>()
  for (const item of value.habits) {
    const habit = parseHabit(item)
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
