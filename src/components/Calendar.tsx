import { useId, useState } from 'react'
import {
  WEEKDAY_HEADERS,
  addMonths,
  clampMonth,
  dayOfMonth,
  formatFullDate,
  formatMonth,
  getMonthCells,
  monthOf,
} from '../lib/date'
import type { Habit } from '../lib/storage'

type Props = {
  habit: Habit
  today: string
  canEdit: boolean
  onToggle: (date: string) => void
}

function chunkWeeks<T>(cells: T[]): T[][] {
  const weeks: T[][] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
  return weeks
}

export function Calendar({ habit, today, canEdit, onToggle }: Props) {
  const titleId = useId()
  // null이면 현재 달을 따라간다. 자정이 지나 달이 바뀌어도 현재 달을 보던 화면은 새 달로 넘어간다.
  const [viewMonth, setViewMonth] = useState<string | null>(null)

  const currentMonth = monthOf(today)
  const createdMonth = monthOf(habit.createdDate)
  const minMonth = createdMonth < currentMonth ? createdMonth : currentMonth
  const shownMonth = clampMonth(viewMonth ?? currentMonth, minMonth, currentMonth)
  const canGoPrev = shownMonth > minMonth
  const canGoNext = shownMonth < currentMonth

  const move = (delta: number) => {
    const next = clampMonth(addMonths(shownMonth, delta), minMonth, currentMonth)
    setViewMonth(next === currentMonth ? null : next)
  }

  const completed = new Set(habit.completedDates)
  const weeks = chunkWeeks(getMonthCells(shownMonth))
  const hasRecordInMonth = habit.completedDates.some((date) => monthOf(date) === shownMonth)

  return (
    <section className="calendar" aria-labelledby={titleId}>
      <div className="calendar__header">
        <button
          type="button"
          className="button button--icon"
          onClick={() => move(-1)}
          disabled={!canGoPrev}
          aria-label="이전 달"
        >
          <span aria-hidden="true">‹</span>
        </button>
        <h3 id={titleId} className="calendar__title" aria-live="polite">
          {formatMonth(shownMonth)}
        </h3>
        <button
          type="button"
          className="button button--icon"
          onClick={() => move(1)}
          disabled={!canGoNext}
          aria-label="다음 달"
        >
          <span aria-hidden="true">›</span>
        </button>
      </div>

      <table className="calendar__grid">
        <thead>
          <tr>
            {WEEKDAY_HEADERS.map((weekday) => (
              <th key={weekday} scope="col" abbr={`${weekday}요일`}>
                {weekday}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week, weekIndex) => (
            <tr key={weekIndex}>
              {week.map((date, dayIndex) => {
                if (!date) return <td key={`empty-${dayIndex}`} className="calendar__empty" />
                const done = completed.has(date)
                const isToday = date === today
                const beforeCreated = date < habit.createdDate
                const future = date > today
                const locked = beforeCreated || future
                const reason = beforeCreated ? ', 등록일 이전' : future ? ', 미래 날짜' : ''
                const classNames = ['day']
                if (done) classNames.push('day--done')
                if (isToday) classNames.push('day--today')
                if (locked) classNames.push('day--locked')
                return (
                  <td key={date}>
                    <button
                      type="button"
                      className={classNames.join(' ')}
                      aria-pressed={done}
                      aria-label={`${formatFullDate(date)}${isToday ? ', 오늘' : ''}${reason}`}
                      disabled={locked || !canEdit}
                      onClick={() => onToggle(date)}
                    >
                      <span aria-hidden="true">{dayOfMonth(date)}</span>
                    </button>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>

      <ul className="calendar__legend">
        <li>
          <span className="legend-swatch legend-swatch--done" aria-hidden="true" />
          완료
        </li>
        <li>
          <span className="legend-swatch legend-swatch--today" aria-hidden="true" />
          오늘
        </li>
        <li>
          <span className="legend-swatch legend-swatch--locked" aria-hidden="true" />
          선택할 수 없는 날
        </li>
      </ul>
      {!hasRecordInMonth && <p className="calendar__empty-note">이 달에는 아직 기록이 없어요.</p>}
    </section>
  )
}
