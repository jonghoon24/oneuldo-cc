import { isCheckableDate } from '../lib/startDate'
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

export function HabitList({ habits, selectedId, today, canEdit, onSelect, onToggleToday }: Props) {
  return (
    <ul className="habit-list">
      {habits.map((habit) => {
        const completed = new Set(habit.completedDates)
        const doneToday = completed.has(today)
        const streak = currentStreak(completed, today)
        const selected = habit.id === selectedId
        return (
          <li key={habit.id} className={selected ? 'habit-item habit-item--selected' : 'habit-item'}>
            <button
              type="button"
              className={doneToday ? 'today-toggle today-toggle--done' : 'today-toggle'}
              disabled={!canEdit || !isCheckableDate(today, habit.createdDate, today)}
              onClick={() => onToggleToday(habit.id)}
              title={doneToday ? '오늘 체크 해제' : '오늘 했어요'}
            >
              {doneToday && (
                <svg className="today-toggle__icon" viewBox="0 0 24 24" width="24" height="24">
                  <path d="M5 12.5l4.5 4.5L19 7.5" />
                </svg>
              )}
            </button>
            <button
              type="button"
              className="habit-item__select"
              onClick={() => onSelect(habit.id)}
            >
              <span className="habit-item__name">{habit.name}</span>
              <span className="habit-item__streak">연속 {streak}일</span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
