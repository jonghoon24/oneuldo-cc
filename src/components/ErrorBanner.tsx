import type { StoreErrorReason } from '../hooks/useHabitStore'

const MESSAGES: Record<StoreErrorReason, { title: string; body: string }> = {
  access: {
    title: '브라우저 저장소에 접근할 수 없어요.',
    body: '사이트 데이터 저장이 차단되어 있는지 브라우저 설정을 확인해 주세요. 문제가 해결될 때까지 기록을 추가하거나 바꿀 수 없어요.',
  },
  parse: {
    title: '저장된 데이터를 읽을 수 없어요.',
    body: '데이터가 손상되었을 수 있어요. 기존 데이터를 보호하기 위해 변경 기능을 막았어요.',
  },
  write: {
    title: '변경 내용을 저장하지 못해 되돌렸어요.',
    body: '브라우저 저장 공간을 확인한 뒤 다시 불러와 주세요. 그 전까지는 기록을 추가하거나 바꿀 수 없어요.',
  },
}

type Props = {
  reason: StoreErrorReason
  onReload: () => void
}

export function ErrorBanner({ reason, onReload }: Props) {
  const message = MESSAGES[reason]
  return (
    <div className="error-banner">
      <div>
        <p className="error-banner__title">{message.title}</p>
        <p className="error-banner__body">{message.body}</p>
      </div>
      <button type="button" className="button" onClick={onReload}>
        다시 불러오기
      </button>
    </div>
  )
}
