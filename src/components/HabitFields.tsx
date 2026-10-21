// 습관 폼의 입력칸. 레이아웃과 제출은 HabitForm이 맡는다.
import { useId, type ClipboardEvent, type DragEvent, type Ref, type RefObject } from 'react'
import { HABIT_COLORS, HABIT_COLOR_NAMES, type HabitColor } from '../lib/habitColor'
import { HABIT_NAME_MAX_LENGTH, NAME_ERROR_LINE_BREAK, hasLineBreak, nameLength } from '../lib/habitName'
import { MIN_START_DATE } from '../lib/startDate'

type HabitNameInputProps = {
  id: string
  value: string
  invalid: boolean
  /** 한글 조합 중에는 제출하지 않도록 폼이 읽는다. */
  composingRef: RefObject<boolean>
  onChange: (value: string) => void
  onError: (message: string) => void
  inputRef?: Ref<HTMLInputElement>
  placeholder?: string
}

export function HabitNameInput({
  id,
  value,
  invalid,
  composingRef,
  onChange,
  onError,
  inputRef,
  placeholder,
}: HabitNameInputProps) {
  // <input>은 붙여넣은 줄바꿈을 조용히 지우므로 입력 전에 확인해 오류로 알린다.
  const rejectLineBreak = (text: string, event: ClipboardEvent | DragEvent) => {
    if (!hasLineBreak(text)) return
    event.preventDefault()
    onError(NAME_ERROR_LINE_BREAK)
  }

  return (
    <input
      ref={inputRef}
      id={id}
      className={invalid ? 'text-input text-input--invalid' : 'text-input'}
      type="text"
      value={value}
      placeholder={placeholder}
      autoComplete="off"
      enterKeyHint="done"
      onChange={(event) => onChange(event.target.value)}
      onCompositionStart={() => {
        composingRef.current = true
      }}
      onCompositionEnd={() => {
        composingRef.current = false
      }}
      onPaste={(event) => rejectLineBreak(event.clipboardData.getData('text'), event)}
      onDrop={(event) => rejectLineBreak(event.dataTransfer.getData('text'), event)}
    />
  )
}

/** 이름 입력칸 아래의 오류와 글자 수 */
export function HabitNameMeta({ value, error }: { value: string; error: string | null }) {
  const length = nameLength(value.trim())
  return (
    <div className="field-meta">
      {error ? <p className="field-error">{error}</p> : <span />}
      <span className={length > HABIT_NAME_MAX_LENGTH ? 'counter counter--over' : 'counter'}>
        {length}/{HABIT_NAME_MAX_LENGTH}
      </span>
    </div>
  )
}

type StartDateFieldProps = {
  value: string
  error: string | null
  today: string
  onChange: (value: string) => void
}

/** '시작일' 라벨, 날짜 입력칸과 오류 */
export function StartDateField({ value, error, today, onChange }: StartDateFieldProps) {
  const id = useId()
  return (
    <>
      <label className="field-label" htmlFor={id}>
        시작일
      </label>
      <input
        id={id}
        className={error ? 'text-input text-input--invalid' : 'text-input'}
        type="date"
        value={value}
        min={MIN_START_DATE}
        max={today}
        onChange={(event) => onChange(event.target.value)}
      />
      {error && <p className="field-error">{error}</p>}
    </>
  )
}

type ColorFieldProps = {
  value: HabitColor
  onChange: (value: HabitColor) => void
}

/** '색' 라벨과 팔레트 순서대로 놓인 색 견본 */
export function ColorField({ value, onChange }: ColorFieldProps) {
  const name = useId()
  return (
    <fieldset className="color-field">
      <legend className="field-label">색</legend>
      <div className="color-field__swatches">
        {HABIT_COLORS.map((color) => (
          <input
            key={color}
            type="radio"
            name={name}
            value={color}
            title={HABIT_COLOR_NAMES[color]}
            className={`color-swatch pen--${color}`}
            checked={value === color}
            onChange={() => onChange(color)}
          />
        ))}
      </div>
    </fieldset>
  )
}
