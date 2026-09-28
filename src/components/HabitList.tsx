import { currentStreak } from '../lib/streak'
import type { Habit } from '../lib/storage'

type Props = {
  habits: Habit[]
  selectedId: string | null
  today: string
  canEdit: boolean
  onSelect: (id: string) => void
  onToggleToday: (id: string) => void
}

export function habitSelectButtonId(id: string): string {
  return `habit-select-${id}`
}

export function HabitList({ habits, selectedId, today, canEdit, onSelect, onToggleToday }: Props) {
  return (
    <ul className="habit-list">
      {habits.map((habit) => {
        const completed = new Set(habit.completedDates)
        const doneToday = completed.has(today)
        const streak = currentStreak(completed, today, habit.createdDate)
        const selected = habit.id === selectedId
        return (
          <li key={habit.id} className={selected ? 'habit-item habit-item--selected' : 'habit-item'}>
            <button
              type="button"
              id={habitSelectButtonId(habit.id)}
              className="habit-item__select"
              aria-current={selected ? 'true' : undefined}
              onClick={() => onSelect(habit.id)}
            >
              <span className="habit-item__name">{habit.name}</span>
              <span className="habit-item__streak">연속 {streak}일</span>
            </button>
            <button
              type="button"
              className={doneToday ? 'today-toggle today-toggle--done' : 'today-toggle'}
              aria-pressed={doneToday}
              aria-label={`${habit.name} 오늘 완료`}
              disabled={!canEdit || today < habit.createdDate}
              onClick={() => onToggleToday(habit.id)}
            >
              <span className="today-toggle__icon" aria-hidden="true">
                {doneToday ? '✓' : ''}
              </span>
              <span className="today-toggle__text" aria-hidden="true">
                {doneToday ? '완료' : '미완료'}
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
