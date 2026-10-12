import { useEffect, useRef, useState } from 'react'
import type { RenameResult } from '../hooks/useHabitStore'
import { currentStreak, longestStreak } from '../lib/streak'
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
  const [prevCanEdit, setPrevCanEdit] = useState(canEdit)
  const renameButtonRef = useRef<HTMLButtonElement>(null)
  // 이름 변경 폼이 닫힌 뒤 다시 나타난 버튼으로 포커스를 돌려줄지 여부
  const focusRenameButtonRef = useRef(false)

  const streak = currentStreak(new Set(habit.completedDates), today)
  const longest = longestStreak(habit.completedDates, today)

  useEffect(() => {
    if (!focusRenameButtonRef.current) return
    focusRenameButtonRef.current = false
    renameButtonRef.current?.focus()
  })

  // 저장 오류로 편집이 막히면 열려 있던 편집 UI를 닫는다.
  if (canEdit !== prevCanEdit) {
    setPrevCanEdit(canEdit)
    if (!canEdit) {
      setRenaming(false)
      setConfirmingDelete(false)
    }
  }

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
              if (reason !== 'failed') focusRenameButtonRef.current = true
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
        <div className="streak__item">
          <span className="streak__label">현재 연속</span>
          <span className="streak__value">{streak}일</span>
        </div>
        <div className="streak__item">
          <span className="streak__label">최장 연속</span>
          <span className="streak__value">{longest}일</span>
        </div>
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
