import { useRef, useState } from 'react'
import { AddHabitForm } from './components/AddHabitForm'
import { EmptyState } from './components/EmptyState'
import { ErrorBanner } from './components/ErrorBanner'
import { HabitDetail } from './components/HabitDetail'
import { HabitList } from './components/HabitList'
import { StorageNotice } from './components/StorageNotice'
import { useHabitStore } from './hooks/useHabitStore'
import { useToday } from './hooks/useToday'
import { formatFullDate } from './lib/date'

export default function App() {
  const today = useToday()
  const { state, reload, addHabit, renameHabit, deleteHabit, toggleDate } = useHabitStore()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const addInputRef = useRef<HTMLInputElement>(null)

  const data = state.data
  const habits = data?.habits ?? []
  const canEdit = state.status === 'ready'
  // 선택은 저장하지 않는다. 선택한 습관이 없거나 사라졌으면 등록순 첫 습관을 보여준다.
  const selected = habits.find((habit) => habit.id === selectedId) ?? habits[0] ?? null

  const handleAdd = (name: string) => {
    const result = addHabit(name)
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
        <p className="app-header__today">
          <span className="app-header__today-label">오늘</span> {formatFullDate(today)}
        </p>
      </header>

      <StorageNotice />

      {state.status === 'error' && <ErrorBanner reason={state.reason} onReload={reload} />}

      {data && (
        <main className="layout">
          <section className="panel panel--list">
            <h2 className="panel__title">습관 목록</h2>
            <AddHabitForm disabled={!canEdit} onAdd={handleAdd} inputRef={addInputRef} />
            {habits.length > 0 && (
              <HabitList
                habits={habits}
                selectedId={selected?.id ?? null}
                today={today}
                canEdit={canEdit}
                onSelect={setSelectedId}
                onToggleToday={(id) => toggleDate(id, today)}
              />
            )}
          </section>

          <div className="panel panel--detail">
            {selected ? (
              <HabitDetail
                key={selected.id}
                habit={selected}
                today={today}
                canEdit={canEdit}
                onRename={renameHabit}
                onDelete={handleDelete}
                onToggle={toggleDate}
              />
            ) : (
              <EmptyState disabled={!canEdit} onStart={() => addInputRef.current?.focus()} />
            )}
          </div>
        </main>
      )}
    </div>
  )
}
