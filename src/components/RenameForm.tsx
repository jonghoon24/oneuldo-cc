import {
  useEffect,
  useId,
  useRef,
  useState,
  type ClipboardEvent,
  type DragEvent,
  type FormEvent,
} from 'react'
import type { RenameResult } from '../hooks/useHabitStore'
import { HABIT_NAME_MAX_LENGTH, NAME_ERROR_LINE_BREAK, hasLineBreak, nameLength } from '../lib/habitName'

type Props = {
  initialName: string
  onSubmit: (name: string) => RenameResult
  onClose: () => void
}

export function RenameForm({ initialName, onSubmit, onClose }: Props) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const composingRef = useRef(false)
  const [value, setValue] = useState(initialName)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  const length = nameLength(value.trim())

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (composingRef.current) return
    const result = onSubmit(value)
    if (result.ok || !result.message) onClose()
    else setError(result.message)
  }

  const rejectLineBreak = (text: string, event: ClipboardEvent | DragEvent) => {
    if (!hasLineBreak(text)) return
    event.preventDefault()
    setError(NAME_ERROR_LINE_BREAK)
  }

  return (
    <form className="rename-form" onSubmit={handleSubmit} noValidate>
      <label className="field-label" htmlFor={inputId}>
        새 이름
      </label>
      <input
        ref={inputRef}
        id={inputId}
        className={error ? 'text-input text-input--invalid' : 'text-input'}
        type="text"
        value={value}
        autoComplete="off"
        enterKeyHint="done"
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
      <div className="field-meta">
        {error ? (
          <p className="field-error">{error}</p>
        ) : (
          <span />
        )}
        <span className={length > HABIT_NAME_MAX_LENGTH ? 'counter counter--over' : 'counter'}>
          {length}/{HABIT_NAME_MAX_LENGTH}
        </span>
      </div>
      <div className="button-row">
        <button type="submit" className="button button--primary">
          저장
        </button>
        <button type="button" className="button" onClick={onClose}>
          취소
        </button>
      </div>
    </form>
  )
}
