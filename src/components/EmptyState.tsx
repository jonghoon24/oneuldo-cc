type Props = {
  disabled: boolean
  onStart: () => void
}

export function EmptyState({ disabled, onStart }: Props) {
  return (
    <section className="empty-state">
      <h2 className="empty-state__title">매일 할 습관을 하나 정해 보세요</h2>
      <ul className="empty-state__features">
        <li>등록한 습관은 여기에서 매일 체크해요.</li>
        <li>체크한 날은 달력에 칠해지고, 이어 간 날만큼 연속 일수가 쌓여요.</li>
        <li>지난 날짜도 달력에서 체크하거나 지울 수 있어요.</li>
      </ul>
      <button type="button" className="button button--primary" onClick={onStart} disabled={disabled}>
        첫 습관 등록하기
      </button>
    </section>
  )
}
