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
  /** saved: 저장했거나 바뀐 것이 없음, cancelled: 사용자가 취소함, failed: 저장소 쓰기 실패 */
  onClose: (reason: 'saved' | 'cancelled' | 'failed') => void
}

export function RenameForm({ initialName, onSubmit, onClose }: Props) {
  const inputId = useId()
  const errorId = useId()
  const counterId = useId()
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
    if (result.ok) onClose('saved')
    else if (result.message) setError(result.message)
    else onClose('failed')
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
        className="text-input"
        type="text"
        value={value}
        autoComplete="off"
        enterKeyHint="done"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${errorId} ${counterId}` : counterId}
        onChange={(event) => {
          setValue(event.target.value)
          setError(null)
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape' && !event.nativeEvent.isComposing) {
            event.preventDefault()
            onClose('cancelled')
          }
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
          <p id={errorId} className="field-error" role="alert">
            {error}
          </p>
        ) : (
          <span />
        )}
        <span
          id={counterId}
          className={length > HABIT_NAME_MAX_LENGTH ? 'counter counter--over' : 'counter'}
        >
          <span className="visually-hidden">글자 수 </span>
          {length}/{HABIT_NAME_MAX_LENGTH}
        </span>
      </div>
      <div className="button-row">
        <button type="submit" className="button button--primary">
          저장
        </button>
        <button type="button" className="button" onClick={() => onClose('cancelled')}>
          취소
        </button>
      </div>
    </form>
  )
}
