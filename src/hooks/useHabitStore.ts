import { useCallback, useEffect, useRef, useState } from 'react'
import { todayKey } from '../lib/date'
import { validateHabitName, type NameValidation } from '../lib/habitName'
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

export type AddResult = { ok: true; id: string } | { ok: false; message?: string }
export type RenameResult = { ok: true } | { ok: false; message?: string }

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
    (rawName: string): AddResult => {
      const current = stateRef.current
      if (current.status !== 'ready') return { ok: false }
      const validation: NameValidation = validateHabitName(rawName, current.data.habits)
      if (!validation.ok) return { ok: false, message: validation.message }
      const id = createId(current.data.habits)
      const saved = commit((data) => ({
        ...data,
        habits: [
          ...data.habits,
          { id, name: validation.name, createdDate: todayKey(), completedDates: [] },
        ],
      }))
      return saved ? { ok: true, id } : { ok: false }
    },
    [commit],
  )

  const renameHabit = useCallback(
    (id: string, rawName: string): RenameResult => {
      const current = stateRef.current
      if (current.status !== 'ready') return { ok: false }
      const validation = validateHabitName(rawName, current.data.habits, id)
      if (!validation.ok) return { ok: false, message: validation.message }
      const target = current.data.habits.find((habit) => habit.id === id)
      if (!target) return { ok: false }
      if (target.name === validation.name) return { ok: true }
      const saved = commit((data) => ({
        ...data,
        habits: data.habits.map((habit) =>
          habit.id === id ? { ...habit, name: validation.name } : habit,
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
        if (!target || date < target.createdDate || date > todayKey()) return null
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

  return { state, reload, addHabit, renameHabit, deleteHabit, toggleDate }
}
