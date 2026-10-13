import { useEffect, useRef } from 'react'

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

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog || !open) return
    if (!dialog.open) dialog.showModal()
    return () => {
      if (dialog.open) dialog.close()
    }
  }, [open])

  const handleConfirm = () => {
    dialogRef.current?.close()
    onConfirm()
  }

  return (
    <dialog ref={dialogRef} className="dialog" onClose={onCancel}>
      <h2 className="dialog__title">{title}</h2>
      <p className="dialog__description">{description}</p>
      <div className="button-row button-row--end">
        <button type="button" className="button" onClick={() => dialogRef.current?.close()}>
          취소
        </button>
        <button type="button" className="button button--danger" onClick={handleConfirm}>
          {confirmLabel}
        </button>
      </div>
    </dialog>
  )
}
