// 등록 폼과 수정 폼. 이름·시작일 입력칸과 제출·취소 버튼이 같은 모양이고 제출 버튼 이름만 다르다.
import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import type { AddResult, EditResult } from '../hooks/useHabitStore'
import { HabitNameInput, HabitNameMeta, StartDateField } from './HabitFields'

type Props = {
  initialName: string
  initialStartDate: string
  today: string
  submitLabel: string
  onSubmit: (name: string, startDate: string) => AddResult | EditResult
  onClose: () => void
  placeholder?: string
}

export function HabitForm({
  initialName,
  initialStartDate,
  today,
  submitLabel,
  onSubmit,
  onClose,
  placeholder,
}: Props) {
  const nameId = useId()
  const nameRef = useRef<HTMLInputElement>(null)
  const composingRef = useRef(false)
  const [name, setName] = useState(initialName)
  const [startDate, setStartDate] = useState(initialStartDate)
  const [nameError, setNameError] = useState<string | null>(null)
  const [startError, setStartError] = useState<string | null>(null)

  useEffect(() => {
    nameRef.current?.focus()
    nameRef.current?.select()
  }, [])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (composingRef.current) return
    const result = onSubmit(name, startDate)
    // 칸별 오류가 없는 실패(저장 실패)는 오류 배너가 알리므로 폼을 닫는다.
    if (result.ok || (!result.nameError && !result.startDateError)) {
      onClose()
      return
    }
    setNameError(result.nameError ?? null)
    setStartError(result.startDateError ?? null)
  }

  return (
    <form className="habit-form" onSubmit={handleSubmit} noValidate>
      <label className="field-label" htmlFor={nameId}>
        이름
      </label>
      <HabitNameInput
        id={nameId}
        inputRef={nameRef}
        value={name}
        invalid={nameError !== null}
        placeholder={placeholder}
        composingRef={composingRef}
        onChange={(next) => {
          setName(next)
          setNameError(null)
        }}
        onError={setNameError}
      />
      <HabitNameMeta value={name} error={nameError} />
      <StartDateField
        value={startDate}
        error={startError}
        today={today}
        onChange={(next) => {
          setStartDate(next)
          setStartError(null)
        }}
      />
      <div className="button-row">
        <button type="submit" className="button button--primary">
          {submitLabel}
        </button>
        <button type="button" className="button" onClick={onClose}>
          취소
        </button>
      </div>
    </form>
  )
}
