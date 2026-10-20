import { useCallback, useEffect, useRef, useState } from 'react'
import { todayKey } from '../lib/date'
import { validateHabitName, type NameValidation } from '../lib/habitName'
import { isCheckableDate, validateStartDate, type StartDateValidation } from '../lib/startDate'
import {
  STORAGE_KEY,
  createId,
  loadData,
  saveData,
  type LoadErrorReason,
  type StoredData,
} from '../lib/storage'

export type StoreErrorReason = LoadErrorReason | 'write'

export type StoreState =
  | { status: 'ready'; data: StoredData }
  | { status: 'error'; reason: StoreErrorReason; data: StoredData | null }

function stateFromLoad(): StoreState {
  const result = loadData()
  return result.ok
    ? { status: 'ready', data: result.data }
    : { status: 'error', reason: result.reason, data: null }
}

/** 칸별 오류 메시지. 저장 실패처럼 칸과 무관한 실패면 둘 다 비어 있다. */
type FieldErrors = { nameError?: string; startDateError?: string }
export type AddResult = { ok: true; id: string } | ({ ok: false } & FieldErrors)
export type EditResult = { ok: true } | ({ ok: false } & FieldErrors)

/** 두 칸의 오류를 함께 보여줄 수 있도록 각 검사 결과에서 오류 메시지를 모은다. */
function fieldErrors(name: NameValidation, startDate: StartDateValidation): FieldErrors {
  return {
    nameError: name.ok ? undefined : name.message,
    startDateError: startDate.ok ? undefined : startDate.message,
  }
}

export function useHabitStore() {
  const [state, setState] = useState<StoreState>(stateFromLoad)
  // 연속된 조작이 항상 마지막으로 저장된 데이터를 기준으로 계산되도록 동기적으로 유지한다.
  const stateRef = useRef(state)

  const applyState = useCallback((next: StoreState) => {
    stateRef.current = next
    setState(next)
  }, [])

  /** 저장에 성공했을 때만 화면 상태를 바꾼다. 실패하면 이전 데이터를 유지하고 변경을 막는다. */
  const commit = useCallback(
    (update: (data: StoredData) => StoredData | null): boolean => {
      const current = stateRef.current
      if (current.status !== 'ready') return false
      const next = update(current.data)
      if (!next) return false
      if (!saveData(next)) {
        applyState({ status: 'error', reason: 'write', data: current.data })
        return false
      }
      applyState({ status: 'ready', data: next })
      return true
    },
    [applyState],
  )

  const reload = useCallback(() => applyState(stateFromLoad()), [applyState])

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY || event.key === null) reload()
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [reload])

  const addHabit = useCallback(
    (rawName: string, rawStartDate: string): AddResult => {
      const current = stateRef.current
      if (current.status !== 'ready') return { ok: false }
      const nameResult = validateHabitName(rawName, current.data.habits)
      const startResult = validateStartDate(rawStartDate, todayKey())
      if (!nameResult.ok || !startResult.ok) return { ok: false, ...fieldErrors(nameResult, startResult) }
      const id = createId(current.data.habits)
      const saved = commit((data) => ({
        ...data,
        habits: [
          ...data.habits,
          { id, name: nameResult.name, createdDate: startResult.date, completedDates: [] },
        ],
      }))
      return saved ? { ok: true, id } : { ok: false }
    },
    [commit],
  )

  /** 이름과 시작일을 한 번에 검사해 함께 저장한다. 하나라도 틀리면 아무것도 저장하지 않는다. */
  const editHabit = useCallback(
    (id: string, rawName: string, rawStartDate: string): EditResult => {
      const current = stateRef.current
      if (current.status !== 'ready') return { ok: false }
      const target = current.data.habits.find((habit) => habit.id === id)
      if (!target) return { ok: false }
      const nameResult = validateHabitName(rawName, current.data.habits, id)
      // 시작일을 바꾸지 않았으면 다시 검사하지 않는다. 기기 날짜를 되돌려 시작일이 오늘보다 늦어져도 이름은 바꿀 수 있게 한다.
      const startResult: StartDateValidation =
        rawStartDate === target.createdDate
          ? { ok: true, date: target.createdDate }
          : validateStartDate(rawStartDate, todayKey(), target.completedDates[0])
      if (!nameResult.ok || !startResult.ok) return { ok: false, ...fieldErrors(nameResult, startResult) }
      if (target.name === nameResult.name && target.createdDate === startResult.date) return { ok: true }
      const saved = commit((data) => ({
        ...data,
        habits: data.habits.map((habit) =>
          habit.id === id ? { ...habit, name: nameResult.name, createdDate: startResult.date } : habit,
        ),
      }))
      return saved ? { ok: true } : { ok: false }
    },
    [commit],
  )

  const deleteHabit = useCallback(
    (id: string): boolean =>
      commit((data) =>
        data.habits.some((habit) => habit.id === id)
          ? { ...data, habits: data.habits.filter((habit) => habit.id !== id) }
          : null,
      ),
    [commit],
  )

  const toggleDate = useCallback(
    (id: string, date: string): boolean =>
      commit((data) => {
        const target = data.habits.find((habit) => habit.id === id)
        if (!target || !isCheckableDate(date, target.createdDate, todayKey())) return null
        const completed = new Set(target.completedDates)
        if (completed.has(date)) completed.delete(date)
        else completed.add(date)
        const completedDates = [...completed].sort()
        return {
          ...data,
          habits: data.habits.map((habit) => (habit.id === id ? { ...habit, completedDates } : habit)),
        }
      }),
    [commit],
  )

  return { state, reload, addHabit, editHabit, deleteHabit, toggleDate }
}
