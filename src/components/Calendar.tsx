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
import { isCheckableDate } from '../lib/startDate'
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
  // null이면 현재 달을 따라간다. 자정이 지나 달이 바뀌어도 현재 달을 보던 화면은 새 달로 넘어간다.
  const [viewMonth, setViewMonth] = useState<string | null>(null)

  const startDate = habit.createdDate
  const currentMonth = monthOf(today)
  // 시작일이 든 달까지만 거슬러 갈 수 있다. 시작일이 오늘보다 늦으면(기기 날짜를 되돌린 경우) 현재 달까지다.
  const minMonth = monthOf(startDate < today ? startDate : today)
  const shownMonth = clampMonth(viewMonth ?? currentMonth, minMonth, currentMonth)
  const canGoPrev = shownMonth > minMonth
  const canGoNext = shownMonth < currentMonth

  const move = (delta: number) => {
    const next = clampMonth(addMonths(shownMonth, delta), minMonth, currentMonth)
    setViewMonth(next === currentMonth ? null : next)
  }

  const completed = new Set(habit.completedDates)
  const weeks = chunkWeeks(getMonthCells(shownMonth))
  // 전체 기록은 한 번만 훑고, 기록 유무와 달성률은 이 달 날짜만으로 계산한다.
  const monthDates = habit.completedDates.filter((date) => monthOf(date) === shownMonth)
  const hasRecordInMonth = monthDates.length > 0
  const rate = monthlyRate(monthDates, shownMonth, today, startDate)

  return (
    <section className="calendar">
      <div className="calendar__header">
        <div className="calendar__heading">
          <h3 className="calendar__title">{formatMonth(shownMonth)}</h3>
          <p className="calendar__rate">
            달성률 <strong className="calendar__rate-percent">{rate.percent}%</strong> ({rate.done}/{rate.total}일)
          </p>
        </div>
        <div className="calendar__nav">
          <button
            type="button"
            className="button button--icon calendar__prev"
            onClick={() => move(-1)}
            disabled={!canGoPrev}
            title="이전 달"
          >
            ‹
          </button>
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
      </div>

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
                const isStart = date === startDate
                const locked = !isCheckableDate(date, startDate, today)
                // 같은 주에서 이어서 체크한 날은 칠한 칸을 한 줄로 잇는다.
                const prev = week[dayIndex - 1]
                const next = week[dayIndex + 1]
                const classNames = ['day']
                if (done) classNames.push('day--done')
                if (done && prev && completed.has(prev)) classNames.push('day--join-prev')
                if (done && next && completed.has(next)) classNames.push('day--join-next')
                if (isToday) classNames.push('day--today')
                if (isStart) classNames.push('day--start')
                if (locked) classNames.push('day--locked')
                const label = isToday ? '오늘' : isStart ? '시작' : null
                return (
                  <td key={date}>
                    <button
                      type="button"
                      className={classNames.join(' ')}
                      data-date={date}
                      disabled={locked || !canEdit}
                      onClick={() => onToggle(date)}
                    >
                      <span className="day__number">{dayOfMonth(date)}</span>
                      {label && <span className="day__label">{label}</span>}
                    </button>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {!hasRecordInMonth && rate.total > 0 && (
        <p className="calendar__empty-note">날짜를 누르면 그날을 체크하거나 지울 수 있어요.</p>
      )}
    </section>
  )
}
