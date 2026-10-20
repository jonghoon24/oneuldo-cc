import { useState } from 'react'
import type { EditResult } from '../hooks/useHabitStore'
import { currentStreak } from '../lib/streak'
import type { Habit } from '../lib/storage'
import { Calendar } from './Calendar'
import { ConfirmDialog } from './ConfirmDialog'
import { HabitForm } from './HabitForm'

type Props = {
  habit: Habit
  today: string
  canEdit: boolean
  onEdit: (id: string, name: string, startDate: string) => EditResult
  onDelete: (id: string) => void
  onToggle: (id: string, date: string) => void
}

export function HabitDetail({ habit, today, canEdit, onEdit, onDelete, onToggle }: Props) {
  const [editing, setEditing] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [prevCanEdit, setPrevCanEdit] = useState(canEdit)

  const streak = currentStreak(new Set(habit.completedDates), today)

  // 저장 오류로 편집이 막히면 열려 있던 편집 UI를 닫는다.
  if (canEdit !== prevCanEdit) {
    setPrevCanEdit(canEdit)
    if (!canEdit) {
      setEditing(false)
      setConfirmingDelete(false)
    }
  }

  return (
    <article className="detail">
      <header className="detail__header">
        <h2 className="detail__title">{habit.name}</h2>
        {editing ? (
          <HabitForm
            initialName={habit.name}
            initialStartDate={habit.createdDate}
            today={today}
            submitLabel="저장"
            onSubmit={(name, startDate) => onEdit(habit.id, name, startDate)}
            onClose={() => setEditing(false)}
          />
        ) : (
          <div className="button-row">
            <button
              type="button"
              className="button"
              onClick={() => setEditing(true)}
              disabled={!canEdit}
            >
              수정
            </button>
            <button
              type="button"
              className="button button--danger-outline"
              onClick={() => setConfirmingDelete(true)}
              disabled={!canEdit}
            >
              삭제
            </button>
          </div>
        )}
      </header>

      <div className="streak">
        <span className="streak__label">현재 연속</span>
        <span className="streak__value">{streak}일</span>
      </div>

      <Calendar habit={habit} today={today} canEdit={canEdit} onToggle={(date) => onToggle(habit.id, date)} />

      <ConfirmDialog
        open={confirmingDelete}
        title={`‘${habit.name}’ 습관을 삭제할까요?`}
        description="이 습관의 모든 체크 기록도 함께 영구 삭제되며 되돌릴 수 없어요."
        confirmLabel="삭제"
        onCancel={() => setConfirmingDelete(false)}
        onConfirm={() => {
          setConfirmingDelete(false)
          onDelete(habit.id)
        }}
      />
    </article>
  )
}
