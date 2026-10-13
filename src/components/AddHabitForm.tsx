import { useId, useRef, useState, type ClipboardEvent, type DragEvent, type FormEvent, type Ref } from 'react'
import type { AddResult } from '../hooks/useHabitStore'
import {
  HABIT_NAME_MAX_LENGTH,
  NAME_ERROR_LINE_BREAK,
  hasLineBreak,
  nameLength,
} from '../lib/habitName'

type Props = {
  disabled: boolean
  onAdd: (name: string) => AddResult
  inputRef: Ref<HTMLInputElement>
}

export function AddHabitForm({ disabled, onAdd, inputRef }: Props) {
  const inputId = useId()
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const composingRef = useRef(false)

  const length = nameLength(value.trim())
  const overLimit = length > HABIT_NAME_MAX_LENGTH

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (composingRef.current || disabled) return
    const result = onAdd(value)
    if (result.ok) {
      setValue('')
      setError(null)
    } else if (result.message) {
      setError(result.message)
    }
  }

  // <input>은 붙여넣은 줄바꿈을 조용히 지우므로 입력 전에 확인해 오류로 알린다.
  const rejectLineBreak = (text: string, event: ClipboardEvent | DragEvent) => {
    if (!hasLineBreak(text)) return
    event.preventDefault()
    setError(NAME_ERROR_LINE_BREAK)
  }

  return (
    <form className="add-form" onSubmit={handleSubmit} noValidate>
      <label className="field-label" htmlFor={inputId}>
        새 습관
      </label>
      <div className="add-form__row">
        <input
          ref={inputRef}
          id={inputId}
          className={error ? 'text-input text-input--invalid' : 'text-input'}
          type="text"
          value={value}
          placeholder="예: 물 2잔 마시기"
          autoComplete="off"
          enterKeyHint="done"
          disabled={disabled}
          onChange={(event) => {
            setValue(event.target.value)
            setError(null)
          }}
          onCompositionStart={() => {
            composingRef.current = true
          }}
          onCompositionEnd={() => {
            composingRef.current = false
          }}
          onPaste={(event) => rejectLineBreak(event.clipboardData.getData('text'), event)}
          onDrop={(event) => rejectLineBreak(event.dataTransfer.getData('text'), event)}
        />
        <button type="submit" className="button button--primary" disabled={disabled}>
          추가
        </button>
      </div>
      <div className="field-meta">
        {error ? (
          <p className="field-error">{error}</p>
        ) : (
          <span />
        )}
        <span className={overLimit ? 'counter counter--over' : 'counter'}>
          {length}/{HABIT_NAME_MAX_LENGTH}
        </span>
      </div>
    </form>
  )
}
