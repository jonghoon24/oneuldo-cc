import { useState } from 'react'
import {
  WEEKDAY_HEADERS,
  addMonths,
  clampMonth,
  dayOfMonth,
  formatMonth,
  getMonthCells,
  monthOf,
} from '../lib/date'
import { monthlyRate } from '../lib/monthlyRate'
import type { Habit } from '../lib/storage'

// 등록일 이전도 체크할 수 있으므로 과거 방향으로는 사실상 제한하지 않는다.
// YYYY 네 자리 형식이 깨지지 않도록 하한만 둔다.
const MIN_MONTH = '1900-01'

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
  // null이면 현재 달을 따라간다. 자정이 지나 달이 바뀌어도 현재 달을 보던 화면은 새 달로 넘어간다.
  const [viewMonth, setViewMonth] = useState<string | null>(null)

  const currentMonth = monthOf(today)
  const shownMonth = clampMonth(viewMonth ?? currentMonth, MIN_MONTH, currentMonth)
  const canGoPrev = shownMonth > MIN_MONTH
  const canGoNext = shownMonth < currentMonth

  const move = (delta: number) => {
    const next = clampMonth(addMonths(shownMonth, delta), MIN_MONTH, currentMonth)
    setViewMonth(next === currentMonth ? null : next)
  }

  const completed = new Set(habit.completedDates)
  const weeks = chunkWeeks(getMonthCells(shownMonth))
  const hasRecordInMonth = habit.completedDates.some((date) => monthOf(date) === shownMonth)
  const rate = monthlyRate(habit.completedDates, shownMonth, today)

  return (
    <section className="calendar">
      <div className="calendar__header">
        <button
          type="button"
          className="button button--icon calendar__prev"
          onClick={() => move(-1)}
          disabled={!canGoPrev}
          title="이전 달"
        >
          ‹
        </button>
        <h3 className="calendar__title">{formatMonth(shownMonth)}</h3>
        <button
          type="button"
          className="button button--icon calendar__next"
          onClick={() => move(1)}
          disabled={!canGoNext}
          title="다음 달"
        >
          ›
        </button>
      </div>
      <p className="calendar__rate">
        달성률 {rate.percent}% ({rate.done}/{rate.total}일)
      </p>

      <table className="calendar__grid">
        <thead>
          <tr>
            {WEEKDAY_HEADERS.map((weekday) => (
              <th key={weekday}>{weekday}</th>
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
                const future = date > today
                const classNames = ['day']
                if (done) classNames.push('day--done')
                if (isToday) classNames.push('day--today')
                if (future) classNames.push('day--locked')
                return (
                  <td key={date}>
                    <button
                      type="button"
                      className={classNames.join(' ')}
                      data-date={date}
                      disabled={future || !canEdit}
                      onClick={() => onToggle(date)}
                    >
                      <span className="day__number">{dayOfMonth(date)}</span>
                      <span className="day__mark">{done ? '✓' : ''}</span>
                      {isToday && <span className="day__today">오늘</span>}
                    </button>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>

      <p className="calendar__legend">✓ 완료 · 빈 칸 미완료 · 굵은 테두리 오늘 · 흐린 날짜 선택 불가</p>
      {!hasRecordInMonth && <p className="calendar__empty-note">이 달에는 아직 기록이 없어요.</p>}
    </section>
  )
}
