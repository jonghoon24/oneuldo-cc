import { useEffect, useId, useRef } from 'react'

type Props = {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({ open, title, description, confirmLabel, onConfirm, onCancel }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)
  const titleId = useId()
  const descriptionId = useId()

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog || !open) return
    if (!dialog.open) dialog.showModal()
    cancelRef.current?.focus()
    return () => {
      if (dialog.open) dialog.close()
    }
  }, [open])

  const handleConfirm = () => {
    // 먼저 닫아 브라우저가 포커스를 되돌린 뒤 삭제한다. 이후 포커스 이동은 호출한 쪽이 맡는다.
    dialogRef.current?.close()
    onConfirm()
  }

  return (
    <dialog
      ref={dialogRef}
      className="dialog"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onClose={onCancel}
    >
      <h2 id={titleId} className="dialog__title">
        {title}
      </h2>
      <p id={descriptionId} className="dialog__description">
        {description}
      </p>
      <div className="button-row button-row--end">
        <button ref={cancelRef} type="button" className="button" onClick={() => dialogRef.current?.close()}>
          취소
        </button>
        <button type="button" className="button button--danger" onClick={handleConfirm}>
          {confirmLabel}
        </button>
      </div>
    </dialog>
  )
}
