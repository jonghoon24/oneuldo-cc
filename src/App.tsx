import { useState } from 'react'
import { EmptyState } from './components/EmptyState'
import { ErrorBanner } from './components/ErrorBanner'
import { HabitDetail } from './components/HabitDetail'
import { HabitForm } from './components/HabitForm'
import { HabitList } from './components/HabitList'
import { StorageNotice } from './components/StorageNotice'
import { useHabitStore } from './hooks/useHabitStore'
import { useToday } from './hooks/useToday'
import { formatMonthDay } from './lib/date'
import { suggestColor, type HabitColor } from './lib/habitColor'
import { isCheckableDate } from './lib/startDate'

export default function App() {
  const today = useToday()
  const { state, reload, addHabit, editHabit, deleteHabit, toggleDate } = useHabitStore()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)

  const data = state.data
  const habits = data?.habits ?? []
  const canEdit = state.status === 'ready'
  // 선택은 저장하지 않는다. 선택한 습관이 없거나 사라졌으면 등록순 첫 습관을 보여준다.
  const selected = habits.find((habit) => habit.id === selectedId) ?? habits[0] ?? null
  const [prevCanEdit, setPrevCanEdit] = useState(canEdit)

  // 저장 오류로 편집이 막히면 열려 있던 등록 폼을 닫는다.
  if (canEdit !== prevCanEdit) {
    setPrevCanEdit(canEdit)
    if (!canEdit) setAdding(false)
  }

  // 오늘 체크할 수 있는 습관만 센다. 시작일이 오늘보다 늦은 습관은 빠진다.
  const todayHabits = habits.filter((habit) => isCheckableDate(today, habit.createdDate, today))
  const doneTodayCount = todayHabits.filter((habit) => habit.completedDates.includes(today)).length
  const allDoneToday = todayHabits.length > 0 && doneTodayCount === todayHabits.length

  const handleAdd = (name: string, startDate: string, color: HabitColor) => {
    const result = addHabit(name, startDate, color)
    if (result.ok) setSelectedId(result.id)
    return result
  }

  const handleDelete = (id: string) => {
    const index = habits.findIndex((habit) => habit.id === id)
    const next = habits[index + 1] ?? habits[index - 1] ?? null
    if (!deleteHabit(id)) return
    setSelectedId(next?.id ?? null)
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-header__title">오늘도</h1>
      </header>

      {state.status === 'error' && <ErrorBanner reason={state.reason} onReload={reload} />}

      {data && (
        <main className="layout">
          <section className="panel panel--list today">
            <div className="panel__header">
              <div className="today__heading">
                <h2 className="today__date">{formatMonthDay(today)}</h2>
                {todayHabits.length > 0 && (
                  <p className={allDoneToday ? 'today__progress today__progress--complete' : 'today__progress'}>
                    {allDoneToday ? '오늘도 다 했어요' : `${todayHabits.length}개 중 ${doneTodayCount}개 했어요`}
                  </p>
                )}
              </div>
              {!adding && (
                <button
                  type="button"
                  className="button"
                  onClick={() => setAdding(true)}
                  disabled={!canEdit}
                >
                  습관 등록
                </button>
              )}
            </div>
            {adding && (
              <HabitForm
                initialName=""
                initialStartDate={today}
                initialColor={suggestColor(habits)}
                today={today}
                submitLabel="등록"
                placeholder="예: 물 2잔 마시기"
                onSubmit={handleAdd}
                onClose={() => setAdding(false)}
              />
            )}
            {habits.length > 0 ? (
              <HabitList
                habits={habits}
                selectedId={selected?.id ?? null}
                today={today}
                canEdit={canEdit}
                onSelect={setSelectedId}
                onToggleToday={(id) => toggleDate(id, today)}
              />
            ) : (
              !adding && <EmptyState disabled={!canEdit} onStart={() => setAdding(true)} />
            )}
          </section>

          {selected && (
            <div className="panel panel--detail">
              <HabitDetail
                key={selected.id}
                habit={selected}
                today={today}
                canEdit={canEdit}
                onEdit={editHabit}
                onDelete={handleDelete}
                onToggle={toggleDate}
              />
            </div>
          )}
        </main>
      )}

      <footer className="app-footer">
        <StorageNotice />
      </footer>
    </div>
  )
}
