import { useEffect, useRef, useState } from 'react'
import type { RenameResult } from '../hooks/useHabitStore'
import { currentStreak } from '../lib/streak'
import type { Habit } from '../lib/storage'
import { Calendar } from './Calendar'
import { ConfirmDialog } from './ConfirmDialog'
import { RenameForm } from './RenameForm'

type Props = {
  habit: Habit
  today: string
  canEdit: boolean
  onRename: (id: string, name: string) => RenameResult
  onDelete: (id: string) => void
  onToggle: (id: string, date: string) => void
}

export function HabitDetail({ habit, today, canEdit, onRename, onDelete, onToggle }: Props) {
  const [renaming, setRenaming] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [focusRenameButton, setFocusRenameButton] = useState(false)
  const renameButtonRef = useRef<HTMLButtonElement>(null)

  const streak = currentStreak(new Set(habit.completedDates), today, habit.createdDate)

  useEffect(() => {
    if (!focusRenameButton) return
    renameButtonRef.current?.focus()
    setFocusRenameButton(false)
  }, [focusRenameButton])

  // 저장 오류로 편집이 막히면 열려 있던 편집 UI를 닫는다.
  useEffect(() => {
    if (canEdit) return
    setRenaming(false)
    setConfirmingDelete(false)
  }, [canEdit])

  return (
    <article className="detail" aria-labelledby="habit-detail-title">
      <header className="detail__header">
        <h2 id="habit-detail-title" className="detail__title">
          {habit.name}
        </h2>
        {renaming ? (
          <RenameForm
            initialName={habit.name}
            onSubmit={(name) => onRename(habit.id, name)}
            onClose={(reason) => {
              setRenaming(false)
              if (reason !== 'failed') setFocusRenameButton(true)
            }}
          />
        ) : (
          <div className="button-row">
            <button
              ref={renameButtonRef}
              type="button"
              className="button"
              onClick={() => setRenaming(true)}
              disabled={!canEdit}
            >
              이름 변경
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

      <div className="streak" aria-live="polite">
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
